import 'dotenv/config';
import { Pool } from 'pg';
import argon2 from 'argon2';

if (!['localhost', '127.0.0.1', '::1'].includes(process.env.DB_HOST ?? '')) {
  throw new Error('Demo seed is allowed only against a local database.');
}
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
  const existing = await client.query('SELECT id FROM employees WHERE email = $1', ['demo@solvex.local']);
  if (existing.rowCount) {
    console.log('Demo employee already exists; no data changed.');
  } else {
    const hash = await argon2.hash('SolvexDemo123!');
    const employee = await client.query(`INSERT INTO employees
      (first_name,last_name,email,password_hash,phone,service_type)
      VALUES ('Demo','Serviser','demo@solvex.local',$1,'000000000','electrical') RETURNING id`, [hash]);
    const customer = await client.query(`INSERT INTO customers
      (first_name,last_name,email,password_hash,address,postal_code,city)
      VALUES ('Demo','Lastnik','demo-owner@solvex.local',$1,'Testna ulica 1','2000','Maribor') RETURNING id`, [hash]);
    const plant = await client.query(`INSERT INTO solar_plants
      (id_customer,name,installation_address,postal_code,city,installed_capacity_kw,panel_count)
      VALUES ($1,'Demo elektrarna','Testna ulica 1','2000','Maribor',10,20) RETURNING id_solar_plants`, [customer.rows[0].id]);
    await client.query(`INSERT INTO services
      (id_solar_plant,service_type,id_employee,urgency,status,scheduled_at,notes)
      VALUES ($1,'electrical',$2,'nujno','scheduled',NOW() + INTERVAL '1 day','Demo: pregled razsmernika'),
             ($1,'cleaning',$2,'standardno','scheduled',NOW() + INTERVAL '7 days','Demo: čiščenje panelov')`, [plant.rows[0].id_solar_plants, employee.rows[0].id]);
    console.log('Local demo created. Login: demo@solvex.local / SolvexDemo123!');
  }
  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
  await pool.end();
}
