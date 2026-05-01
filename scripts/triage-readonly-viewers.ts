#!/usr/bin/env node
// One-off audit script — slated for deletion in #5 of the seed plan once the
// triage report at docs/superpowers/triage/2026-04-30-readonly-viewers.md is
// committed. Do not depend on this from anywhere else in the repo.
//
// Source spec: docs/superpowers/plans/2026-04-30-readonly-viewer-triage.md (§3).
// Decision (option b): docs/superpowers/triage/2026-04-30-readonly-viewer-target-decision.md.
//
// What it does:
//   For each of the 14 tables backing the 9 read-only viewer apps, fetches
//     - total_rows
//     - rows_last_30d
//     - rows_last_7d
//     - latest_row (max createdAt)
//   buckets each row as live | stalled | abandoned | error, then aggregates
//   per-app and prints two console.table reports.
//
// Required env (the operator's shell — do NOT commit these):
//   SUPABASE_URL                 (or NEXT_PUBLIC_SUPABASE_URL as a fallback)
//   SUPABASE_SERVICE_ROLE_KEY
//
// Usage (run from repo root):
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
//     node --experimental-strip-types scripts/triage-readonly-viewers.ts
//
// Smoke-run note: against a non-prod target with empty schemas, every row
// returning bucket=error (relation does not exist) is the expected signal that
// the script wired up correctly.
//
// Implementation note: imports `createClient` via a relative path to
// `packages/db` so Node/tsx resolve `@supabase/supabase-js` through the db
// package's `node_modules` (no new root-level dependency required — same
// resolution trick used by `scripts/db-seed.ts`). The script is otherwise
// self-contained and adds no new dependencies anywhere.

import { createClient } from "../packages/db/node_modules/@supabase/supabase-js/dist/index.mjs";

export interface AppEntry {
  app: string;
  table: string;
  /**
   * The createdAt column name on this table. The seed plan calls out a
   * camelCase-vs-snake_case split: `clients`, `sites`, `days` use the
   * quoted-camelCase `"createdAt"` form; everything else uses snake_case.
   * supabase-js takes the unquoted JS string here — it URL-encodes the
   * identifier before sending to PostgREST, which then quotes it.
   */
  createdAtCol: "createdAt" | "created_at";
}

export const TARGETS: AppEntry[] = [
  { app: "accounts", table: "clients", createdAtCol: "createdAt" },
  { app: "uptime", table: "sites", createdAtCol: "createdAt" },
  { app: "standup", table: "days", createdAtCol: "createdAt" },
  { app: "sprint-planning", table: "daily_digests", createdAtCol: "created_at" },
  { app: "sprint-planning", table: "daily_overviews", createdAtCol: "created_at" },
  { app: "sprint-planning", table: "weekly_summaries", createdAtCol: "created_at" },
  { app: "summaries", table: "summaries_zoom", createdAtCol: "created_at" },
  { app: "summaries", table: "summaries_slack", createdAtCol: "created_at" },
  { app: "summaries", table: "summaries_jira", createdAtCol: "created_at" },
  { app: "daily-updates", table: "daily_updates", createdAtCol: "created_at" },
  { app: "daily-updates", table: "daily_update_profiles", createdAtCol: "created_at" },
  { app: "meeting-summaries", table: "zoom_transcripts", createdAtCol: "created_at" },
  // The seed plan §3b listed `leads` and `lighthouse_audits` as `created_at`,
  // but the live migrations (supabase/migrations/20260409_leads.sql and
  // 20260429_lighthouse_audits.sql) declare `"createdAt"`. Honoring the
  // schema, not the plan, here.
  { app: "sales", table: "leads", createdAtCol: "createdAt" },
  { app: "lighthouse", table: "lighthouse_audits", createdAtCol: "createdAt" },
];

export interface Row {
  total_rows: number;
  latest_row: string | null;
  rows_last_30d: number;
  rows_last_7d: number;
}

export type Bucket = "live" | "stalled" | "abandoned" | "error";

export interface TableResult extends AppEntry {
  row: Row | null;
  bucket: Bucket;
  error?: string;
}

export interface AppResult {
  app: string;
  bucket: Bucket;
  table_count: number;
  summary: string;
}

export function bucketRow(row: Row): Bucket {
  if (row.total_rows === 0) return "abandoned";
  if (row.rows_last_30d > 0) return "live";
  return "stalled";
}

export function aggregateApp(app: string, rows: TableResult[]): AppResult {
  const buckets = rows.map((r) => r.bucket);
  let bucket: Bucket;
  if (buckets.includes("error")) {
    bucket = "error";
  } else if (buckets.includes("abandoned")) {
    // Per the seed plan §3c: any abandoned table → app is at best stalled.
    // Equivalently, mixed live+abandoned → stalled (some surface broken),
    // pure abandoned across all tables → app is abandoned.
    bucket = buckets.every((b) => b === "abandoned") ? "abandoned" : "stalled";
  } else if (buckets.includes("stalled")) {
    bucket = "stalled";
  } else {
    bucket = "live";
  }

  const summary = rows
    .map((r) => `${r.table}=${r.bucket}(${r.row?.total_rows ?? "—"})`)
    .join(", ");

  return { app, bucket, table_count: rows.length, summary };
}

function isoNDaysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

async function fetchTable(
  supabase: ReturnType<typeof createClient>,
  entry: AppEntry,
): Promise<TableResult> {
  const thirtyDaysAgo = isoNDaysAgo(30);
  const sevenDaysAgo = isoNDaysAgo(7);

  function formatErr(err: { message?: string; code?: string; details?: string; hint?: string }): string {
    const parts = [err.code, err.message, err.details, err.hint].filter(
      (s): s is string => Boolean(s),
    );
    if (parts.length > 0) return parts.join(" — ");
    // Empty PostgrestError on a head-count query usually means the table is
    // not exposed via PostgREST in this project (missing migration or RLS
    // rejecting the service role with no body). Surface that hypothesis in
    // the report rather than the empty `{"message":""}` blob.
    return "(empty PostgrestError — likely table missing or not exposed via PostgREST in this project)";
  }

  // 1) total_rows — head request with exact count, no body.
  const totalQ = await supabase
    .from(entry.table)
    .select("*", { count: "exact", head: true });
  if (totalQ.error) {
    return { ...entry, row: null, bucket: "error", error: formatErr(totalQ.error) };
  }

  // 2) rows_last_30d
  const last30Q = await supabase
    .from(entry.table)
    .select("*", { count: "exact", head: true })
    .gte(entry.createdAtCol, thirtyDaysAgo);
  if (last30Q.error) {
    return { ...entry, row: null, bucket: "error", error: formatErr(last30Q.error) };
  }

  // 3) rows_last_7d
  const last7Q = await supabase
    .from(entry.table)
    .select("*", { count: "exact", head: true })
    .gte(entry.createdAtCol, sevenDaysAgo);
  if (last7Q.error) {
    return { ...entry, row: null, bucket: "error", error: formatErr(last7Q.error) };
  }

  // 4) latest_row — only fetch if there is at least one row, otherwise skip
  // the round-trip. We `select('*')` rather than narrowing to the createdAt
  // column to dodge supabase-js's case-folding of bare camelCase identifiers
  // in the `.select()` projection — pulling the whole row and indexing in
  // JS works uniformly across snake_case and quoted-camelCase columns.
  let latest: string | null = null;
  if ((totalQ.count ?? 0) > 0) {
    const latestQ = await supabase
      .from(entry.table)
      .select("*")
      .order(entry.createdAtCol, { ascending: false })
      .limit(1);
    if (latestQ.error) {
      return { ...entry, row: null, bucket: "error", error: formatErr(latestQ.error) };
    }
    const first = (latestQ.data?.[0] ?? null) as Record<string, string | null> | null;
    latest = first?.[entry.createdAtCol] ?? null;
  }

  const row: Row = {
    total_rows: totalQ.count ?? 0,
    rows_last_30d: last30Q.count ?? 0,
    rows_last_7d: last7Q.count ?? 0,
    latest_row: latest,
  };

  return { ...entry, row, bucket: bucketRow(row) };
}

async function main(): Promise<void> {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) {
    throw new Error(
      "SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) is required. See script header for usage.",
    );
  }
  if (!key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is required. See script header for usage.",
    );
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const tableResults: TableResult[] = [];
  for (const entry of TARGETS) {
    tableResults.push(await fetchTable(supabase, entry));
  }

  // Per-table detail
  console.log("\nPer-table detail (14 rows across 9 apps):");
  console.table(
    tableResults.map((r) => ({
      app: r.app,
      table: r.table,
      bucket: r.bucket,
      total: r.row?.total_rows ?? "—",
      last_30d: r.row?.rows_last_30d ?? "—",
      last_7d: r.row?.rows_last_7d ?? "—",
      latest: r.row?.latest_row ?? "—",
      error: r.error ?? "",
    })),
  );

  // Per-app rollup
  const grouped = new Map<string, TableResult[]>();
  for (const r of tableResults) {
    const list = grouped.get(r.app) ?? [];
    list.push(r);
    grouped.set(r.app, list);
  }
  const appResults: AppResult[] = [];
  for (const [app, rows] of grouped) {
    appResults.push(aggregateApp(app, rows));
  }

  console.log("\nPer-app rollup (9 rows):");
  console.table(
    appResults.map((a) => ({
      app: a.app,
      bucket: a.bucket,
      table_count: a.table_count,
      summary: a.summary,
    })),
  );

  console.log(
    `\nDone. ${tableResults.length} tables across ${appResults.length} apps. ` +
      "Capture this stdout into the report at " +
      "docs/superpowers/triage/2026-04-30-readonly-viewers.md.",
  );
}

const isEntrypoint = import.meta.url === `file://${process.argv[1]}`;
if (isEntrypoint) {
  main().catch((err) => {
    console.error(`\n✖ ${err instanceof Error ? err.message : String(err)}\n`);
    process.exit(1);
  });
}
