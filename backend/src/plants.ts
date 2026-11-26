import type { Router, Response } from "express";
import type { Pool } from "pg";
import { requireSession, sessionAccount } from "./profiles.js";

type PlantFields = {
  name: string; installation_address: string; postal_code: string; city: string;
  manufacturer: string | null; installed_capacity_kw: string | null;
  panel_count: number | null; has_battery: boolean; battery_capacity_kwh: string | null;
  installed_on: string | null; installation_year: number | null;
};
const fields = ["name", "installation_address", "postal_code", "city", "manufacturer", "installed_capacity_kw", "panel_count", "has_battery", "battery_capacity_kwh", "installed_on", "installation_year"] as const;
const columns = `id_solar_plants AS id, ${fields.map(field => field === "installed_on" ? "to_char(installed_on,'YYYY-MM-DD') AS installed_on" : field).join(", ")}`;
class InvalidPlant extends Error {}
const invalid = (message: string): never => { throw new InvalidPlant(message); };

function text(value: unknown, label: string, max: number, optional = false): string | null {
  if (optional && value === null) return null;
  if (typeof value !== "string") return invalid(`${label}: pričakovano je besedilo.`);
  const trimmed = value.trim();
  if (optional && !trimmed) return null;
  if (!trimmed || [...trimmed].length > max) return invalid(`${label}: vnesi od 1 do ${max} znakov.`);
  return trimmed;
}

function decimal(value: unknown, label: string): string | null {
  if (value === null) return null;
  if (typeof value !== "string" && typeof value !== "number") return invalid(`${label}: vnesi pozitivno število.`);
  const input = String(value).trim();
  if (!/^\d{1,8}(\.\d{1,2})?$/.test(input) || Number(input) <= 0) return invalid(`${label}: vnesi pozitivno število do 99999999.99 z največ dvema decimalkama.`);
  return input;
}

function integer(value: unknown, label: string, max: number): number | null {
  if (value === null) return null;
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1 || value > max) return invalid(`${label}: vnesi celo število med 1 in ${max}.`);
  return value;
}

function date(value: unknown): string | null {
  if (value === null) return null;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith("0000")) return invalid("Datum namestitve mora biti veljaven datum YYYY-MM-DD.");
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) return invalid("Datum namestitve ni veljaven.");
  return value;
}

function parseInput(body: unknown): Partial<PlantFields> {
  if (!body || typeof body !== "object" || Array.isArray(body)) return invalid("Pošlji objekt s podatki elektrarne.");
  const input = body as Record<string, unknown>;
  if (!Object.keys(input).length || Object.keys(input).some(key => !fields.includes(key as keyof PlantFields))) return invalid("Podana so neznana polja ali ni podatkov. Lastnika ni mogoče spreminjati.");
  const result: Partial<PlantFields> = {};
  if (Object.hasOwn(input, "name")) result.name = text(input.name, "Ime", 100)!;
  if (Object.hasOwn(input, "installation_address")) result.installation_address = text(input.installation_address, "Naslov", 1000)!;
  if (Object.hasOwn(input, "postal_code")) {
    const postal = text(input.postal_code, "Poštna številka", 20)!;
    if (!/^\d+$/.test(postal)) return invalid("Poštna številka mora vsebovati samo števke.");
    result.postal_code = postal;
  }
  if (Object.hasOwn(input, "city")) result.city = text(input.city, "Kraj", 100)!;
  if (Object.hasOwn(input, "manufacturer")) result.manufacturer = text(input.manufacturer, "Proizvajalec", 100, true);
  if (Object.hasOwn(input, "installed_capacity_kw")) result.installed_capacity_kw = decimal(input.installed_capacity_kw, "Moč elektrarne");
  if (Object.hasOwn(input, "panel_count")) result.panel_count = integer(input.panel_count, "Število panelov", 2147483647);
  if (Object.hasOwn(input, "installation_year")) result.installation_year = integer(input.installation_year, "Leto namestitve", 9999);
  if (Object.hasOwn(input, "battery_capacity_kwh")) result.battery_capacity_kwh = decimal(input.battery_capacity_kwh, "Kapaciteta baterije");
  if (Object.hasOwn(input, "has_battery")) {
    if (typeof input.has_battery !== "boolean") return invalid("Prisotnost baterije mora biti true ali false.");
    result.has_battery = input.has_battery;
  }
  if (Object.hasOwn(input, "installed_on")) result.installed_on = date(input.installed_on);
  return result;
}

function validatePlant(plant: Partial<PlantFields>): PlantFields {
  if (!plant.name || !plant.installation_address || !plant.postal_code || !plant.city) return invalid("Ime, naslov, poštna številka in kraj so obvezni.");
  if (!plant.has_battery && plant.battery_capacity_kwh !== null) return invalid("Kapaciteto baterije lahko vneseš samo za elektrarno z baterijo.");
  if (plant.installed_on) {
    const year = Number(plant.installed_on.slice(0, 4));
    if (plant.installation_year !== null && plant.installation_year !== year) return invalid("Leto in datum namestitve se morata ujemati.");
    plant.installation_year = year;
  }
  return plant as PlantFields;
}

function validId(value: unknown): value is string {
  return typeof value === "string" && /^[1-9]\d{0,18}$/.test(value) && BigInt(value) <= 9223372036854775807n;
}

function failure(response: Response, error: unknown) {
  if (error instanceof InvalidPlant) return response.status(400).json({ message: error.message });
  if ((error as { code?: string }).code === "23505") return response.status(409).json({ message: "Elektrarno s tem imenom že imaš. Izberi drugo ime." });
  console.error("Owner plant request failed:", error);
  return response.status(500).json({ message: "Podatkov elektrarne ni bilo mogoče obdelati." });
}

export function installPlantRoutes(router: Router, pool: Pool) {
  const ownerOnly = requireSession(pool, ["customer"]);
  router.get("/plants", ownerOnly, async (_request, response) => {
    try {
      const result = await pool.query(`SELECT ${columns} FROM solar_plants WHERE id_customer=$1 ORDER BY name,id_solar_plants`, [sessionAccount(response).id]);
      return response.json({ plants: result.rows });
    } catch (error) { return failure(response, error); }
  });
  router.get("/plants/:plantId", ownerOnly, async (request, response) => {
    if (!validId(request.params.plantId)) return response.status(400).json({ message: "ID elektrarne ni veljaven." });
    try {
      const result = await pool.query(`SELECT ${columns} FROM solar_plants WHERE id_solar_plants=$1 AND id_customer=$2`, [request.params.plantId, sessionAccount(response).id]);
      return result.rows[0] ? response.json({ plant: result.rows[0] }) : response.status(404).json({ message: "Elektrarna ni bila najdena." });
    } catch (error) { return failure(response, error); }
  });
  router.post("/plants", ownerOnly, async (request, response) => {
    try {
      const plant = validatePlant({ manufacturer: null, installed_capacity_kw: null, panel_count: null, has_battery: false, battery_capacity_kwh: null, installed_on: null, installation_year: null, ...parseInput(request.body) });
      const result = await pool.query(`INSERT INTO solar_plants (id_customer,${fields.join(",")}) VALUES ($1,${fields.map((_, index) => `$${index + 2}`).join(",")}) RETURNING ${columns}`, [sessionAccount(response).id, ...fields.map(field => plant[field])]);
      return response.status(201).json({ plant: result.rows[0] });
    } catch (error) { return failure(response, error); }
  });
  router.patch("/plants/:plantId", ownerOnly, async (request, response) => {
    if (!validId(request.params.plantId)) return response.status(400).json({ message: "ID elektrarne ni veljaven." });
    // Lock the owned row while validating dependent fields, so concurrent patches cannot lose updates.
    const client = await pool.connect().catch(() => null);
    if (!client) return response.status(500).json({ message: "Podatkov elektrarne ni bilo mogoče obdelati." });
    try {
      await client.query("BEGIN");
      const current = await client.query(`SELECT ${columns} FROM solar_plants WHERE id_solar_plants=$1 AND id_customer=$2 FOR UPDATE`, [request.params.plantId, sessionAccount(response).id]);
      if (!current.rows[0]) {
        await client.query("ROLLBACK");
        return response.status(404).json({ message: "Elektrarna ni bila najdena." });
      }
      const plant = validatePlant({ ...current.rows[0], ...parseInput(request.body) });
      const result = await client.query(`UPDATE solar_plants SET ${fields.map((field, index) => `${field}=$${index + 3}`).join(",")} WHERE id_solar_plants=$1 AND id_customer=$2 RETURNING ${columns}`, [request.params.plantId, sessionAccount(response).id, ...fields.map(field => plant[field])]);
      await client.query("COMMIT");
      return response.json({ plant: result.rows[0] });
    } catch (error) {
      await client.query("ROLLBACK");
      return failure(response, error);
    } finally { client.release(); }
  });
}
