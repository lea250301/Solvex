import 'dotenv/config';
import { Pool } from 'pg';
import argon2 from 'argon2';

// Explicitly requested public test credentials; this script cannot target a remote database.
if (!['localhost', '127.0.0.1', '::1'].includes(process.env.DB_HOST ?? '')) {
  throw new Error('Test accounts can be created only in a local database.');
}
const pool = new Pool({ host: process.env.DB_HOST, port: Number(process.env.DB_PORT ?? 5432), database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASSWORD });
const client = await pool.connect();
try {
  await client.query('BEGIN');
  const password = 'geslo123';
  const hash = await argon2.hash(password);
  for (const [username, table, column] of [
    ['lastnik', 'customers', 'customer_id'], ['zaposlen', 'employees', 'employee_id'], ['vodja', 'managers', 'manager_id'],
  ]) {
    const email = `${username}@solvex.local`;
    const extra = table === 'customers' ? ",address,postal_code,city" : table === 'employees' ? ",phone,service_type" : ",phone";
    const values = table === 'customers' ? ",'Testna ulica 1','2000','Maribor'" : table === 'employees' ? ",'000000000','electrical'" : ",'000000000'";
    await client.query(`INSERT INTO ${table} (first_name,last_name,email,password_hash${extra}) VALUES ($1,'Test',$2,$3${values}) ON CONFLICT (email) DO NOTHING`, [username, email, hash]);
    const result = await client.query(`SELECT id,password_hash FROM ${table} WHERE email=$1`, [email]);
    const account = result.rows[0];
    if (!account || !(await argon2.verify(account.password_hash, password))) throw new Error(`Existing account ${username} differs; refusing to overwrite it.`);
    await client.query(`INSERT INTO account_usernames (username,${column}) VALUES ($1,$2) ON CONFLICT (username) DO NOTHING`, [username, account.id]);
    const alias = await client.query(`SELECT ${column} AS account_id FROM account_usernames WHERE username=$1`, [username]);
    if (alias.rows[0]?.account_id !== account.id) throw new Error(`Username ${username} belongs to another account.`);
    console.log(`Local account ready: ${username}`);
  }
  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
  await pool.end();
}
