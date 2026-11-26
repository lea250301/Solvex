import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import type { Server } from 'node:http';
import { Pool } from 'pg';
import argon2 from 'argon2';
import { app, pool } from '../src/app.js';

// Each run gets an isolated schema, leaving application data untouched.
const schema = `solvex_test_${process.pid}_${Date.now()}`;
const admin = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 5432),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});
pool.options.options = `-c search_path=${schema}`;
let server: Server;
let base: string;
let employeeId: string;
let serviceId: string;
let reportId: string;

async function request(path: string, method = 'GET', body?: unknown) {
  const response = await fetch(`${base}/api${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: response.status, body: await response.json() };
}

before(async () => {
  await admin.query(`CREATE SCHEMA ${schema}`);
  await pool.query(await readFile(new URL('../../database/schema.sql', import.meta.url), 'utf8'));
  const hash = await argon2.hash('TestPassword123!');
  const employee = await pool.query(`INSERT INTO employees
    (first_name,last_name,email,password_hash,phone,service_type)
    VALUES ('Test','Serviser','test@example.com',$1,'000','electrical') RETURNING id`, [hash]);
  employeeId = employee.rows[0].id;
  const customer = await pool.query(`INSERT INTO customers
    (first_name,last_name,email,password_hash,address,postal_code,city)
    VALUES ('Test','Lastnik','owner@example.com',$1,'Test 1','2000','Maribor') RETURNING id`, [hash]);
  const plant = await pool.query(`INSERT INTO solar_plants
    (id_customer,name,installation_address,postal_code,city)
    VALUES ($1,'Test elektrarna','Test 1','2000','Maribor') RETURNING id_solar_plants`, [customer.rows[0].id]);
  const service = await pool.query(`INSERT INTO services (id_solar_plant,service_type,id_employee)
    VALUES ($1,'electrical',$2) RETURNING id`, [plant.rows[0].id_solar_plants, employeeId]);
  serviceId = service.rows[0].id;
  server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  base = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  if (server) await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  await pool.end();
  await admin.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
  await admin.end();
});

describe('API s pravo PostgreSQL bazo', () => {
  it('preveri povezavo z bazo', async () => {
    const result = await request('/health');
    assert.equal(result.status, 200);
    assert.equal(result.body.database, 'connected');
  });

  it('zavrne neveljaven e-poštni naslov pri prijavi', async () => {
    const result = await request('/employees/login', 'POST', { email: 'invalid', password: 'TestPassword123!' });
    assert.equal(result.status, 400);
    assert.equal(result.body.message, 'Vnesi veljaven e-poštni naslov.');
  });

  it('zavrne prekratko geslo lastnika pred zapisom v bazo', async () => {
    const result = await request('/customers/register', 'POST', {
      firstName: 'Test', lastName: 'Lastnik', email: 'short@example.com',
      password: 'short', address: 'Test 1', postalCode: '2000', city: 'Maribor',
    });
    assert.equal(result.status, 400);
    const saved = await pool.query('SELECT id FROM customers WHERE email = $1', ['short@example.com']);
    assert.equal(saved.rowCount, 0);
  });

  it('zavrne neveljavno prijavo in napačno geslo', async () => {
    assert.equal((await request('/employees/login', 'POST', {})).status, 400);
    assert.equal((await request('/employees/login', 'POST', { email: 'test@example.com', password: 'wrong' })).status, 401);
  });

  it('prijavi zaposlenega brez razkritja gesla', async () => {
    const result = await request('/employees/login', 'POST', { email: ' TEST@example.com ', password: 'TestPassword123!' });
    assert.equal(result.status, 200);
    assert.equal(result.body.employee.id, employeeId);
    assert.equal(result.body.employee.password_hash, undefined);
  });

  it('vrne dodeljene servise in zavrne napačen ID', async () => {
    const result = await request(`/employees/${employeeId}/services`);
    assert.equal(result.status, 200);
    assert.equal(result.body.services[0].id, serviceId);
    assert.equal((await request('/employees/0/services')).status, 400);
    assert.deepEqual((await request('/employees/999999/services')).body.services, []);
  });

  it('preveri obvezna polja in dodelitev pred ustvarjanjem poročila', async () => {
    assert.equal((await request(`/employees/${employeeId}/service-reports`, 'POST', { id_service: serviceId })).status, 400);
    assert.equal((await request('/employees/999999/service-reports', 'POST', { id_service: serviceId, work_summary: 'Delo' })).status, 400);
    assert.equal((await request(`/employees/${employeeId}/service-reports`, 'POST', { id_service: serviceId, work_summary: 'Delo', reported_at: 'invalid' })).status, 400);
  });

  it('ustvari poročilo in prepreči podvojitev za isti servis', async () => {
    const body = { id_service: serviceId, work_summary: 'Pregled opravljen', findings: 'Brez napak' };
    const result = await request(`/employees/${employeeId}/service-reports`, 'POST', body);
    assert.equal(result.status, 201);
    assert.equal(result.body.report.work_summary, body.work_summary);
    reportId = result.body.report.id;
    assert.equal((await request(`/employees/${employeeId}/service-reports`, 'POST', body)).status, 409);
  });

  it('uredi osnutek in ga vrne na seznamu poročil', async () => {
    const result = await request(`/employees/${employeeId}/service-reports/${reportId}`, 'PUT', { work_summary: 'Posodobljen povzetek' });
    assert.equal(result.status, 200);
    const reports = await request(`/employees/${employeeId}/service-reports`);
    assert.equal(reports.body.reports[0].work_summary, 'Posodobljen povzetek');
  });

  it('po oddaji zaklene poročilo in prepreči ponovno oddajo', async () => {
    const path = `/employees/${employeeId}/service-reports/${reportId}`;
    const result = await request(`${path}/submit`, 'POST');
    assert.equal(result.status, 200);
    assert.ok(result.body.report.submitted_at);
    assert.equal((await request(path, 'PUT', { work_summary: 'Sprememba' })).status, 409);
    assert.equal((await request(`${path}/submit`, 'POST')).status, 409);
    assert.equal((await request(`/employees/${employeeId}/service-reports/999999/submit`, 'POST')).status, 404);
  });

  it('registrira lastnika in zavrne podvojen e-poštni naslov', async () => {
    const body = { firstName: 'Nov', lastName: 'Lastnik', email: 'new@example.com', password: 'TestPassword123!', address: 'Test 2', postalCode: '2000', city: 'Maribor' };
    const result = await request('/customers/register', 'POST', body);
    assert.equal(result.status, 201);
    assert.equal(result.body.customer.password_hash, undefined);
    assert.equal((await request('/customers/register', 'POST', body)).status, 409);
    assert.equal((await request('/customers/register', 'POST', { ...body, postalCode: 'abc' })).status, 400);
  });
});
