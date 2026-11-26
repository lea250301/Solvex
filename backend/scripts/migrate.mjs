import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 5432),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});
const client = await pool.connect();
try {
  await client.query('BEGIN');
  await client.query('SELECT pg_advisory_xact_lock(730107)');
  await client.query(`CREATE TABLE IF NOT EXISTS solvex_migrations (
    name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);
  const schemaSql = await readFile(new URL('../../database/schema.sql', import.meta.url), 'utf8');
  const markers = [...schemaSql.matchAll(/^-- migration: ([a-z0-9-]+)\r?$/gm)];
  const migrations = [{ name: '001-initial-schema', sql: schemaSql.slice(0, markers[0]?.index ?? schemaSql.length) }];
  for (let index = 0; index < markers.length; index++) {
    migrations.push({ name: markers[index][1], sql: schemaSql.slice(markers[index].index, markers[index + 1]?.index ?? schemaSql.length) });
  }
  let applied = 0;
  for (const migration of migrations) {
    const existing = await client.query('SELECT name FROM solvex_migrations WHERE name = $1', [migration.name]);
    if (existing.rowCount) continue;
    await client.query(migration.sql);
    await client.query('INSERT INTO solvex_migrations (name) VALUES ($1)', [migration.name]);
    console.log(`Applied ${migration.name}`);
    applied++;
  }
  if (!applied) console.log('Database schema is up to date');
  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
  await pool.end();
}
