#!/usr/bin/env node
// Simple one-off migration runner for 0003 (schedules table + description column)
// Usage: node scripts/run_migration_0003.js
import { Pool } from '@neondatabase/serverless';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const sql = `
CREATE TABLE IF NOT EXISTS "schedules" (
  "id" serial PRIMARY KEY NOT NULL,
  "title" varchar(255) NOT NULL,
  "date" varchar(10) NOT NULL,
  "time" varchar(8) NOT NULL,
  "type" varchar(50) NOT NULL,
  "location" varchar(255) NOT NULL,
  "description" varchar(1024),
  "created_at" timestamp DEFAULT now() NOT NULL
);
ALTER TABLE "schedules" ADD COLUMN IF NOT EXISTS "description" varchar(1024);
`;

async function main() {
  const pool = new Pool({ connectionString: databaseUrl });
  try {
    await pool.query(sql);
    const { rows } = await pool.query('SELECT column_name FROM information_schema.columns WHERE table_name = $1 ORDER BY ordinal_position', ['schedules']);
    console.log('Schedules columns:', rows.map(r => r.column_name));
    console.log('Migration 0003 completed successfully');
  } catch (e) {
    console.error('Migration failed:', e);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();