import { Pool } from 'pg';

const dbUrl = process.env.DATABASE_URL ?? '';
const needsSsl = dbUrl.includes('supabase.co') || dbUrl.includes('pooler.supabase.com');

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: needsSsl || process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on('error', (err) => {
  console.error('PostgreSQL pool error:', err);
});
