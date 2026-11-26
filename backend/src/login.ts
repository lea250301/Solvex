import type { Router } from "express";
import type { Pool } from "pg";
import argon2 from "argon2";
import { startSession, type Role } from "./profiles.js";

type LoginAccount = { id: string; first_name: string; last_name: string; email: string; profile_image_data: string | null; password_hash: string; role: Role; service_type: string | null };

export function installLoginRoute(router: Router, pool: Pool) {
  router.post("/auth/login", async (request, response) => {
    response.set("Cache-Control", "no-store");
    const body = request.body ?? {};
    const identifier = typeof body.identifier === "string" ? body.identifier.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!identifier || identifier.length > 254 || !password || password.length > 128) {
      return response.status(400).json({ message: "Vnesi e-pošto ali uporabniško ime in geslo." });
    }
    try {
      const result = await pool.query<LoginAccount>(`
        SELECT c.id,c.first_name,c.last_name,c.email,c.profile_image_data,c.password_hash,'customer' AS role,NULL::text AS service_type
          FROM customers c LEFT JOIN account_usernames u ON u.customer_id=c.id WHERE LOWER(c.email)=$1 OR u.username=$1
        UNION ALL
        SELECT e.id,e.first_name,e.last_name,e.email,e.profile_image_data,e.password_hash,'employee' AS role,e.service_type
          FROM employees e LEFT JOIN account_usernames u ON u.employee_id=e.id WHERE LOWER(e.email)=$1 OR u.username=$1
        UNION ALL
        SELECT m.id,m.first_name,m.last_name,m.email,m.profile_image_data,m.password_hash,'manager' AS role,NULL::text AS service_type
          FROM managers m LEFT JOIN account_usernames u ON u.manager_id=m.id WHERE LOWER(m.email)=$1 OR u.username=$1`, [identifier]);
      const matches: LoginAccount[] = [];
      for (const account of result.rows) {
        if (await argon2.verify(account.password_hash, password)) matches.push(account);
      }
      if (matches.length === 0) return response.status(401).json({ message: "Prijavni podatki niso pravilni." });
      // Never pick a privileged role by table order when old accounts share credentials.
      if (matches.length !== 1) return response.status(409).json({ message: "Podatki ustrezajo več računom. Uporabi enolično uporabniško ime." });
      const account = matches[0];
      await startSession(request, response, pool, account.role, account.id);
      return response.json({ account: {
        id: account.id, first_name: account.first_name, last_name: account.last_name, email: account.email,
        profile_image_data: account.profile_image_data, role: account.role,
        ...(account.role === "employee" ? { service_type: account.service_type } : {}),
      } });
    } catch (error) {
      console.error("Unified login failed:", error);
      return response.status(500).json({ message: "Pri prijavi je prišlo do napake." });
    }
  });
}
