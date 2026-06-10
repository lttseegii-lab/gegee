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
    // NOTE: cert verification is disabled for the Supabase pooler. To harden,
    // pass the Supabase CA cert via `ssl: { ca: ... }` and set DB_SSL_STRICT=1.
    ssl: { rejectUnauthorized: process.env.DB_SSL_STRICT === '1' },
    connectionTimeoutMillis: 10000,
  });

  await client.connect();
  console.log(`✅ Connected to ${POOLER_HOST}`);

  // Migration ledger: apply each file at most once. The forgiving "already
  // exists" handling below is kept so the first run against a DB that was
  // migrated before this ledger existed records the old files instead of
  // erroring.
  await client.query(`
    create table if not exists public.schema_migrations (
      version     text primary key,
      applied_at  timestamptz not null default now()
    )
  `);
  const { rows: appliedRows } = await client.query(
    'select version from public.schema_migrations'
  );
  const applied = new Set(appliedRows.map((r) => r.version));

  try {
    const files = readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith('.sql'))
      .sort();
    console.log(`📦 Found ${files.length} migration file(s)`);

    for (const file of files) {
      if (applied.has(file)) {
        console.log(`⏭  ${file} already applied — skipping`);
        continue;
      }
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
      await client.query(
        'insert into public.schema_migrations(version) values ($1) on conflict do nothing',
        [file]
      );
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
