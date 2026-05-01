# Read-only viewer triage — 2026-04-30

> Source plan: [docs/superpowers/plans/2026-04-30-readonly-viewer-triage.md](../plans/2026-04-30-readonly-viewer-triage.md).
> Target & query-path decision: [docs/superpowers/triage/2026-04-30-readonly-viewer-target-decision.md](2026-04-30-readonly-viewer-target-decision.md).
> Resolves [#476](https://github.com/last-rev-llc/lr-apps/issues/476). Feeds into [#481](https://github.com/last-rev-llc/lr-apps/issues/481) and [#487](https://github.com/last-rev-llc/lr-apps/issues/487).

This report annotates the output of `scripts/triage-readonly-viewers.ts` for each of the 9 read-only viewer apps —
Accounts, Uptime, Standup, Sprint Planning, Summaries, Daily Updates, Meeting Summaries, Sales, Lighthouse.

## Run metadata

- **Run timestamp:** 2026-04-30 (today).
- **Target environment:** `https://lregiwsovpmljxjvrrsc.supabase.co` (project ref `lregiwsovpmljxjvrrsc`) — the **dev /
  Phase-2+ project**, not a prod read-replica. See the [target-decision doc](2026-04-30-readonly-viewer-target-decision.md)
  for why we accepted dev here.
- **Auth:** service-role key (operator-local, never committed).
- **Query path:** option (b) — multi-roundtrip fallback via `@supabase/supabase-js`.

### **Critical caveat — dev env, not prod**

Every `stalled` bucket below is overwhelmingly the result of **stale demo seed data in dev** — most rows were
seeded in Feb 2026 from `scripts/db-seed.ts`-style fixtures and there is no recurring writer in dev. The
`rows_last_30d = 0` signal that drives the `stalled` bucket here is therefore **not** evidence of a broken
production pipeline; it is the *expected* dev-env state.

**This means:**
- A `stalled` bucket in this report **cannot** justify pausing or greenlighting an E2E plan on its own.
- An `abandoned` bucket in this report (uptime, standup) **cannot** justify a deprecation PR — empty in dev is
  consistent with both "never seeded in dev" and "abandoned everywhere," and the §6 plan rule explicitly requires
  prod evidence before acting on `abandoned`.
- An `error` bucket (meeting-summaries / zoom_transcripts) means the table is missing **in this dev project** and
  needs an unrelated investigation (likely a migration that hasn't been applied to dev).

The downstream actions in #481/#487 inherit these caveats — both will route to a "backlog entry + plan-PR comment
pending prod re-triage" path rather than a definitive bucket-driven action.

## Raw stdout

```
Per-table detail (14 rows across 9 apps):
┌─────────┬─────────────────────┬─────────────────────────┬─────────────┬───────┬──────────┬─────────┬────────────────────────────────────┬──────────────────────────────────────────────────────────────────────────────────────────────┐
│ (index) │ app                 │ table                   │ bucket      │ total │ last_30d │ last_7d │ latest                             │ error                                                                                        │
├─────────┼─────────────────────┼─────────────────────────┼─────────────┼───────┼──────────┼─────────┼────────────────────────────────────┼──────────────────────────────────────────────────────────────────────────────────────────────┤
│ 0       │ 'accounts'          │ 'clients'               │ 'stalled'   │ 5     │ 0        │ 0       │ '2026-02-12T04:04:50.790Z'         │ ''                                                                                           │
│ 1       │ 'uptime'            │ 'sites'                 │ 'abandoned' │ 0     │ 0        │ 0       │ '—'                                │ ''                                                                                           │
│ 2       │ 'standup'           │ 'days'                  │ 'abandoned' │ 0     │ 0        │ 0       │ '—'                                │ ''                                                                                           │
│ 3       │ 'sprint-planning'   │ 'daily_digests'         │ 'stalled'   │ 21    │ 0        │ 0       │ '2026-02-13T19:24:07.937429+00:00' │ ''                                                                                           │
│ 4       │ 'sprint-planning'   │ 'daily_overviews'       │ 'stalled'   │ 7     │ 0        │ 0       │ '2026-02-13T19:24:08.055711+00:00' │ ''                                                                                           │
│ 5       │ 'sprint-planning'   │ 'weekly_summaries'      │ 'stalled'   │ 1     │ 0        │ 0       │ '2026-02-13T19:24:31.222098+00:00' │ ''                                                                                           │
│ 6       │ 'summaries'         │ 'summaries_zoom'        │ 'stalled'   │ 6     │ 0        │ 0       │ '2026-02-23T01:58:48.26931+00:00'  │ ''                                                                                           │
│ 7       │ 'summaries'         │ 'summaries_slack'       │ 'stalled'   │ 6     │ 0        │ 0       │ '2026-02-23T01:58:48.405221+00:00' │ ''                                                                                           │
│ 8       │ 'summaries'         │ 'summaries_jira'        │ 'stalled'   │ 10    │ 0        │ 0       │ '2026-02-23T01:58:48.53618+00:00'  │ ''                                                                                           │
│ 9       │ 'daily-updates'     │ 'daily_updates'         │ 'stalled'   │ 176   │ 0        │ 0       │ '2026-02-27T00:02:38+00:00'        │ ''                                                                                           │
│ 10      │ 'daily-updates'     │ 'daily_update_profiles' │ 'stalled'   │ 12    │ 0        │ 0       │ '2026-02-17T15:43:25.020808+00:00' │ ''                                                                                           │
│ 11      │ 'meeting-summaries' │ 'zoom_transcripts'      │ 'error'     │ '—'   │ '—'      │ '—'     │ '—'                                │ '(empty PostgrestError — likely table missing or not exposed via PostgREST in this project)' │
│ 12      │ 'sales'             │ 'leads'                 │ 'stalled'   │ 45    │ 0        │ 0       │ '—'                                │ ''                                                                                           │
│ 13      │ 'lighthouse'        │ 'lighthouse_audits'     │ 'stalled'   │ 10    │ 0        │ 0       │ '—'                                │ ''                                                                                           │
└─────────┴─────────────────────┴─────────────────────────┴─────────────┴───────┴──────────┴─────────┴────────────────────────────────────┴──────────────────────────────────────────────────────────────────────────────────────────────┘

Per-app rollup (9 rows):
┌─────────┬─────────────────────┬─────────────┬─────────────┬──────────────────────────────────────────────────────────────────────────────────────┐
│ (index) │ app                 │ bucket      │ table_count │ summary                                                                              │
├─────────┼─────────────────────┼─────────────┼─────────────┼──────────────────────────────────────────────────────────────────────────────────────┤
│ 0       │ 'accounts'          │ 'stalled'   │ 1           │ 'clients=stalled(5)'                                                                 │
│ 1       │ 'uptime'            │ 'abandoned' │ 1           │ 'sites=abandoned(0)'                                                                 │
│ 2       │ 'standup'           │ 'abandoned' │ 1           │ 'days=abandoned(0)'                                                                  │
│ 3       │ 'sprint-planning'   │ 'stalled'   │ 3           │ 'daily_digests=stalled(21), daily_overviews=stalled(7), weekly_summaries=stalled(1)' │
│ 4       │ 'summaries'         │ 'stalled'   │ 3           │ 'summaries_zoom=stalled(6), summaries_slack=stalled(6), summaries_jira=stalled(10)'  │
│ 5       │ 'daily-updates'     │ 'stalled'   │ 2           │ 'daily_updates=stalled(176), daily_update_profiles=stalled(12)'                      │
│ 6       │ 'meeting-summaries' │ 'error'     │ 1           │ 'zoom_transcripts=error(—)'                                                          │
│ 7       │ 'sales'             │ 'stalled'   │ 1           │ 'leads=stalled(45)'                                                                  │
│ 8       │ 'lighthouse'        │ 'stalled'   │ 1           │ 'lighthouse_audits=stalled(10)'                                                      │
└─────────┴─────────────────────┴─────────────┴─────────────┴──────────────────────────────────────────────────────────────────────────────────────┘
```

The same stdout has been pasted into the [#476](https://github.com/last-rev-llc/lr-apps/issues/476) thread for
traceability per the AC.

---

## Per-app annotations

For multi-table apps (Sprint Planning, Summaries, Daily Updates) the section lists per-table counts inline and the
overall app bucket follows the §3c rule.

## Accounts

- **Bucket:** stalled
- **Tables:** `clients`
- **Counts:** total=5, last_30d=0, last_7d=0, latest=2026-02-12T04:04:50.790Z
- **Owner:** null
- **Next action:** Pause E2E plan PR [#385](https://github.com/last-rev-llc/lr-apps/pull/385) until prod re-triage
  confirms whether the `clients` ingest pipeline is real. Add a "to investigate" backlog entry.
- **Notes:** 5 demo rows seeded in dev on 2026-02-12. Dev-env caveat applies — `stalled` here does not mean the
  prod pipeline died, only that no one writes to dev. Re-run triage against a prod read-replica before deciding
  greenlight vs. deprecate.

## Uptime

- **Bucket:** abandoned
- **Tables:** `sites`
- **Counts:** total=0, last_30d=0, last_7d=0, latest=—
- **Owner:** null
- **Next action:** Pause E2E plan PR [#388](https://github.com/last-rev-llc/lr-apps/pull/388). Add a "to investigate"
  backlog entry. **Do NOT open a deprecation PR** — `abandoned` in dev with zero rows is consistent with "never
  seeded in dev" *or* "truly abandoned"; per §6 we need prod evidence to take a deprecation action.
- **Notes:** `sites` was never seeded in dev. The Uptime app is meant to render rows from the external
  status-pulse repo (per the migration header); whether that repo is actively writing in prod is the open
  question. Defer until prod read-replica access is provisioned.

## Standup

- **Bucket:** abandoned
- **Tables:** `days`
- **Counts:** total=0, last_30d=0, last_7d=0, latest=—
- **Owner:** null
- **Next action:** Pause E2E plan PR [#390](https://github.com/last-rev-llc/lr-apps/pull/390). Add a "to investigate"
  backlog entry. **Do NOT open a deprecation PR** — same dev-env caveat as Uptime.
- **Notes:** `days` is empty in dev. The seed plan flags Standup as "read-only viewer with zero in-app write
  paths" — the writer presumably lives outside the repo. Re-triage against prod before any deprecation
  conversation.

## Sprint Planning

- **Bucket:** stalled
- **Tables:** `daily_digests`, `daily_overviews`, `weekly_summaries`
- **Counts:**
  - `daily_digests` → total=21, last_30d=0, last_7d=0, latest=2026-02-13T19:24:07.937Z
  - `daily_overviews` → total=7, last_30d=0, last_7d=0, latest=2026-02-13T19:24:08.055Z
  - `weekly_summaries` → total=1, last_30d=0, last_7d=0, latest=2026-02-13T19:24:31.222Z
- **Owner:** null
- **Next action:** Pause E2E plan PR [#395](https://github.com/last-rev-llc/lr-apps/pull/395). Add a "to investigate"
  backlog entry covering all three tables.
- **Notes:** All three tables have demo seed rows from 2026-02-13; nothing has written since. The `weekly_summaries`
  table only has 1 row, which under the seed plan §4 seasonal-table override might warrant `live` *if* writes
  arrive weekly in prod — but with `latest=2026-02-13` (~10 weeks ago) and no new rows in 30 days, even the
  seasonal override doesn't rescue this from `stalled` in dev. Same dev-env caveat applies for all three.

## Summaries

- **Bucket:** stalled
- **Tables:** `summaries_zoom`, `summaries_slack`, `summaries_jira`
- **Counts:**
  - `summaries_zoom` → total=6, last_30d=0, last_7d=0, latest=2026-02-23T01:58:48.269Z
  - `summaries_slack` → total=6, last_30d=0, last_7d=0, latest=2026-02-23T01:58:48.405Z
  - `summaries_jira` → total=10, last_30d=0, last_7d=0, latest=2026-02-23T01:58:48.536Z
- **Owner:** null
- **Next action:** Pause E2E plan PR [#387](https://github.com/last-rev-llc/lr-apps/pull/387). Add a "to investigate"
  backlog entry covering all three tables.
- **Notes:** All three tables seeded in a single batch on 2026-02-23 (matching latest timestamps within
  ~300 ms). Classic demo-seed signature — no real Zoom/Slack/Jira webhook traffic in dev. Re-triage against prod.

## Daily Updates

- **Bucket:** stalled
- **Tables:** `daily_updates`, `daily_update_profiles`
- **Counts:**
  - `daily_updates` → total=176, last_30d=0, last_7d=0, latest=2026-02-27T00:02:38.000Z
  - `daily_update_profiles` → total=12, last_30d=0, last_7d=0, latest=2026-02-17T15:43:25.020Z
- **Owner:** null
- **Next action:** Pause E2E plan PR [#396](https://github.com/last-rev-llc/lr-apps/pull/396). Add a "to investigate"
  backlog entry.
- **Notes:** Largest seed dataset of the lot (176 rows in `daily_updates`). Latest writes were late-Feb 2026 across
  both tables. Same dev-env caveat — re-triage against prod before pausing or greenlighting.

## Meeting Summaries

- **Bucket:** error
- **Tables:** `zoom_transcripts`
- **Counts:** —
- **Owner:** null
- **Next action:** Investigate the missing-table error before re-running. Specifically: confirm whether
  `zoom_transcripts` has a migration in `supabase/migrations/` (it doesn't, as of this run — `ls
  supabase/migrations | grep zoom` returns nothing) and whether the Meeting Summaries app at
  `apps/web/app/apps/meeting-summaries/` reads from a different table name than the seed plan claims. If the table
  was renamed, fix the script's TARGETS entry; if the migration was never authored, that's a separate bug
  unrelated to triage. Pause E2E plan PR [#383](https://github.com/last-rev-llc/lr-apps/pull/383) until resolved.
- **Notes:** PostgREST returned an empty error object on the head-count request — this is the supabase-js v2
  signature for "table not exposed." Most likely cause: no migration was ever authored for `zoom_transcripts` in
  this repo. Either the table is created by an external service and the app is supposed to reach into a foreign
  schema, or the seed plan's table name is wrong, or the migration is genuinely missing. None of these are
  triage-script bugs — escalate.

## Sales

- **Bucket:** stalled
- **Tables:** `leads`
- **Counts:** total=45, last_30d=0, last_7d=0, latest=null (createdAt column populated as null on existing rows)
- **Owner:** null
- **Next action:** Pause E2E plan PR [#384](https://github.com/last-rev-llc/lr-apps/pull/384). Add a "to investigate"
  backlog entry.
- **Notes:** 45 rows but `createdAt` is null on every one — the seed/import path that populated this table did not
  set `createdAt`, even though the migration declares it `not null default now()`. This is a separate data-quality
  bug worth flagging: rows must have been inserted via direct SQL bypassing the default. Note: §2 of the seed plan
  flags `leads` as out-of-scope for this triage because the AI Calculator writes to the same table — but Sales
  reads it as a viewer, so it is in scope under the Sales row.

## Lighthouse

- **Bucket:** stalled
- **Tables:** `lighthouse_audits`
- **Counts:** total=10, last_30d=0, last_7d=0, latest=null (text column, populated as null on existing rows)
- **Owner:** null
- **Next action:** Pause E2E plan PR [#404](https://github.com/last-rev-llc/lr-apps/pull/404). Add a "to investigate"
  backlog entry.
- **Notes:** Same data-quality observation as Sales — `createdAt` is null on every existing row. The
  `lighthouse_audits` migration declares `"createdAt" text` (not timestamptz, no default), which is itself worth
  flagging — text-typed timestamp columns lose ordering semantics and should probably be migrated to `timestamptz`
  in a follow-up. Re-triage against prod when access is provisioned.

---

## Summary table

| App | Bucket | Tables (rows in dev) | E2E plan PR | Recommended action |
|---|---|---|---|---|
| Accounts | stalled | clients (5) | [#385](https://github.com/last-rev-llc/lr-apps/pull/385) | Backlog + pause comment |
| Uptime | abandoned | sites (0) | [#388](https://github.com/last-rev-llc/lr-apps/pull/388) | Backlog + pause comment (NO deprecation PR — dev-env caveat) |
| Standup | abandoned | days (0) | [#390](https://github.com/last-rev-llc/lr-apps/pull/390) | Backlog + pause comment (NO deprecation PR — dev-env caveat) |
| Sprint Planning | stalled | digests (21), overviews (7), weekly (1) | [#395](https://github.com/last-rev-llc/lr-apps/pull/395) | Backlog + pause comment |
| Summaries | stalled | zoom (6), slack (6), jira (10) | [#387](https://github.com/last-rev-llc/lr-apps/pull/387) | Backlog + pause comment |
| Daily Updates | stalled | updates (176), profiles (12) | [#396](https://github.com/last-rev-llc/lr-apps/pull/396) | Backlog + pause comment |
| Meeting Summaries | error | zoom_transcripts (missing) | [#383](https://github.com/last-rev-llc/lr-apps/pull/383) | Investigate missing migration; pause |
| Sales | stalled | leads (45, createdAt null) | [#384](https://github.com/last-rev-llc/lr-apps/pull/384) | Backlog + pause comment + flag null-createdAt data-quality bug |
| Lighthouse | stalled | lighthouse_audits (10, createdAt null) | [#404](https://github.com/last-rev-llc/lr-apps/pull/404) | Backlog + pause comment + flag null-createdAt + text-typed-timestamp bugs |

## Follow-ups

1. **Re-run against prod read-replica** once provisioned. The current report's bucketing is dev-env-only and
   cannot drive deprecation decisions.
2. **Investigate `zoom_transcripts`** — missing migration or wrong table name. Track separately from this triage.
3. **Investigate null `createdAt` on `leads` and `lighthouse_audits`** — data was inserted bypassing column
   defaults. Both tables also have follow-up schema bugs worth filing (`lighthouse_audits."createdAt"` is
   text-typed; `leads` has a `not null default now()` constraint that has been violated).
4. **Owner column is null everywhere.** The seed plan §5 said null is fine for unowned apps — these all are.
   Filling owners is a separate exercise outside this triage.
5. **Delete `scripts/triage-readonly-viewers.ts`** per [#5 of the seed plan](../plans/2026-04-30-readonly-viewer-triage.md#7-out-of-scope)
   once the prod re-run is also captured. Keeping the script around long-term turns a one-off audit into
   shadow infrastructure.

## Action log

Per-app follow-ups opened in response to this report (issues #481, #487, etc.):

| App | Issue | Bucket | Backlog entry | Plan-PR comment |
|---|---|---|---|---|
| Accounts | [#481](https://github.com/last-rev-llc/lr-apps/issues/481) | stalled (dev-only) | [#641](https://github.com/last-rev-llc/lr-apps/issues/641) | [PR #385 comment](https://github.com/last-rev-llc/lr-apps/pull/385#issuecomment-4356981777) |
| Uptime | [#487](https://github.com/last-rev-llc/lr-apps/issues/487) | abandoned (dev-only; manually overridden to stalled per §4) | [#642](https://github.com/last-rev-llc/lr-apps/issues/642) | [PR #388 comment](https://github.com/last-rev-llc/lr-apps/pull/388#issuecomment-4356987795) |
| Standup | [#493](https://github.com/last-rev-llc/lr-apps/issues/493) | abandoned (dev-only; manually overridden to stalled per §4) | [#644](https://github.com/last-rev-llc/lr-apps/issues/644) | [PR #390 comment](https://github.com/last-rev-llc/lr-apps/pull/390#issuecomment-4357084820) |
| Sprint Planning | [#499](https://github.com/last-rev-llc/lr-apps/issues/499) | stalled (dev-only; all 3 tables — seasonality override evaluated, not applied) | [#645](https://github.com/last-rev-llc/lr-apps/issues/645) | [PR #395 comment](https://github.com/last-rev-llc/lr-apps/pull/395#issuecomment-4357089685) |
| Summaries | [#505](https://github.com/last-rev-llc/lr-apps/issues/505) | stalled (dev-only; all 3 source pipelines together — single demo-seed batch on 2026-02-23) | [#646](https://github.com/last-rev-llc/lr-apps/issues/646) | [PR #387 comment](https://github.com/last-rev-llc/lr-apps/pull/387#issuecomment-4357093665) |
| Daily Updates | [#512](https://github.com/last-rev-llc/lr-apps/issues/512) | stalled (dev-only; both tables — neither side empty, largest seed dataset in the cohort) | [#647](https://github.com/last-rev-llc/lr-apps/issues/647) | [PR #396 comment](https://github.com/last-rev-llc/lr-apps/pull/396#issuecomment-4357097380) |
