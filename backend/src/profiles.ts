import type { Request, Response, Router, RequestHandler } from "express";
import type { Pool } from "pg";
import { createHash, randomBytes } from "node:crypto";
import argon2 from "argon2";

export type Role = "customer" | "employee" | "manager";
export type Account = { id: string; first_name: string; last_name: string; email: string; profile_image_data: string | null; role: Role; service_type?: string };
const cookieName = "solvex_session";
const sessionSeconds = 60 * 60 * 24 * 7;

function cookieOptions(request: Request) {
  return { httpOnly: true, sameSite: "lax" as const, path: "/api", secure: request.secure || request.get("x-forwarded-proto")?.split(",")[0]?.trim() === "https" };
}

function tokenHash(request: Request) {
  const token = request.headers.cookie?.split(";").map(value => value.trim()).find(value => value.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1);
  return token && /^[a-f0-9]{64}$/.test(token) ? createHash("sha256").update(token).digest("hex") : null;
}

export async function startSession(request: Request, response: Response, pool: Pool, role: Role, id: string) {
  const token = randomBytes(32).toString("hex");
  const hash = createHash("sha256").update(token).digest("hex");
  const column = { customer: "customer_id", employee: "employee_id", manager: "manager_id" }[role];
  await pool.query(`INSERT INTO account_sessions (token_hash, ${column}, expires_at) VALUES ($1, $2, NOW() + INTERVAL '7 days')`, [hash, id]);
  response.cookie(cookieName, token, { ...cookieOptions(request), maxAge: sessionSeconds * 1000 });
}

export async function getAccount(request: Request, pool: Pool): Promise<Account | null> {
  const hash = tokenHash(request);
  if (!hash) return null;
  const session = await pool.query("SELECT customer_id, employee_id, manager_id FROM account_sessions WHERE token_hash = $1 AND expires_at > NOW()", [hash]);
  if (!session.rows[0]) return null;
  const role: Role = session.rows[0].customer_id ? "customer" : session.rows[0].employee_id ? "employee" : "manager";
  const id = session.rows[0].customer_id ?? session.rows[0].employee_id ?? session.rows[0].manager_id;
  const table = { customer: "customers", employee: "employees", manager: "managers" }[role];
  const extra = role === "employee" ? ", service_type" : "";
  const result = await pool.query(`SELECT id, first_name, last_name, email, profile_image_data${extra} FROM ${table} WHERE id = $1`, [id]);
  return result.rows[0] ? { ...result.rows[0], role } : null;
}

export function sessionAccount(response: Response): Account {
  return response.locals.account as Account;
}

export function requireSession(pool: Pool, roles: Role[], matchEmployee = false): RequestHandler {
  return async (request, response, next) => {
    response.set("Cache-Control", "no-store");
    try {
      const account = await getAccount(request, pool);
      if (!account) { response.status(401).json({ message: "Za dostop se prijavi." }); return; }
      if (!roles.includes(account.role)) { response.status(403).json({ message: "Za to dejanje nimaš dovoljenja." }); return; }
      if (matchEmployee) {
        const employeeId = request.params.employeeId;
        if (typeof employeeId !== "string" || !/^[1-9]\d*$/.test(employeeId)) { response.status(400).json({ message: "ID zaposlenega ni veljaven." }); return; }
        if (account.role === "employee" && account.id !== employeeId) { response.status(403).json({ message: "Dostopaš lahko samo do svojih nalog in poročil." }); return; }
      }
      response.locals.account = account;
      next();
    } catch {
      response.status(500).json({ message: "Dovoljenj ni bilo mogoče preveriti." });
    }
  };
}

function validImage(image: unknown) {
  if (image === null) return true;
  if (typeof image !== "string" || image.length > 350000) return false;
  const match = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(image);
  if (!match) return false;
  const bytes = Buffer.from(match[2], "base64");
  if (bytes.length > 256 * 1024 || bytes.toString("base64") !== match[2]) return false;
  if (match[1] === "png") return bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (match[1] === "jpeg") return bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  return bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP";
}

export function installProfileRoutes(router: Router, pool: Pool) {
  router.post("/customers/login", async (request, response) => {
    const { email, password } = request.body ?? {};
    if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || email.length > 254 || typeof password !== "string" || !password) {
      return response.status(400).json({ message: "Vnesi veljaven e-poštni naslov in geslo." });
    }
    try {
      const result = await pool.query("SELECT id, first_name, last_name, email, password_hash, profile_image_data FROM customers WHERE email = $1", [email.trim().toLowerCase()]);
      const customer = result.rows[0];
      if (!customer || !(await argon2.verify(customer.password_hash, password))) return response.status(401).json({ message: "E-poštni naslov ali geslo ni pravilno." });
      await startSession(request, response, pool, "customer", customer.id);
      return response.json({ account: { id: customer.id, first_name: customer.first_name, last_name: customer.last_name, email: customer.email, profile_image_data: customer.profile_image_data, role: "customer" } });
    } catch (error) {
      console.error("Customer login failed:", error);
      return response.status(500).json({ message: "Pri prijavi je prišlo do napake." });
    }
  });

  router.get("/auth/me", async (request, response) => {
    response.set("Cache-Control", "no-store");
    try {
      const account = await getAccount(request, pool);
      return account ? response.json({ account }) : response.status(401).json({ message: "Za ogled profila se prijavi." });
    } catch {
      return response.status(500).json({ message: "Profila ni bilo mogoče naložiti." });
    }
  });

  router.post("/auth/logout", async (request, response) => {
    try {
      const hash = tokenHash(request);
      if (hash) await pool.query("DELETE FROM account_sessions WHERE token_hash = $1", [hash]);
      response.clearCookie(cookieName, cookieOptions(request));
      return response.json({ message: "Odjava je uspela." });
    } catch {
      return response.status(500).json({ message: "Odjava ni uspela. Poskusi znova." });
    }
  });

  router.get("/account/profile", async (request, response) => {
    response.set("Cache-Control", "no-store");
    try {
      const account = await getAccount(request, pool);
      if (!account) return response.status(401).json({ message: "Za ogled profila se prijavi." });
      if (account.role !== "customer") return response.json({ account, plants: [], services: [] });
      const plants = await pool.query(`SELECT id_solar_plants AS id, name, installation_address, postal_code, city, installed_capacity_kw, panel_count FROM solar_plants WHERE id_customer = $1 ORDER BY id_solar_plants`, [account.id]);
      const services = await pool.query(`SELECT s.id, s.service_type, s.completed_at, s.scheduled_at, sp.name AS solar_plant_name
        FROM services s JOIN solar_plants sp ON sp.id_solar_plants = s.id_solar_plant
        WHERE sp.id_customer = $1 AND s.status = 'completed'
        ORDER BY COALESCE(s.completed_at, s.scheduled_at) DESC NULLS LAST, s.id DESC`, [account.id]);
      return response.json({ account, plants: plants.rows, services: services.rows });
    } catch (error) {
      console.error("Profile read failed:", error);
      return response.status(500).json({ message: "Profila ni bilo mogoče naložiti." });
    }
  });

  router.put("/account/photo", async (request, response) => {
    response.set("Cache-Control", "no-store");
    try {
      const account = await getAccount(request, pool);
      if (!account) return response.status(401).json({ message: "Za spremembo fotografije se prijavi." });
      const image: unknown = request.body?.image;
      if (!validImage(image)) return response.status(400).json({ message: "Izberi PNG, JPEG ali WebP sliko do 256 KB." });
      const table = { customer: "customers", employee: "employees", manager: "managers" }[account.role];
      await pool.query(`UPDATE ${table} SET profile_image_data = $1 WHERE id = $2`, [image, account.id]);
      return response.json({ account: { ...account, profile_image_data: image } });
    } catch {
      return response.status(500).json({ message: "Fotografije ni bilo mogoče shraniti." });
    }
  });
}
