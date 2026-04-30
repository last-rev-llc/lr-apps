# Plan: Triage the read-only viewer apps

> Seed for `alpha-plan`. Drafted 2026-04-30.

Across the 27 E2E plan PRs (#382-#408), nine apps surfaced as **read-only frontends with zero in-app write paths** — they render rows from tables that someone or something else is supposed to populate. We don't know which "someone or something" is real and which is theoretical. This plan answers that, fast.

The output is a one-row-per-app classification (live / stalled / abandoned) and a concrete next action per bucket. No new tests, no new code in apps/web — just a small script and a written triage doc.

---

## 1. Why this matters

Each of the 9 apps has an open E2E plan that depends on the underlying table being populated by an ingestion pipeline. Implementing those plans is wasted effort if the pipeline doesn't exist (and won't ever). A 30-minute triage saves us from writing tests for ghost features.

It also surfaces which apps to deprecate from `apps/web/lib/app-registry.ts` — every registry entry costs surface area (proxy routes, tier resolution, self-enroll wiring, navigation slots).

## 2. Apps in scope (the 9 viewers)

| App | Tables to inspect | E2E plan |
|---|---|---|
| Accounts | `clients` | [#385](https://github.com/last-rev-llc/lr-apps/pull/385) |
| Uptime | `sites` | [#388](https://github.com/last-rev-llc/lr-apps/pull/388) |
| Standup | `days` | [#390](https://github.com/last-rev-llc/lr-apps/pull/390) |
| Sprint Planning | `daily_digests`, `daily_overviews`, `weekly_summaries` | [#395](https://github.com/last-rev-llc/lr-apps/pull/395) |
| Summaries | `summaries_zoom`, `summaries_slack`, `summaries_jira` | [#387](https://github.com/last-rev-llc/lr-apps/pull/387) |
| Daily Updates | `daily_updates`, `daily_update_profiles` | [#396](https://github.com/last-rev-llc/lr-apps/pull/396) |
| Meeting Summaries | `zoom_transcripts` | [#383](https://github.com/last-rev-llc/lr-apps/pull/383) |
| Sales | `leads` | [#384](https://github.com/last-rev-llc/lr-apps/pull/384) |
| Lighthouse audits | `lighthouse_audits` | [#404](https://github.com/last-rev-llc/lr-apps/pull/404) |

Apps explicitly **not** in scope:
- Sentiment (#389) — has a 65-row demo dataset rendering today; pipeline status confirmed.
- AI Calculator (`leads`) — actively writes via the lead-capture flow (now fixed in #412); same `leads` table appears under "Sales", but the writer is local, not external.
- Anything `template: "minimal"` with client-only state (HSPT, Soccer Training, Brommie Quake, etc.) — no pipeline question to answer.

## 3. The triage script

A single SQL block per app + a thin node wrapper that prints a report. Lives at `scripts/triage-readonly-viewers.ts` (one-off; delete after the triage is done — it's not a recurring job).

### 3a. Per-table query

For each table, run:

```sql
select
  '<table>'                              as table_name,
  count(*)                               as total_rows,
  max(created_at)                        as latest_row,
  count(*) filter (
    where created_at > now() - interval '30 days'
  )                                      as rows_last_30d,
  count(*) filter (
    where created_at > now() - interval '7 days'
  )                                      as rows_last_7d
from public.<table>;
```

Tables that use quoted camelCase (`clients`, `sites`, `days`) substitute `"createdAt"` for `created_at`. The script handles that branch.

### 3b. The wrapper

```ts
// scripts/triage-readonly-viewers.ts
// Run via: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
//   node --experimental-strip-types scripts/triage-readonly-viewers.ts

import { createClient } from "@supabase/supabase-js";

interface AppEntry {
  app: string;
  table: string;
  createdAtCol: "created_at" | '"createdAt"';
}

const TARGETS: AppEntry[] = [
  { app: "accounts",         table: "clients",              createdAtCol: '"createdAt"' },
  { app: "uptime",           table: "sites",                createdAtCol: '"createdAt"' },
  { app: "standup",          table: "days",                 createdAtCol: '"createdAt"' },
  { app: "sprint-planning",  table: "daily_digests",        createdAtCol: "created_at" },
  { app: "sprint-planning",  table: "daily_overviews",      createdAtCol: "created_at" },
  { app: "sprint-planning",  table: "weekly_summaries",     createdAtCol: "created_at" },
  { app: "summaries",        table: "summaries_zoom",       createdAtCol: "created_at" },
  { app: "summaries",        table: "summaries_slack",      createdAtCol: "created_at" },
  { app: "summaries",        table: "summaries_jira",       createdAtCol: "created_at" },
  { app: "daily-updates",    table: "daily_updates",        createdAtCol: "created_at" },
  { app: "daily-updates",    table: "daily_update_profiles", createdAtCol: "created_at" },
  { app: "meeting-summaries", table: "zoom_transcripts",    createdAtCol: "created_at" },
  { app: "sales",            table: "leads",                createdAtCol: "created_at" },
  { app: "lighthouse",       table: "lighthouse_audits",    createdAtCol: "created_at" },
];

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

interface Row {
  total_rows: number;
  latest_row: string | null;
  rows_last_30d: number;
  rows_last_7d: number;
}

function bucket(row: Row): "live" | "stalled" | "abandoned" {
  if (row.total_rows === 0) return "abandoned";
  if (row.rows_last_30d > 0) return "live";
  return "stalled";
}

const results: Array<AppEntry & { row: Row | null; bucket: string; error?: string }> = [];

for (const entry of TARGETS) {
  const sql = `
    select
      count(*)::int as total_rows,
      max(${entry.createdAtCol}) as latest_row,
      count(*) filter (where ${entry.createdAtCol} > now() - interval '30 days')::int as rows_last_30d,
      count(*) filter (where ${entry.createdAtCol} > now() - interval '7 days')::int as rows_last_7d
    from public.${entry.table};
  `;
  const { data, error } = await supabase.rpc("exec_sql", { sql });
  // OR if exec_sql RPC isn't available: use the supabase-js .from().select() with
  // server-side aggregations split across multiple round-trips.

  if (error) {
    results.push({ ...entry, row: null, bucket: "error", error: error.message });
    continue;
  }
  const row = (data as Row[])[0];
  results.push({ ...entry, row, bucket: bucket(row) });
}

console.table(
  results.map((r) => ({
    app: r.app,
    table: r.table,
    bucket: r.bucket,
    total: r.row?.total_rows ?? "—",
    last_30d: r.row?.rows_last_30d ?? "—",
    latest: r.row?.latest_row ?? "—",
    error: r.error ?? "",
  })),
);
```

> **Note**: Supabase doesn't expose a generic `exec_sql` RPC by default. If yours isn't set up, two fallbacks: (a) install the [supabase-js raw-SQL helper](https://supabase.com/docs/reference/javascript/rpc) by creating a `create or replace function exec_sql(sql text) returns setof json` SECURITY DEFINER, OR (b) replace each query with an explicit `.from(table).select("created_at").order("created_at", { ascending: false }).limit(1)` plus a separate `.select("count")` head request. Both work; (a) is shorter.

### 3c. Aggregating per app

Some apps have multiple tables. The wrapper groups results by `app` and assigns the worst bucket across that app's tables:

```ts
// rule of thumb:
// - any 'error' table → app is 'error' (manual investigation needed)
// - any 'abandoned' table → app is at best 'stalled' (something's missing)
// - all 'live' → app is 'live'
```

Sprint Planning and Summaries each have 3 tables; Daily Updates has 2. If even one of their tables is empty, the feature surface that depends on that table is broken — bucket as `stalled`.

## 4. Decision matrix

| Bucket | Definition | Action |
|---|---|---|
| **live** | total_rows > 0 AND rows_last_30d > 0 | Implement the E2E plan now. The pipeline works; the test surface is real. |
| **stalled** | total_rows > 0 AND rows_last_30d = 0 | Investigate. Either (a) the pipeline died and needs fixing, or (b) the seeded rows are stale demo data. Pause the E2E plan until decided. |
| **abandoned** | total_rows = 0 | Two paths: deprecate the app from `app-registry.ts`, or commit to building the pipeline. Decision lives with whoever owns the app. The E2E plan is on ice either way. |
| **error** | Query failed (table missing, permission denied, etc.) | Manual investigation. The migration may be unapplied in the env you're running against, or the table may have been renamed. |

The rule deliberately doesn't try to be smart about "stalled but seasonal" cases (e.g. weekly_summaries that only writes once a week). If you hit one, override the bucket manually in the report.

## 5. Outputs / deliverables

- A markdown report at `docs/superpowers/triage/2026-04-30-readonly-viewers.md` with one section per app:
  - Bucket assignment + the raw row counts that drove it
  - One-sentence next-action recommendation
  - Owner (filled in by whoever runs the script — null is fine if unowned)
- For each `abandoned` app: a follow-up issue or PR removing it from `apps/web/lib/app-registry.ts`. The PR should also delete the corresponding `apps/web/app/apps/<slug>/` route group, the test plan in `docs/superpowers/plans/`, and the migration from `supabase/migrations/` (with paired down).
- For each `stalled` app: a one-line entry in the team's "to investigate" backlog.
- For each `live` app: greenlight to implement that E2E plan.

## 6. Open questions to settle before running

- **Which Supabase project to query?** The triage answers depend on which environment ("does production have rows?" is the most useful signal; dev/staging may be empty by design). Run against production read-replicas if available; otherwise prod with the service-role key, accepted risk for a one-off audit.
- **Who decides "abandoned"?** A row count of 0 in production is strong evidence but not proof of intent. Loop in product/engineering ownership before the deprecation PR for any app whose UI could plausibly be salvaged.
- **Sentiment-style demo seed**: if a "live" bucket turns out to be just demo seed data with no recurring writes, downgrade to `stalled` manually. The 30-day window catches most of these but not all.

## 7. Out of scope

- Building the actual ingestion pipelines for `stalled` / `abandoned` apps. That's a per-app product decision, not a triage step.
- Deleting the migrations themselves for `abandoned` apps as part of *this* plan — separate cleanup PRs per app, so each can be reviewed independently.
- Re-running the triage on a recurring cadence. This is a one-off; if data freshness is a concern long-term, that's a separate "pipeline health monitor" effort.
- Triaging the AI Calculator → `leads` write path (it's not a viewer; it's an active writer).

---

## Execution order

1. Confirm the Supabase target (production read-replica preferred) and gather `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` for it.
2. Decide between the `exec_sql` RPC and the multi-round-trip fallback (§3b note). 5 minutes.
3. Drop the script at `scripts/triage-readonly-viewers.ts`. ~30 minutes including the fallback path.
4. Run it. Capture stdout to `docs/superpowers/triage/2026-04-30-readonly-viewers.md` and annotate each row with the action.
5. For each `abandoned` row, open a deprecation issue (do not auto-PR — give product a chance to push back).
6. For each `live` row, green-light the matching E2E plan.
7. Delete `scripts/triage-readonly-viewers.ts` once the report is written. It's an audit script, not infrastructure.

Total time: ~1 hour active, plus async waits for any product clarification on `abandoned` rows.
