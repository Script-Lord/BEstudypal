import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { pool } from './db/client';

async function migrate() {
  const migrationFile = path.join(__dirname, 'db', 'migrations', '001_init.sql');

  if (!fs.existsSync(migrationFile)) {
    console.error(`Migration file not found: ${migrationFile}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(migrationFile, 'utf-8');
  console.log('Running migration: 001_init.sql …');

  try {
    await pool.query(sql);
    console.log('Migration complete.');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
