import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';

async function run() {
  const connectionString = process.env['DATABASE_URL'];
  if (!connectionString) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }

  const pool = new Pool({ connectionString });

  const migrationPath = join(__dirname, '001-status-events.sql');
  const sql = readFileSync(migrationPath, 'utf-8');

  console.log('Running migration: 001-status-events.sql');
  await pool.query(sql);
  console.log('Migration complete.');

  await pool.end();
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
