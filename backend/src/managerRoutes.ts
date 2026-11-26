import type { Router } from "express";
import type { Pool } from "pg";
import { requireSession } from "./profiles.js";

export function installManagerRoutes(router: Router, pool: Pool) {
  router.get("/managers/overview", requireSession(pool, ["manager"]), async (_request, response) => {
    try {
      const result = await pool.query(`SELECT
        (SELECT COUNT(*)::int FROM services WHERE status NOT IN ('completed','cancelled')) AS active_services,
        (SELECT COUNT(*)::int FROM service_requests WHERE status IN ('submitted','reviewing')) AS pending_requests,
        (SELECT COUNT(*)::int FROM employees) AS employees,
        (SELECT COUNT(*)::int FROM service_reports WHERE submitted_at IS NOT NULL) AS submitted_reports`);
      return response.json({ overview: result.rows[0] });
    } catch {
      return response.status(500).json({ message: "Pregleda ni bilo mogoče naložiti." });
    }
  });
  router.get("/managers/requests", requireSession(pool, ["manager"]), async (_request, response) => {
    try {
      const result = await pool.query(`SELECT r.id,r.request_type,r.description,r.status,r.preferred_date,r.requested_at,
        sp.name AS solar_plant_name,sp.installation_address,sp.city,c.first_name AS customer_first_name,c.last_name AS customer_last_name
        FROM service_requests r JOIN solar_plants sp ON sp.id_solar_plants=r.id_solar_plant
        JOIN customers c ON c.id=sp.id_customer ORDER BY r.requested_at DESC,r.id DESC`);
      return response.json({ requests: result.rows });
    } catch {
      return response.status(500).json({ message: "Zahtevkov ni bilo mogoče naložiti." });
    }
  });
  router.get("/managers/employees", requireSession(pool, ["manager"]), async (_request, response) => {
    try {
      const result = await pool.query(`SELECT e.id,e.first_name,e.last_name,e.email,e.service_type,
        COUNT(s.id) FILTER (WHERE s.status NOT IN ('completed','cancelled'))::int AS active_services
        FROM employees e LEFT JOIN services s ON s.id_employee=e.id
        GROUP BY e.id ORDER BY e.last_name,e.first_name,e.id`);
      return response.json({ employees: result.rows });
    } catch {
      return response.status(500).json({ message: "Serviserjev ni bilo mogoče naložiti." });
    }
  });
  router.get("/managers/service-reports", requireSession(pool, ["manager"]), async (_request, response) => {
    try {
      const result = await pool.query(`SELECT sr.id,sr.id_service,sr.work_summary,sr.findings,sr.recommendations,sr.reported_at,sr.submitted_at,
        s.service_type,sp.name AS solar_plant_name,e.first_name AS employee_first_name,e.last_name AS employee_last_name
        FROM service_reports sr JOIN services s ON s.id=sr.id_service JOIN solar_plants sp ON sp.id_solar_plants=s.id_solar_plant
        JOIN employees e ON e.id=sr.id_employee WHERE sr.submitted_at IS NOT NULL ORDER BY sr.submitted_at DESC,sr.id DESC`);
      return response.json({ reports: result.rows });
    } catch {
      return response.status(500).json({ message: "Oddanih poročil ni bilo mogoče naložiti." });
    }
  });
}
