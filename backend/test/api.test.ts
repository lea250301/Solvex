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
let customerId: string;
let employeeCookie: string;

async function request(path: string, method = 'GET', body?: unknown) {
  const response = await fetch(`${base}/api${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', Cookie: employeeCookie },
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
  customerId = customer.rows[0].id;
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
  const login = await accountRequest('/employees/login', undefined, 'POST', { email: 'test@example.com', password: 'TestPassword123!' });
  assert.equal(login.status, 200);
  employeeCookie = login.cookie!.split(';')[0];
});

async function accountRequest(path: string, cookie?: string, method = 'GET', body?: unknown) {
  const response = await fetch(`${base}/api${path}`, {
    method, headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: response.status, body: await response.json(), cookie: response.headers.get('set-cookie') };
}

async function customerSession() {
  const result = await accountRequest('/customers/login', undefined, 'POST', { email: 'owner@example.com', password: 'TestPassword123!' });
  assert.equal(result.status, 200);
  assert.ok(result.cookie);
  return result.cookie.split(';')[0];
}

const pixel = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=';

describe('Enotna prijava brez izbire vloge', () => {
  const password = 'TestPassword123!';
  const roles = [['customer', 'customers', 'customer_id'], ['employee', 'employees', 'employee_id'], ['manager', 'managers', 'manager_id']] as const;
  before(async () => {
    for (const [role, endpoint, column] of roles) {
      const created = await accountRequest(`/${endpoint}/register`, undefined, 'POST', {
        firstName: 'Enotna', lastName: 'Prijava', email: `login-${role}@test.si`, password,
        address: 'Test 1', postalCode: '2000', city: 'Maribor', phone: '040000000', serviceType: 'electrical',
      });
      assert.equal(created.status, 201);
      const id = created.body.account?.id ?? created.body.customer.id;
      await pool.query(`INSERT INTO account_usernames (username,${column}) VALUES ($1,$2)`, [`login-${role}`, id]);
    }
  });
  it('pri vseh treh vrstah ugotovi vlogo iz računa, po e-pošti ali uporabniškem imenu', async () => {
    for (const [role] of roles) for (const identifier of [` LOGIN-${role.toUpperCase()}@TEST.SI `, `login-${role}`]) {
      const login = await accountRequest('/auth/login', undefined, 'POST', { identifier, password, role: 'manager' });
      assert.equal(login.status, 200);
      assert.equal(login.body.account.role, role);
      assert.equal(login.body.account.password_hash, undefined);
      assert.match(login.cookie!, /HttpOnly/);
      const cookie = login.cookie!.split(';')[0];
      assert.equal((await accountRequest('/auth/me', cookie)).body.account.role, role);
      await accountRequest('/auth/logout', cookie, 'POST');
      assert.equal((await accountRequest('/auth/me', cookie)).status, 401);
    }
  });
  it('napačni podatki ne izdajo seje ali podatkov računa', async () => {
    for (const identifier of ['login-customer', 'missing-user']) {
      const login = await accountRequest('/auth/login', undefined, 'POST', { identifier, password: 'wrong' });
      assert.equal(login.status, 401);
      assert.equal(login.cookie, null);
      assert.equal(login.body.account, undefined);
    }
    for (const body of [{}, { identifier: 1, password }, { identifier: 'x'.repeat(255), password }, { identifier: 'login-customer', password: 'x'.repeat(129) }]) assert.equal((await accountRequest('/auth/login', undefined, 'POST', body)).status, 400);
  });
  it('pri starih enakih podatkih več vlog ne izbere samovoljno privilegirane vloge', async () => {
    const hash = await argon2.hash(password);
    const owner = await pool.query("INSERT INTO customers (first_name,last_name,email,password_hash,address,postal_code,city) VALUES ('Test','Enak','same-login@test.si',$1,'Test 1','2000','Maribor') RETURNING id", [hash]);
    const manager = await pool.query("INSERT INTO managers (first_name,last_name,email,password_hash,phone) VALUES ('Test','Enak','same-login@test.si',$1,'000') RETURNING id", [hash]);
    const ambiguous = await accountRequest('/auth/login', undefined, 'POST', { identifier: 'same-login@test.si', password });
    assert.equal(ambiguous.status, 409);
    assert.equal(ambiguous.cookie, null);
    await pool.query('INSERT INTO account_usernames (username,customer_id) VALUES ($1,$2)', ['unique-owner', owner.rows[0].id]);
    await pool.query('INSERT INTO account_usernames (username,manager_id) VALUES ($1,$2)', ['unique-manager', manager.rows[0].id]);
    assert.equal((await accountRequest('/auth/login', undefined, 'POST', { identifier: 'unique-owner', password })).body.account.role, 'customer');
    assert.equal((await accountRequest('/auth/login', undefined, 'POST', { identifier: 'unique-manager', password })).body.account.role, 'manager');
  });
});

describe('Moje elektrarne: lastništvo, podatki in urejanje', () => {
  let ownerCookie: string;
  let otherCookie: string;
  let ownerId: string;
  let otherId: string;
  let managerCookie: string;
  let sequence = 0;
  const basePlant = { name: 'Sončni dom', installation_address: 'Sončna 1', postal_code: '2000', city: 'Maribor' };
  before(async () => {
    const registration = { firstName: 'Test', lastName: 'Elektrarne', password: 'TestPassword123!', address: 'Test 1', postalCode: '2000', city: 'Maribor' };
    for (const email of ['plants-a@test.si', 'plants-b@test.si']) {
      const created = await accountRequest('/customers/register', undefined, 'POST', { ...registration, email });
      assert.equal(created.status, 201);
      const login = await accountRequest('/customers/login', undefined, 'POST', { email, password: registration.password });
      if (email === 'plants-a@test.si') { ownerCookie = login.cookie!.split(';')[0]; ownerId = created.body.customer.id; }
      else { otherCookie = login.cookie!.split(';')[0]; otherId = created.body.customer.id; }
    }
    await accountRequest('/managers/register', undefined, 'POST', { ...registration, email: 'plants-manager@test.si', phone: '040000000' });
    const manager = await accountRequest('/managers/login', undefined, 'POST', { email: 'plants-manager@test.si', password: registration.password });
    managerCookie = manager.cookie!.split(';')[0];
  });
  async function create(extra: Record<string, unknown> = {}, cookie = ownerCookie) {
    return accountRequest('/plants', cookie, 'POST', { ...basePlant, name: `Elektrarna ${++sequence}`, ...extra });
  }

  it('prazen seznam vsebuje samo elektrarne lastnika iz seje, ne iz parametra', async () => {
    assert.deepEqual((await accountRequest('/plants', ownerCookie)).body.plants, []);
    const mine = await create();
    const theirs = await create({}, otherCookie);
    const list = await accountRequest(`/plants?id_customer=${otherId}`, ownerCookie);
    assert.equal(list.status, 200);
    assert.deepEqual(list.body.plants.map((item: { id: string }) => item.id), [mine.body.plant.id]);
    assert.ok(!list.body.plants.some((item: { id: string }) => item.id === theirs.body.plant.id));
  });

  it('shrani in prebere vsa polja ter normalizira besedilo in datum', async () => {
    const result = await create({ name: '  Domača elektrarna  ', manufacturer: '  Solarna oprema  ', installed_capacity_kw: '12.50', panel_count: 30, has_battery: true, battery_capacity_kwh: 8.25, installed_on: '2024-02-29' });
    assert.equal(result.status, 201);
    const plant = result.body.plant;
    assert.equal(plant.name, 'Domača elektrarna');
    assert.equal(plant.manufacturer, 'Solarna oprema');
    assert.equal(plant.installation_year, 2024);
    assert.equal(plant.installed_on, '2024-02-29');
    assert.equal(plant.installed_capacity_kw, '12.50');
    assert.equal(plant.panel_count, 30);
    assert.equal(plant.battery_capacity_kwh, '8.25');
    assert.equal(plant.has_battery, true);
    const persisted = await pool.query('SELECT id_customer,manufacturer FROM solar_plants WHERE id_solar_plants=$1', [plant.id]);
    assert.equal(persisted.rows[0].id_customer, ownerId);
    assert.equal(persisted.rows[0].manufacturer, 'Solarna oprema');
    assert.deepEqual((await accountRequest(`/plants/${plant.id}`, ownerCookie)).body.plant, plant);
  });

  it('podpira samo leto brez izmišljenega datuma in minimalne stare podatke', async () => {
    const result = await create({ installation_year: 2021 });
    assert.equal(result.status, 201);
    assert.equal(result.body.plant.installation_year, 2021);
    assert.equal(result.body.plant.installed_on, null);
    assert.equal(result.body.plant.manufacturer, null);
    assert.equal(result.body.plant.has_battery, false);
  });

  it('anonimnim ter obema vrstama zaposlenih zavrne vse lastnikove operacije', async () => {
    for (const [path, method] of [['/plants', 'GET'], ['/plants', 'POST'], ['/plants/1', 'GET'], ['/plants/1', 'PATCH']]) {
      assert.equal((await accountRequest(path, undefined, method, method === 'POST' || method === 'PATCH' ? basePlant : undefined)).status, 401);
      for (const cookie of [employeeCookie, managerCookie]) assert.equal((await accountRequest(path, cookie, method, method === 'POST' || method === 'PATCH' ? basePlant : undefined)).status, 403);
    }
    assert.equal((await fetch(`${base}/plants`)).status, 401);
  });

  it('tuja in neobstoječa elektrarna vrneta 404 brez spremembe podatkov', async () => {
    const plant = (await create({}, otherCookie)).body.plant;
    for (const id of [plant.id, '9223372036854775807']) {
      assert.equal((await accountRequest(`/plants/${id}`, ownerCookie)).status, 404);
      assert.equal((await accountRequest(`/plants/${id}`, ownerCookie, 'PATCH', { name: 'Prevzeta' })).status, 404);
    }
    assert.equal((await accountRequest(`/plants/${plant.id}`, otherCookie)).body.plant.name, plant.name);
  });

  it('zavrne neveljavne ID-je in poskuse spreminjanja lastnika ali neznanih polj', async () => {
    const plant = (await create()).body.plant;
    for (const id of ['0', '-1', 'abc', '1.2', '9223372036854775808', '999999999999999999999999']) {
      assert.equal((await accountRequest(`/plants/${id}`, ownerCookie)).status, 400);
      assert.equal((await accountRequest(`/plants/${id}`, ownerCookie, 'PATCH', { name: 'Novo ime' })).status, 400);
    }
    for (const extra of [{ id_customer: otherId }, { customerId: otherId }, { id: plant.id }, { role: 'manager' }]) {
      assert.equal((await create(extra)).status, 400);
      assert.equal((await accountRequest(`/plants/${plant.id}`, ownerCookie, 'PATCH', extra)).status, 400);
    }
    assert.equal((await pool.query('SELECT id_customer FROM solar_plants WHERE id_solar_plants=$1', [plant.id])).rows[0].id_customer, ownerId);
  });

  it('zavrne napačna in predolga besedila brez novih zapisov', async () => {
    const count = (await pool.query('SELECT COUNT(*) FROM solar_plants WHERE id_customer=$1', [ownerId])).rows[0].count;
    for (const extra of [{ name: '' }, { name: '   ' }, { name: 'x'.repeat(101) }, { installation_address: null }, { installation_address: 'x'.repeat(1001) }, { postal_code: 'ABC' }, { postal_code: '1'.repeat(21) }, { city: '' }, { city: 'x'.repeat(101) }, { manufacturer: 'x'.repeat(101) }, { manufacturer: 123 }]) assert.equal((await create(extra)).status, 400);
    for (const body of [{}, [], null, { name: 'Brez lokacije' }]) assert.equal((await accountRequest('/plants', ownerCookie, 'POST', body)).status, 400);
    assert.equal((await pool.query('SELECT COUNT(*) FROM solar_plants WHERE id_customer=$1', [ownerId])).rows[0].count, count);
  });

  it('preveri pozitivna števila, natančnost, omejitve in tipe', async () => {
    for (const field of ['installed_capacity_kw', 'battery_capacity_kwh']) {
      for (const value of [0, -1, 'NaN', 'Infinity', '1e3', '1.001', '100000000', true, {}, '']) assert.equal((await create({ has_battery: true, [field]: value })).status, 400, `${field}=${String(value)}`);
    }
    for (const value of [0, -1, 1.5, 2147483648, '12', true]) assert.equal((await create({ panel_count: value })).status, 400);
    for (const value of [0, -1, 2020.5, 10000, '2020']) assert.equal((await create({ installation_year: value })).status, 400);
    assert.equal((await create({ has_battery: 'false' })).status, 400);
  });

  it('preveri datum, prestopno leto in skladnost leta ter baterije', async () => {
    for (const value of ['2023-02-29', '2024-04-31', '0000-01-01', '2024-13-01', '2024-2-01', '2024-01-01T00:00:00Z', 2024]) assert.equal((await create({ installed_on: value })).status, 400);
    assert.equal((await create({ installation_year: 2023, installed_on: '2024-01-01' })).status, 400);
    assert.equal((await create({ battery_capacity_kwh: 10 })).status, 400);
    const valid = await create({ has_battery: true, battery_capacity_kwh: null });
    assert.equal(valid.status, 201);
  });

  it('uredi samo podana polja, podpira brisanje neobveznih podatkov in ohrani povezave', async () => {
    const plant = (await create({ manufacturer: 'Prejšnji', installed_capacity_kw: 10, panel_count: 20, has_battery: true, battery_capacity_kwh: 5, installation_year: 2020 })).body.plant;
    const service = await pool.query("INSERT INTO services (id_solar_plant,service_type) VALUES ($1,'cleaning') RETURNING id", [plant.id]);
    const changed = await accountRequest(`/plants/${plant.id}`, ownerCookie, 'PATCH', { name: 'Posodobljena', manufacturer: null });
    assert.equal(changed.status, 200);
    assert.equal(changed.body.plant.manufacturer, null);
    assert.equal(changed.body.plant.panel_count, 20);
    assert.equal(changed.body.plant.installed_capacity_kw, '10.00');
    assert.equal(changed.body.plant.installation_year, 2020);
    const battery = await accountRequest(`/plants/${plant.id}`, ownerCookie, 'PATCH', { has_battery: false });
    assert.equal(battery.status, 400);
    const cleared = await accountRequest(`/plants/${plant.id}`, ownerCookie, 'PATCH', { has_battery: false, battery_capacity_kwh: null });
    assert.equal(cleared.status, 200);
    assert.equal(cleared.body.plant.has_battery, false);
    assert.equal((await pool.query('SELECT id_solar_plant FROM services WHERE id=$1', [service.rows[0].id])).rows[0].id_solar_plant, plant.id);
    assert.equal((await accountRequest(`/plants/${plant.id}`, ownerCookie, 'PATCH', {})).status, 400);
  });

  it('prepreči podvojeno ime pri istem lastniku, dovoljuje enako ime drugemu', async () => {
    const first = await create({ name: 'Enolično ime' });
    assert.equal(first.status, 201);
    assert.equal((await create({ name: 'Enolično ime' })).status, 409);
    assert.equal((await create({ name: 'Enolično ime' }, otherCookie)).status, 201);
    const another = (await create()).body.plant;
    assert.equal((await accountRequest(`/plants/${another.id}`, ownerCookie, 'PATCH', { name: 'Enolično ime' })).status, 409);
    assert.equal((await accountRequest(`/plants/${another.id}`, ownerCookie)).body.plant.name, another.name);
  });

  it('sočasni delni posodobitvi ohranita obe spremembi', async () => {
    const plant = (await create()).body.plant;
    const results = await Promise.all([
      accountRequest(`/plants/${plant.id}`, ownerCookie, 'PATCH', { manufacturer: 'Nov proizvajalec' }),
      accountRequest(`/plants/${plant.id}`, ownerCookie, 'PATCH', { panel_count: 42 }),
    ]);
    assert.ok(results.every(result => result.status === 200));
    const saved = (await accountRequest(`/plants/${plant.id}`, ownerCookie)).body.plant;
    assert.equal(saved.manufacturer, 'Nov proizvajalec');
    assert.equal(saved.panel_count, 42);
  });
});

describe('Tri vrste računov in strežniška pooblastila', () => {
  const staff = { firstName: 'Nov', lastName: 'Serviser', email: 'worker-register@test.si', password: 'TestPassword123!', phone: '040000000', serviceType: 'electrical' };
  let managerCookie: string;
  let managerId: string;
  let otherEmployeeId: string;

  it('odprto registrira serviserja, hashira geslo in ignorira vlogo iz telesa', async () => {
    const result = await accountRequest('/employees/register', undefined, 'POST', { ...staff, role: 'manager' });
    assert.equal(result.status, 201);
    assert.equal(result.body.account.role, 'employee');
    assert.equal(result.body.account.password_hash, undefined);
    otherEmployeeId = result.body.account.id;
    const saved = await pool.query('SELECT password_hash FROM employees WHERE id=$1', [otherEmployeeId]);
    assert.ok(await argon2.verify(saved.rows[0].password_hash, staff.password));
    assert.equal((await accountRequest('/employees/register', undefined, 'POST', staff)).status, 409);
  });

  it('preveri specializacijo, obvezna polja in dolžino gesla pred registracijo', async () => {
    for (const body of [{ ...staff, serviceType: 'admin' }, { ...staff, phone: '' }, { ...staff, password: 'short' }, { ...staff, password: 'x'.repeat(129) }]) {
      assert.equal((await accountRequest('/employees/register', undefined, 'POST', body)).status, 400);
    }
    assert.equal((await accountRequest('/managers/register', undefined, 'POST', { ...staff, email: 'invalid' })).status, 400);
  });

  it('odprto registrira vodjo in prijavi v sejo z vlogo iz baze', async () => {
    const body = { ...staff, email: 'manager@test.si' };
    const registered = await accountRequest('/managers/register', undefined, 'POST', body);
    assert.equal(registered.status, 201);
    assert.equal(registered.body.account.role, 'manager');
    assert.equal(registered.body.account.password_hash, undefined);
    managerId = registered.body.account.id;
    assert.equal((await accountRequest('/managers/register', undefined, 'POST', body)).status, 409);
    const login = await accountRequest('/managers/login', undefined, 'POST', { ...body, role: 'customer' });
    assert.equal(login.status, 200);
    assert.match(login.cookie!, /HttpOnly/);
    managerCookie = login.cookie!.split(';')[0];
    assert.equal((await accountRequest('/auth/me', managerCookie)).body.account.role, 'manager');
    const session = await pool.query('SELECT manager_id FROM account_sessions WHERE manager_id=$1', [managerId]);
    assert.equal(session.rowCount, 1);
  });

  it('zavrne napačno geslo vodje in prijavo z računom druge vrste', async () => {
    assert.equal((await accountRequest('/managers/login', undefined, 'POST', { email: staff.email, password: staff.password })).status, 401);
    assert.equal((await accountRequest('/managers/login', undefined, 'POST', { email: 'manager@test.si', password: 'wrong' })).status, 401);
    assert.equal((await accountRequest('/managers/login', undefined, 'POST', {})).status, 400);
  });

  it('zavrne anonimni dostop na vseh servisnih in poročevalskih poteh', async () => {
    for (const [path, method] of [
      ['/services', 'GET'], [`/employees/${employeeId}/services`, 'GET'],
      [`/employees/${employeeId}/service-reports`, 'GET'], [`/employees/${employeeId}/service-reports`, 'POST'],
      [`/employees/${employeeId}/service-reports/1`, 'PUT'], [`/employees/${employeeId}/service-reports/1/submit`, 'POST'],
      ['/managers/overview', 'GET'], ['/managers/requests', 'GET'], ['/managers/employees', 'GET'], ['/managers/service-reports', 'GET'],
    ]) assert.equal((await accountRequest(path, undefined, method)).status, 401, `${method} ${path}`);
    assert.equal((await fetch(`${base}/services`)).status, 401, 'Zaščiten je tudi korenski proxy mount.');
  });

  it('lastnik ne more dostopati do internih podatkov niti s podano vlogo', async () => {
    const cookie = await customerSession();
    for (const path of ['/services?role=manager', `/employees/${employeeId}/services`, `/employees/${employeeId}/service-reports`, '/managers/overview', '/managers/employees']) {
      assert.equal((await accountRequest(path, cookie)).status, 403, path);
    }
    assert.equal((await accountRequest(`/employees/${employeeId}/service-reports`, cookie, 'POST', { role: 'employee' })).status, 403);
  });

  it('serviser vidi samo dodeljene servise in ne more zamenjati ID-ja', async () => {
    const own = await accountRequest('/services', employeeCookie);
    assert.equal(own.status, 200);
    assert.ok(own.body.services.some((item: { id: string }) => item.id === serviceId));
    const login = await accountRequest('/employees/login', undefined, 'POST', staff);
    assert.equal(login.status, 200);
    const otherCookie = login.cookie!.split(';')[0];
    assert.deepEqual((await accountRequest('/services', otherCookie)).body.services, []);
    for (const suffix of ['services', 'service-reports']) assert.equal((await accountRequest(`/employees/${employeeId}/${suffix}`, otherCookie)).status, 403);
    assert.equal((await accountRequest(`/employees/${otherEmployeeId}/service-reports`, otherCookie, 'POST', { id_service: serviceId, work_summary: 'Neveljavno' })).status, 400);
    assert.equal((await accountRequest('/managers/overview', otherCookie)).status, 403);
  });

  it('vodja vidi dejanske zahtevke, obremenitve in vse servise brez gesel', async () => {
    const plant = (await pool.query('SELECT id_solar_plant FROM services WHERE id=$1', [serviceId])).rows[0].id_solar_plant;
    await pool.query("INSERT INTO service_requests (id_solar_plant,request_type,description) VALUES ($1,'fault_report','Napaka za pregled vodje')", [plant]);
    const requests = await accountRequest('/managers/requests', managerCookie);
    assert.equal(requests.status, 200);
    assert.ok(requests.body.requests.some((item: { description: string }) => item.description === 'Napaka za pregled vodje'));
    const employees = await accountRequest('/managers/employees', managerCookie);
    assert.equal(employees.status, 200);
    assert.ok(employees.body.employees.every((item: object) => !Object.hasOwn(item, 'password_hash')));
    assert.ok(employees.body.employees.find((item: { id: string; active_services: number }) => item.id === employeeId && item.active_services >= 1));
    assert.equal((await accountRequest('/services', managerCookie)).status, 200);
    assert.equal((await accountRequest('/managers/overview', managerCookie)).body.overview.pending_requests, 1);
  });

  it('vodja bere le oddana poročila in ne more pisati poročil serviserja', async () => {
    const created = await accountRequest(`/employees/${employeeId}/service-reports`, employeeCookie, 'POST', { id_service: serviceId, work_summary: 'Za preverjanje pravic vodje' });
    assert.equal(created.status, 201);
    const id = created.body.report.id;
    assert.deepEqual((await accountRequest('/managers/service-reports', managerCookie)).body.reports, []);
    assert.deepEqual((await accountRequest(`/employees/${employeeId}/service-reports`, managerCookie)).body.reports, []);
    assert.equal((await accountRequest(`/employees/${employeeId}/service-reports`, managerCookie, 'POST', {})).status, 403);
    assert.equal((await accountRequest(`/employees/${employeeId}/service-reports/${id}`, managerCookie, 'PUT', { work_summary: 'Sprememba' })).status, 403);
    assert.equal((await accountRequest(`/employees/${employeeId}/service-reports/${id}/submit`, managerCookie, 'POST')).status, 403);
    await accountRequest(`/employees/${employeeId}/service-reports/${id}/submit`, employeeCookie, 'POST');
    assert.equal((await accountRequest('/managers/service-reports', managerCookie)).body.reports[0].id, id);
    await pool.query('DELETE FROM service_reports WHERE id=$1', [id]);
  });

  it('ob prerazporeditvi servisa prejšnji serviser ne more urejati ali oddati osnutka', async () => {
    const created = await accountRequest(`/employees/${employeeId}/service-reports`, employeeCookie, 'POST', { id_service: serviceId, work_summary: 'Osnutek pred prerazporeditvijo' });
    const id = created.body.report.id;
    await pool.query('UPDATE services SET id_employee=$1 WHERE id=$2', [otherEmployeeId, serviceId]);
    assert.deepEqual((await accountRequest(`/employees/${employeeId}/service-reports`, employeeCookie)).body.reports, []);
    assert.equal((await accountRequest(`/employees/${employeeId}/service-reports/${id}`, employeeCookie, 'PUT', { work_summary: 'Sprememba' })).status, 404);
    assert.equal((await accountRequest(`/employees/${employeeId}/service-reports/${id}/submit`, employeeCookie, 'POST')).status, 404);
    await pool.query('DELETE FROM service_reports WHERE id=$1', [id]);
    await pool.query('UPDATE services SET id_employee=$1 WHERE id=$2', [employeeId, serviceId]);
  });

  it('vodja ima svoj profil, trajno fotografijo ter preklic seje', async () => {
    const saved = await accountRequest('/account/photo', managerCookie, 'PUT', { image: pixel });
    assert.equal(saved.status, 200);
    assert.equal(saved.body.account.role, 'manager');
    assert.equal((await pool.query('SELECT profile_image_data FROM managers WHERE id=$1', [managerId])).rows[0].profile_image_data, pixel);
    const profile = await accountRequest('/account/profile', managerCookie);
    assert.deepEqual(profile.body.plants, []);
    assert.deepEqual(profile.body.services, []);
    await accountRequest('/auth/logout', managerCookie, 'POST');
    assert.equal((await accountRequest('/managers/overview', managerCookie)).status, 401);
  });
});

describe('Prijavljeni profili in fotografije', () => {
  it('zavrne anonimno branje in spreminjanje profila', async () => {
    assert.equal((await accountRequest('/auth/me')).status, 401);
    assert.equal((await accountRequest('/account/profile')).status, 401);
    assert.equal((await accountRequest('/account/photo', undefined, 'PUT', { image: pixel })).status, 401);
  });

  it('zavrne napačno geslo in neveljavne podatke lastnika', async () => {
    assert.equal((await accountRequest('/customers/login', undefined, 'POST', { email: 'invalid', password: 'x' })).status, 400);
    const result = await accountRequest('/customers/login', undefined, 'POST', { email: 'owner@example.com', password: 'wrong' });
    assert.equal(result.status, 401);
    assert.equal(result.cookie, null);
  });

  it('ustvari HttpOnly sejo in shrani samo hash žetona', async () => {
    const result = await accountRequest('/customers/login', undefined, 'POST', { email: ' OWNER@example.com ', password: 'TestPassword123!' });
    assert.equal(result.status, 200);
    assert.equal(result.body.account.role, 'customer');
    assert.equal(result.body.account.password_hash, undefined);
    assert.match(result.cookie!, /HttpOnly/i);
    assert.match(result.cookie!, /SameSite=Lax/i);
    const cookie = result.cookie!.split(';')[0];
    const token = cookie.split('=')[1];
    const hashes = await pool.query('SELECT token_hash FROM account_sessions');
    assert.ok(hashes.rows.every(row => row.token_hash !== token));
    assert.equal((await accountRequest('/auth/me', cookie)).body.account.id, customerId);
  });

  it('shrani fotografijo samo lastniku seje in jo vrne po ponovni prijavi', async () => {
    const cookie = await customerSession();
    const result = await accountRequest('/account/photo', cookie, 'PUT', { image: pixel, id: employeeId });
    assert.equal(result.status, 200);
    assert.equal(result.body.account.profile_image_data, pixel);
    assert.equal((await pool.query('SELECT profile_image_data FROM customers WHERE id=$1', [customerId])).rows[0].profile_image_data, pixel);
    assert.equal((await pool.query('SELECT profile_image_data FROM employees WHERE id=$1', [employeeId])).rows[0].profile_image_data, null);
    const nextCookie = await customerSession();
    assert.equal((await accountRequest('/account/profile', nextCookie)).body.account.profile_image_data, pixel);
    await accountRequest('/account/photo', cookie, 'PUT', { image: null });
  });

  it('zavrne SVG, neujemajoč format in preveliko fotografijo', async () => {
    const cookie = await customerSession();
    for (const image of ['data:image/svg+xml;base64,PHN2Zz4=', 'data:image/png;base64,YWJj', `data:image/png;base64,${'A'.repeat(350004)}`]) {
      assert.equal((await accountRequest('/account/photo', cookie, 'PUT', { image })).status, 400);
    }
  });

  it('omogoči odstranitev fotografije', async () => {
    const cookie = await customerSession();
    await accountRequest('/account/photo', cookie, 'PUT', { image: pixel });
    assert.equal((await accountRequest('/account/photo', cookie, 'PUT', { image: null })).body.account.profile_image_data, null);
    assert.equal((await pool.query('SELECT profile_image_data FROM customers WHERE id=$1', [customerId])).rows[0].profile_image_data, null);
  });

  it('vrne samo lastnikove elektrarne in zaključene servise, brez zapisnikov', async () => {
    const cookie = await customerSession();
    const plant = await pool.query("INSERT INTO solar_plants (id_customer,name,installation_address,postal_code,city,panel_count) VALUES ($1,'Profil test','Test 2','2000','Maribor',12) RETURNING id_solar_plants", [customerId]);
    const plantId = plant.rows[0].id_solar_plants;
    const completed = await pool.query("INSERT INTO services (id_solar_plant,service_type,status,completed_at) VALUES ($1,'cleaning','completed',NOW()) RETURNING id", [plantId]);
    const planned = await pool.query("INSERT INTO services (id_solar_plant,service_type) VALUES ($1,'electrical') RETURNING id", [plantId]);
    const other = await pool.query("INSERT INTO customers (first_name,last_name,email,password_hash,address,postal_code,city) VALUES ('Drug','Lastnik','other-profile@test.si','unused','Test 3','2000','Maribor') RETURNING id");
    await pool.query("INSERT INTO solar_plants (id_customer,name,installation_address,postal_code,city) VALUES ($1,'Skrita elektrarna','Test 3','2000','Maribor')", [other.rows[0].id]);
    const result = await accountRequest('/account/profile?customerId=' + other.rows[0].id, cookie);
    assert.equal(result.status, 200);
    assert.ok(result.body.plants.some((item: { id: string }) => item.id === plantId));
    assert.ok(!result.body.plants.some((item: { name: string }) => item.name === 'Skrita elektrarna'));
    assert.ok(result.body.services.some((item: { id: string }) => item.id === completed.rows[0].id));
    assert.ok(!result.body.services.some((item: { id: string }) => item.id === planned.rows[0].id));
    assert.ok(result.body.services.every((item: object) => !Object.hasOwn(item, 'work_summary')));
  });

  it('zaposleni lahko shrani svojo sliko in nima elektrarn lastnika', async () => {
    const login = await accountRequest('/employees/login', undefined, 'POST', { email: 'test@example.com', password: 'TestPassword123!' });
    const cookie = login.cookie!.split(';')[0];
    assert.equal((await accountRequest('/account/photo', cookie, 'PUT', { image: pixel })).body.account.role, 'employee');
    const profile = await accountRequest('/account/profile', cookie);
    assert.deepEqual(profile.body.plants, []);
    assert.deepEqual(profile.body.services, []);
    await accountRequest('/account/photo', cookie, 'PUT', { image: null });
  });

  it('odjava prekliče sejo in potečena seja ni veljavna', async () => {
    const cookie = await customerSession();
    assert.equal((await accountRequest('/auth/logout', cookie, 'POST')).status, 200);
    assert.equal((await accountRequest('/auth/me', cookie)).status, 401);
    const expiredCookie = await customerSession();
    await pool.query("UPDATE account_sessions SET expires_at = NOW() - INTERVAL '1 second' WHERE customer_id=$1", [customerId]);
    assert.equal((await accountRequest('/account/profile', expiredCookie)).status, 401);
  });
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
    assert.equal((await request('/employees/999999/services')).status, 403);
  });

  it('preveri obvezna polja in dodelitev pred ustvarjanjem poročila', async () => {
    assert.equal((await request(`/employees/${employeeId}/service-reports`, 'POST', { id_service: serviceId })).status, 400);
    assert.equal((await request('/employees/999999/service-reports', 'POST', { id_service: serviceId, work_summary: 'Delo' })).status, 403);
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
