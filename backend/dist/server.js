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
app.get("/services", async (_request, response) => {
    try {
        const result = await pool.query(`SELECT
        s.id,
        s.service_type,
        s.status,
        s.scheduled_at,
        s.completed_at,
        s.notes,
        sp.name AS solar_plant_name,
        sp.installation_address,
        sp.postal_code,
        sp.city,
        c.first_name AS customer_first_name,
        c.last_name AS customer_last_name,
        e.first_name AS employee_first_name,
        e.last_name AS employee_last_name
      FROM services s
      JOIN solar_plants sp ON sp.id_solar_plants = s.id_solar_plant
      JOIN customers c ON c.id = sp.id_customer
      LEFT JOIN employees e ON e.id = s.id_employee
      ORDER BY s.scheduled_at NULLS LAST, s.id DESC`);
        return response.status(200).json({ services: result.rows });
    }
    catch (error) {
        console.error("Service list failed:", error);
        return response.status(500).json({
            message: "Seznama servisov ni bilo mogoče naložiti.",
        });
    }
});
app.get("/employees/:employeeId/services", async (request, response) => {
    const { employeeId } = request.params;
    if (!/^\d+$/.test(employeeId) || /^0+$/.test(employeeId)) {
        return response.status(400).json({ message: "ID zaposlenega ni veljaven." });
    }
    try {
        const result = await pool.query(`SELECT
        s.id,
        s.service_type,
        s.status,
        s.scheduled_at,
        s.completed_at,
        s.notes,
        sp.name AS solar_plant_name,
        sp.installation_address,
        sp.postal_code,
        sp.city,
        c.first_name AS customer_first_name,
        c.last_name AS customer_last_name,
        e.first_name AS employee_first_name,
        e.last_name AS employee_last_name
      FROM services s
      JOIN solar_plants sp ON sp.id_solar_plants = s.id_solar_plant
      JOIN customers c ON c.id = sp.id_customer
      LEFT JOIN employees e ON e.id = s.id_employee
      WHERE s.id_employee = $1
      ORDER BY s.scheduled_at NULLS LAST, s.id DESC`, [employeeId]);
        return response.status(200).json({ services: result.rows });
    }
    catch (error) {
        console.error("Assigned service list failed:", error);
        return response.status(500).json({
            message: "Seznama dodeljenih servisov ni bilo mogoče naložiti.",
        });
    }
});
app.get("/employees/:employeeId/service-reports", async (request, response) => {
    const { employeeId } = request.params;
    if (!/^\d+$/.test(employeeId) || /^0+$/.test(employeeId)) {
        return response.status(400).json({ message: "ID zaposlenega ni veljaven." });
    }
    try {
        const result = await pool.query(`SELECT
        sr.id,
        sr.id_service,
        s.service_type,
        sp.name AS solar_plant_name,
        sr.work_summary,
        sr.findings,
        sr.recommendations,
        sr.reported_at
      FROM service_reports sr
      JOIN services s ON s.id = sr.id_service
      JOIN solar_plants sp ON sp.id_solar_plants = s.id_solar_plant
      WHERE sr.id_employee = $1
      ORDER BY sr.reported_at DESC, sr.id DESC`, [employeeId]);
        return response.status(200).json({ reports: result.rows });
    }
    catch (error) {
        console.error("Service report list failed:", error);
        return response.status(500).json({
            message: "Seznama servisnih poročil ni bilo mogoče naložiti.",
        });
    }
});
app.post("/employees/:employeeId/service-reports", async (request, response) => {
    const { employeeId } = request.params;
    const body = (request.body ?? {});
    const serviceId = typeof body.id_service === "string" || typeof body.id_service === "number"
        ? String(body.id_service).trim()
        : "";
    const workSummary = typeof body.work_summary === "string" ? body.work_summary.trim() : "";
    const findings = typeof body.findings === "string" ? body.findings.trim() || null : null;
    const recommendations = typeof body.recommendations === "string"
        ? body.recommendations.trim() || null
        : null;
    const reportedAt = typeof body.reported_at === "string" && body.reported_at.trim()
        ? new Date(body.reported_at)
        : null;
    if (!/^\d+$/.test(employeeId) || /^0+$/.test(employeeId)) {
        return response.status(400).json({ message: "ID zaposlenega ni veljaven." });
    }
    if (!/^\d+$/.test(serviceId) || /^0+$/.test(serviceId)) {
        return response.status(400).json({ message: "Izberi veljaven servis." });
    }
    if (!workSummary) {
        return response.status(400).json({ message: "Povzetek dela je obvezen." });
    }
    if (reportedAt && Number.isNaN(reportedAt.getTime())) {
        return response.status(400).json({ message: "Datum poročila ni veljaven." });
    }
    try {
        const result = await pool.query(`WITH inserted_report AS (
        INSERT INTO service_reports
          (id_service, id_employee, work_summary, findings, recommendations, reported_at)
        SELECT $1, $2, $3, $4, $5, COALESCE($6::timestamptz, NOW())
        FROM services s
        WHERE s.id = $1 AND s.id_employee = $2
        RETURNING id, id_service, work_summary, findings, recommendations, reported_at
      )
      SELECT
        ir.id,
        ir.id_service,
        s.service_type,
        sp.name AS solar_plant_name,
        ir.work_summary,
        ir.findings,
        ir.recommendations,
        ir.reported_at
      FROM inserted_report ir
      JOIN services s ON s.id = ir.id_service
      JOIN solar_plants sp ON sp.id_solar_plants = s.id_solar_plant`, [
            serviceId,
            employeeId,
            workSummary,
            findings,
            recommendations,
            reportedAt?.toISOString() ?? null,
        ]);
        if (result.rowCount === 0) {
            return response.status(400).json({
                message: "Izbrani servis ni dodeljen prijavljenemu zaposlenemu.",
            });
        }
        return response.status(201).json({
            message: "Servisno poročilo je shranjeno.",
            report: result.rows[0],
        });
    }
    catch (error) {
        if (error.code === "23505") {
            return response.status(409).json({
                message: "Za ta servis servisno poročilo že obstaja.",
            });
        }
        console.error("Service report creation failed:", error);
        return response.status(500).json({
            message: "Servisnega poročila ni bilo mogoče shraniti.",
        });
    }
});
app.post("/employees/login", async (request, response) => {
    const body = (request.body ?? {});
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!email || !password) {
        return response.status(400).json({
            message: "Vnesi e-poštni naslov in geslo.",
        });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
        return response.status(400).json({
            message: "Vnesi veljaven e-poštni naslov.",
        });
    }
    try {
        const result = await pool.query(`SELECT id, first_name, last_name, email, password_hash, service_type
      FROM employees
      WHERE email = $1`, [email]);
        const employee = result.rows[0];
        if (!employee || !(await argon2.verify(employee.password_hash, password))) {
            return response.status(401).json({
                message: "E-poštni naslov ali geslo ni pravilno.",
            });
        }
        return response.status(200).json({
            message: "Prijava je uspela.",
            employee: {
                id: employee.id,
                first_name: employee.first_name,
                last_name: employee.last_name,
                email: employee.email,
                service_type: employee.service_type,
            },
        });
    }
    catch (error) {
        console.error("Employee login failed:", error);
        return response.status(500).json({
            message: "Pri prijavi je prišlo do napake.",
        });
    }
});
app.post("/customers/register", async (request, response) => {
    const body = (request.body ?? {});
    const firstName = typeof body.firstName === "string" ? body.firstName.trim() : "";
    const lastName = typeof body.lastName === "string" ? body.lastName.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const address = typeof body.address === "string" ? body.address.trim() : "";
    const postalCode = typeof body.postalCode === "string" ? body.postalCode.trim() : "";
    const city = typeof body.city === "string" ? body.city.trim() : "";
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
    if (firstName.length > 100 ||
        lastName.length > 100 ||
        email.length > 254 ||
        phone.length > 30 ||
        postalCode.length > 20 ||
        city.length > 100) {
        return response.status(400).json({
            message: "Eno ali več polj je predolgo.",
        });
    }
    try {
        const passwordHash = await argon2.hash(password);
        const result = await pool.query(`INSERT INTO customers
        (first_name, last_name, email, password_hash, phone, address, postal_code, city)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, first_name, last_name, email, phone, address, postal_code, city`, [
            firstName,
            lastName,
            email,
            passwordHash,
            phone || null,
            address,
            postalCode,
            city,
        ]);
        return response.status(201).json({
            message: "Registracija je uspela.",
            customer: result.rows[0],
        });
    }
    catch (error) {
        if (error.code === "23505") {
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
    }
    catch (error) {
        console.error("Database connection failed:", error);
        response.status(503).json({ status: "error", database: "disconnected" });
    }
});
app.listen(port, () => {
    console.log(`Backend listening on http://localhost:${port}`);
});
