#!/usr/bin/env node
// Applies the most recent migration's .down.sql against a Postgres
// connection (typically the local Supabase instance). The connection
// string comes from $SUPABASE_DB_URL or $DATABASE_URL.
//
// Run via: pnpm db:rollback
//
// Usage: pnpm db:rollback                   # rolls back the most recent migration
//        pnpm db:rollback <migration-name>  # rolls back a specific .sql by name (no extension)
//
// Note: this script only EXECUTES the down SQL. It does not update any
// supabase migration tracking table — the local Supabase tracker is
// reset by `supabase db reset` if you need a clean slate. For production
// the manual revert procedure is documented in docs/guides/migrations.md.

import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, "..");
const MIGRATIONS_DIR = join(REPO_ROOT, "supabase/migrations");

function listUpMigrationsSorted(): string[] {
  return readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql") && !f.endsWith(".down.sql"))
    .sort();
}

function pickTarget(): { upName: string; downPath: string } {
  const arg = process.argv[2];
  const ups = listUpMigrationsSorted();
  if (ups.length === 0) {
    console.error(`No migrations found in ${MIGRATIONS_DIR}.`);
    process.exit(1);
  }

  const baseName = arg ?? ups[ups.length - 1].replace(/\.sql$/, "");
  const upName = `${baseName}.sql`;
  const downName = `${baseName}.down.sql`;
  const downPath = join(MIGRATIONS_DIR, downName);

  try {
    readFileSync(downPath, "utf8");
  } catch {
    console.error(
      `No paired rollback file found: expected ${downName} alongside ${upName}.`,
    );
    process.exit(1);
  }
  return { upName, downPath };
}

function applyDown(downPath: string): void {
  const dbUrl = process.env.SUPABASE_DB_URL ?? process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error(
      "Set SUPABASE_DB_URL (or DATABASE_URL) to a Postgres connection string.\n" +
        "For local dev: SUPABASE_DB_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres",
    );
    process.exit(1);
  }

  const sql = readFileSync(downPath, "utf8");
  const result = spawnSync("psql", [dbUrl, "-v", "ON_ERROR_STOP=1", "-f", "-"], {
    input: sql,
    stdio: ["pipe", "inherit", "inherit"],
  });

  if (result.error) {
    console.error(`Failed to invoke psql: ${result.error.message}`);
    process.exit(1);
  }
  if (typeof result.status === "number" && result.status !== 0) {
    process.exit(result.status);
  }
}

const { upName, downPath } = pickTarget();
console.log(`Rolling back ${upName} via ${downPath} ...`);
applyDown(downPath);
console.log(`Rollback applied. Remember to also reset Supabase migration tracking if needed.`);
