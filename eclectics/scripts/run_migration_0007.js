#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { Pool } from '@neondatabase/serverless';

function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith('\'') && val.endsWith('\''))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

async function main() {
  loadEnv();
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL not set. Please add it to .env or export before running.');
    process.exit(1);
  }
  const sqlFile = new URL('../drizzle/0007_make_endtime_nullable.sql', import.meta.url);
  const sqlRaw = fs.readFileSync(sqlFile, 'utf8');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    await pool.query('SELECT 1');
    const statements = sqlRaw.split(/;\s*\n|;\s*$/).map(s => s.trim()).filter(Boolean);
    for (const stmt of statements) {
      await pool.query(stmt);
    }
    console.log('Migration 0007 applied: end_time is now nullable.');
  } catch (e) {
    console.error('Migration 0007 failed:', e?.message || e);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
