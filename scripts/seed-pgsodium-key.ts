// Mints a fresh pgsodium key for the chatflow_targets store and prints
// `PGSODIUM_KEY_ID=<uuid>` to stdout.
//
// Used by:
//   * .github/workflows/ai-eval-integration.yml — captures the key id into
//     GITHUB_OUTPUT and exposes it as PGSODIUM_KEY_ID for the test step.
//   * Local devs who started Supabase via `supabase start` and need a key id
//     to put in .env.local before exercising target-store.
//
// Reads SUPABASE_DB_URL (the postgres connection string from
// `supabase status --output env`).

import { spawnSync } from "node:child_process";

const dbUrl = process.env.SUPABASE_DB_URL;
if (!dbUrl) {
  console.error("seed-pgsodium-key: SUPABASE_DB_URL is required");
  process.exit(1);
}

const name = `chatflow_targets_${Date.now()}`;
const sql = `select id from pgsodium.create_key(name => '${name}');`;

const result = spawnSync(
  "psql",
  [dbUrl, "-t", "-A", "-v", "ON_ERROR_STOP=1", "-c", sql],
  { stdio: ["ignore", "pipe", "inherit"] },
);

if (result.error) {
  console.error("seed-pgsodium-key: failed to spawn psql:", result.error.message);
  process.exit(1);
}
if (typeof result.status === "number" && result.status !== 0) {
  console.error("seed-pgsodium-key: psql exited", result.status);
  process.exit(result.status);
}

const id = (result.stdout?.toString() ?? "")
  .split("\n")
  .map((line) => line.trim())
  .find((line) => line.length > 0);

if (!id) {
  console.error("seed-pgsodium-key: pgsodium.create_key returned no id");
  process.exit(1);
}

process.stdout.write(`PGSODIUM_KEY_ID=${id}\n`);
