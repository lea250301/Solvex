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
  const result = await client.query('SELECT name FROM solvex_migrations WHERE name = $1', ['001-initial-schema']);
  if (result.rowCount === 0) {
    const sql = await readFile(new URL('../../database/schema.sql', import.meta.url), 'utf8');
    await client.query(sql);
    await client.query('INSERT INTO solvex_migrations (name) VALUES ($1)', ['001-initial-schema']);
    console.log('Applied 001-initial-schema');
  } else {
    console.log('Database schema is up to date');
  }
  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
  await pool.end();
}
