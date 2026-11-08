import express from "express";
import "dotenv/config";
import { Pool } from "pg";
import argon2 from "argon2";

const app = express();
const port = Number(process.env.PORT ?? 3000);

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 5432),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

app.use(express.json());

app.post("/customers/register", async (request, response) => {
  const body = (request.body ?? {}) as Record<string, unknown>;

  const firstName =
    typeof body.firstName === "string" ? body.firstName.trim() : "";
  const lastName =
    typeof body.lastName === "string" ? body.lastName.trim() : "";
  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const address =
    typeof body.address === "string" ? body.address.trim() : "";
  const postalCode =
    typeof body.postalCode === "string" ? body.postalCode.trim() : "";
  const city =
    typeof body.city === "string" ? body.city.trim() : "";

  if (!firstName || !lastName || !email || !password || !address) {
    return response.status(400).json({
      message: "Izpolni vsa obvezna polja.",
    });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return response.status(400).json({
      message: "Vnesi veljaven e-poštni naslov.",
    });
  }

  if (password.length < 8) {
    return response.status(400).json({
      message: "Geslo mora vsebovati vsaj 8 znakov.",
    });
  }

  if (!/^\d+$/.test(postalCode)) {
    return response.status(400).json({
      message: "Poštna številka lahko vsebuje samo številke.",
    });
  }

  if (
    firstName.length > 100 ||
    lastName.length > 100 ||
    email.length > 254 ||
    phone.length > 30 ||
    postalCode.length > 20 || 
    city.length > 100
  ) {
    return response.status(400).json({
      message: "Eno ali več polj je predolgo.",
    });
  }

  try {
    const passwordHash = await argon2.hash(password);

    const result = await pool.query(
      `INSERT INTO customers
        (first_name, last_name, email, password_hash, phone, address, postal_code, city)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, first_name, last_name, email, phone, address, postal_code, city`,
      [
        firstName,
        lastName,
        email,
        passwordHash,
        phone || null,
        address,
        postalCode,
        city,
      ],
    );

    return response.status(201).json({
      message: "Registracija je uspela.",
      customer: result.rows[0],
    });
  } catch (error) {
    if ((error as { code?: string }).code === "23505") {
      return response.status(409).json({
        message: "E-poštni naslov je že registriran.",
      });
    }

    console.error("Customer registration failed:", error);

    return response.status(500).json({
      message: "Pri registraciji je prišlo do napake.",
    });
  }
});

app.get("/health", async (_request, response) => {
  try {
    await pool.query("SELECT 1");
    response.status(200).json({ status: "ok", database: "connected" });
  } catch (error) {
    console.error("Database connection failed:", error);
    response.status(503).json({ status: "error", database: "disconnected" });
  }
});

app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`);
});