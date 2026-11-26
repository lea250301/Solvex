import type { Router } from "express";
import type { Pool } from "pg";
import argon2 from "argon2";
import { startSession } from "./profiles.js";

// Open staff registration is an explicit policy for this school project.
export function installStaffAccountRoutes(router: Router, pool: Pool) {
  for (const role of ["employee", "manager"] as const) {
    const table = role === "employee" ? "employees" : "managers";
    router.post(`/${table}/register`, async (request, response) => {
      const body = (request.body ?? {}) as Record<string, unknown>;
      const firstName = typeof body.firstName === "string" ? body.firstName.trim() : "";
      const lastName = typeof body.lastName === "string" ? body.lastName.trim() : "";
      const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
      const password = typeof body.password === "string" ? body.password : "";
      const phone = typeof body.phone === "string" ? body.phone.trim() : "";
      const serviceType = typeof body.serviceType === "string" ? body.serviceType : "";
      if (!firstName || !lastName || !phone || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8 || password.length > 128 || firstName.length > 100 || lastName.length > 100 || email.length > 254 || phone.length > 30) {
        return response.status(400).json({ message: "Izpolni obvezna polja. Geslo mora imeti od 8 do 128 znakov." });
      }
      if (role === "employee" && !["cleaning", "electrical", "installer"].includes(serviceType)) {
        return response.status(400).json({ message: "Izberi veljavno specializacijo serviserja." });
      }
      try {
        const hash = await argon2.hash(password);
        const result = role === "employee"
          ? await pool.query("INSERT INTO employees (first_name,last_name,email,password_hash,phone,service_type) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id,first_name,last_name,email,service_type,profile_image_data", [firstName, lastName, email, hash, phone, serviceType])
          : await pool.query("INSERT INTO managers (first_name,last_name,email,password_hash,phone) VALUES ($1,$2,$3,$4,$5) RETURNING id,first_name,last_name,email,profile_image_data", [firstName, lastName, email, hash, phone]);
        return response.status(201).json({ message: "Registracija je uspela.", account: { ...result.rows[0], role } });
      } catch (error) {
        if ((error as { code?: string }).code === "23505") return response.status(409).json({ message: "E-poštni naslov je za izbrano vrsto računa že registriran." });
        console.error("Staff registration failed:", error);
        return response.status(500).json({ message: "Pri registraciji je prišlo do napake." });
      }
    });
  }

  router.post("/managers/login", async (request, response) => {
    const { email, password } = request.body ?? {};
    if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || email.length > 254 || typeof password !== "string" || !password || password.length > 128) {
      return response.status(400).json({ message: "Vnesi veljaven e-poštni naslov in geslo." });
    }
    try {
      const result = await pool.query("SELECT id,first_name,last_name,email,password_hash,profile_image_data FROM managers WHERE email=$1", [email.trim().toLowerCase()]);
      const manager = result.rows[0];
      if (!manager || !(await argon2.verify(manager.password_hash, password))) return response.status(401).json({ message: "E-poštni naslov ali geslo ni pravilno." });
      await startSession(request, response, pool, "manager", manager.id);
      return response.json({ account: { id: manager.id, first_name: manager.first_name, last_name: manager.last_name, email: manager.email, profile_image_data: manager.profile_image_data, role: "manager" } });
    } catch (error) {
      console.error("Manager login failed:", error);
      return response.status(500).json({ message: "Pri prijavi je prišlo do napake." });
    }
  });
}
