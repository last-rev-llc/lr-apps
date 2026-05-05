#!/usr/bin/env node
// Provisions the pgsodium key used to encrypt
// `chatflow_targets.api_token_encrypted`. Idempotent: tags the key with a
// stable name (`chatflow_targets_api_token_v1`) so re-runs detect the
// existing key and print its id without creating a duplicate.
//
// After running, set the printed UUID as `PGSODIUM_KEY_ID` in your env
// (.env.local for dev, Vercel project env for staging/prod). See
// docs/ops/chatflow-eval-rotation.md for rotation procedure.
//
// Required env:
//   SUPABASE_DB_URL or DATABASE_URL (postgres connection string)
//     For local dev: postgresql://postgres:postgres@127.0.0.1:54322/postgres
//
// Usage:
//   pnpm seed:pgsodium-key            # creates or prints the existing key id
//   pnpm seed:pgsodium-key --dryRun   # reports what would happen, writes nothing

import { spawnSync } from "node:child_process";

export const PGSODIUM_KEY_NAME = "chatflow_targets_api_token_v1";

export interface ParsedFlags {
  dryRun: boolean;
}

export function parseFlags(argv: string[]): ParsedFlags {
  let dryRun = false;
  for (const arg of argv) {
    if (arg === "--dryRun" || arg === "--dry-run") dryRun = true;
  }
  return { dryRun };
}

// SQL execution abstraction so tests can inject a mock without spawning psql.
// Returns one string per row of the first column of the result set.
export type SqlExecutor = (sql: string) => Promise<string[]>;

function defaultExecutor(): SqlExecutor {
  const dbUrl = process.env.SUPABASE_DB_URL ?? process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error(
      "Set SUPABASE_DB_URL (or DATABASE_URL) to a Postgres connection string.\n" +
        "For local dev: SUPABASE_DB_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres",
    );
  }
  return async (sql: string): Promise<string[]> => {
    const result = spawnSync(
      "psql",
      [dbUrl, "-t", "-A", "-v", "ON_ERROR_STOP=1", "-c", sql],
      { stdio: ["ignore", "pipe", "pipe"] },
    );
    if (result.error) {
      throw new Error(`Failed to invoke psql: ${result.error.message}`);
    }
    if (typeof result.status === "number" && result.status !== 0) {
      const stderr = result.stderr?.toString() ?? "";
      throw new Error(`psql exited ${result.status}: ${stderr.trim()}`);
    }
    const stdout = result.stdout?.toString() ?? "";
    return stdout
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  };
}

export interface SeedResult {
  keyId: string;
  created: boolean;
  dryRun: boolean;
}

export async function seed(
  flags: ParsedFlags = { dryRun: false },
  executor?: SqlExecutor,
): Promise<SeedResult> {
  const exec = executor ?? defaultExecutor();

  // Use a SQL literal; PGSODIUM_KEY_NAME is a hard-coded constant so there's
  // no injection surface. quote_literal() would still be safer if we ever
  // make this dynamic.
  const lookupRows = await exec(
    `select id from pgsodium.key where name = '${PGSODIUM_KEY_NAME}' limit 1;`,
  );
  if (lookupRows.length > 0 && lookupRows[0]) {
    return { keyId: lookupRows[0], created: false, dryRun: flags.dryRun };
  }

  if (flags.dryRun) {
    return { keyId: "", created: true, dryRun: true };
  }

  const createRows = await exec(
    `select id from pgsodium.create_key(name => '${PGSODIUM_KEY_NAME}');`,
  );
  if (createRows.length === 0 || !createRows[0]) {
    throw new Error("pgsodium.create_key returned no rows");
  }
  return { keyId: createRows[0], created: true, dryRun: false };
}

const isEntrypoint = import.meta.url === `file://${process.argv[1]}`;
if (isEntrypoint) {
  const flags = parseFlags(process.argv.slice(2));
  seed(flags)
    .then((result) => {
      if (result.dryRun && result.created) {
        console.log(
          `[dryRun] would create new pgsodium key named '${PGSODIUM_KEY_NAME}'.`,
        );
        return;
      }
      if (result.created) {
        console.log(`Created pgsodium key '${PGSODIUM_KEY_NAME}'.`);
      } else {
        console.log(`Found existing pgsodium key '${PGSODIUM_KEY_NAME}'.`);
      }
      console.log(`PGSODIUM_KEY_ID=${result.keyId}`);
      console.log(
        "\nSet this UUID as PGSODIUM_KEY_ID in your env (.env.local locally;\n" +
          "Vercel project env for staging/prod). See docs/ops/chatflow-eval-rotation.md.",
      );
    })
    .catch((err: unknown) => {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`seed-pgsodium-key failed: ${message}`);
      process.exit(1);
    });
}
