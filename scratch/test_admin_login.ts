import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  const dbUrl = process.env.DATABASE_URL || '';
  console.log('Testing pg Pool with DATABASE_URL...');
  
  const pool = new Pool({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const res = await pool.query('SELECT id, email, name, password FROM public.nenkin_users WHERE email = $1', ['admin@nenkin.com']);
    console.log('Query success! Result:', res.rows);
  } catch (err: any) {
    console.error('pg Pool error:', err.message);
  } finally {
    await pool.end();
  }
}

main().catch(console.error).finally(() => process.exit(0));
