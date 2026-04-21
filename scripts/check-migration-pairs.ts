#!/usr/bin/env node
// Enforces the rule that every supabase/migrations/<name>.sql ships with a
// paired <name>.down.sql rollback file. Exits 1 with a list of missing
// pairs.
//
// Run via: node --experimental-strip-types scripts/check-migration-pairs.ts

import { readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, "..");
const MIGRATIONS_DIR = join(REPO_ROOT, "supabase/migrations");

function run(): void {
  let entries: string[];
  try {
    entries = readdirSync(MIGRATIONS_DIR);
  } catch (err) {
    console.error(
      `Cannot read ${MIGRATIONS_DIR}: ${(err as Error).message}`,
    );
    process.exit(1);
  }

  const sqlFiles = entries.filter((f) => f.endsWith(".sql"));
  const downFiles = new Set(sqlFiles.filter((f) => f.endsWith(".down.sql")));
  const upFiles = sqlFiles.filter((f) => !f.endsWith(".down.sql"));

  const missing: string[] = [];
  for (const up of upFiles) {
    const expectedDown = `${up.slice(0, -".sql".length)}.down.sql`;
    if (!downFiles.has(expectedDown)) {
      missing.push(`${up} → expected ${expectedDown}`);
    }
  }

  // Orphan down files (down without matching up) are also a smell.
  const upSet = new Set(upFiles);
  const orphans: string[] = [];
  for (const down of downFiles) {
    const expectedUp = `${down.slice(0, -".down.sql".length)}.sql`;
    if (!upSet.has(expectedUp)) {
      orphans.push(`${down} → has no matching ${expectedUp}`);
    }
  }

  if (missing.length === 0 && orphans.length === 0) {
    console.log(
      `Migration pair check OK: ${upFiles.length} migration(s), all paired.`,
    );
    process.exit(0);
  }

  if (missing.length > 0) {
    console.error("Migrations missing a paired .down.sql rollback:");
    for (const m of missing) console.error(`  - ${m}`);
  }
  if (orphans.length > 0) {
    console.error("Orphan .down.sql files (no matching up migration):");
    for (const o of orphans) console.error(`  - ${o}`);
  }
  console.error(
    `\nSee docs/guides/migrations.md — every migration MUST ship with a paired .down.sql.`,
  );
  process.exit(1);
}

run();
