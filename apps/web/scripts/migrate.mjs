#!/usr/bin/env node
// Migration runner — applies SQL files from supabase/migrations/ to the
// Supabase Postgres database, in order.
//
// Usage:
//   DB_PASSWORD=xxx node scripts/migrate.mjs

import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const { Client } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const MIGRATIONS_DIR = join(__dirname, '..', '..', '..', 'supabase', 'migrations');

const PROJECT_REF = 'kcvhpgjawhymlaqeijnp';
const POOLER_HOST = 'aws-1-ap-southeast-2.pooler.supabase.com'; // Sydney

async function main() {
  if (!process.env.DB_PASSWORD) {
    console.error('Need DB_PASSWORD env var');
    process.exit(1);
  }

  const password = encodeURIComponent(process.env.DB_PASSWORD);
  const url = `postgresql://postgres.${PROJECT_REF}:${password}@${POOLER_HOST}:6543/postgres`;

  const client = new Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  await client.connect();
  console.log(`✅ Connected to ${POOLER_HOST}`);

  try {
    const files = readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith('.sql'))
      .sort();
    console.log(`📦 Found ${files.length} migration file(s)`);

    for (const file of files) {
      const path = join(MIGRATIONS_DIR, file);
      const sql = readFileSync(path, 'utf-8');
      console.log(`\n▶ Applying ${file} (${sql.length} chars)`);
      try {
        await client.query(sql);
        console.log(`✅ ${file} applied`);
      } catch (e) {
        if (
          e.code === '42P07' ||
          e.code === '42710' ||
          e.code === '42P06' ||
          (e.message && e.message.includes('already exists'))
        ) {
          console.log(`⚠️  ${file}: ${e.message.split('\n')[0]} (continuing)`);
        } else {
          console.error(`❌ ${file} failed:`, e.message);
          throw e;
        }
      }
    }

    // Smoke check
    const { rows: prodRows } = await client.query(
      'select count(*)::int as n from public.products where active = true'
    );
    console.log(`\n🌸 products table: ${prodRows[0].n} active product(s)`);

    const { rows: tableRows } = await client.query(`
      select table_name from information_schema.tables
      where table_schema = 'public'
      order by table_name
    `);
    console.log('📋 Tables in public schema:');
    for (const r of tableRows) console.log('   -', r.table_name);

    const { rows: fnRows } = await client.query(`
      select routine_name from information_schema.routines
      where routine_schema = 'public'
      order by routine_name
    `);
    console.log('🛠  Functions in public schema:');
    for (const r of fnRows) console.log('   -', r.routine_name);
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
