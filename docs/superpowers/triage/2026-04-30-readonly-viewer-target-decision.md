# Read-only viewer triage — target & query-path decision

> Resolves [#466](https://github.com/last-rev-llc/lr-apps/issues/466). Locks in the prerequisite decisions for the
> [readonly-viewer-triage seed plan](../plans/2026-04-30-readonly-viewer-triage.md) so [#471](https://github.com/last-rev-llc/lr-apps/issues/471)
> has a single path to implement.

## Target environment

- **Host:** `https://lregiwsovpmljxjvrrsc.supabase.co`
- **Project ref:** `lregiwsovpmljxjvrrsc`
- **Status:** Dev / Phase-2+ project (the same project the alpha-loop session and local dev run against;
  see `.env.local` `NEXT_PUBLIC_SUPABASE_URL`).

The seed plan §6 strongly preferred a **production read-replica**. No read-replica is currently provisioned for the
LR Apps Supabase project, and the operator running this audit only has dev credentials in `.env.local`. We accept
running against dev for the v1 triage with the explicit caveat that any `abandoned` bucket coming out of dev is
**not** sufficient evidence to deprecate an app — empty-in-dev is the *expected* state for a viewer whose pipeline
writes to prod. The triage report must call out the env it ran against and downgrade confidence for any
deprecation recommendation accordingly.

If/when prod read-replica access becomes available, re-run the triage and update the report. The script is target-agnostic
— it reads `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from env, so re-running against a different project is just a
matter of swapping env vars.

Service-role-on-prod for a read-only audit is acceptable per §6 of the plan, but only after product/eng owner ack.

## Query-path decision

**Decision: option (b) — multi-roundtrip fallback.**

Rationale (one line, per AC): no DB schema change in prod is the safer default for a one-off audit script slated for
deletion in [#5 of the seed plan](../plans/2026-04-30-readonly-viewer-triage.md#7-out-of-scope) — installing a
`SECURITY DEFINER exec_sql` helper just to delete it again is more risk than the marginal code-shortening is worth.

### What option (b) means in practice

For each table the script issues 4 round-trips via `@supabase/supabase-js`:

1. `supabase.from(table).select('*', { count: 'exact', head: true })` — total row count.
2. `supabase.from(table).select('*', { count: 'exact', head: true }).gte(createdAtCol, now-30d)` — `rows_last_30d`.
3. `supabase.from(table).select('*', { count: 'exact', head: true }).gte(createdAtCol, now-7d)` — `rows_last_7d`.
4. `supabase.from(table).select(createdAtCol).order(createdAtCol, { ascending: false }).limit(1)` — `latest_row`.

`createdAtCol` is the unquoted JS string (`'createdAt'` or `'created_at'`); supabase-js URL-encodes it correctly.
The `"createdAt"` SQL-quoting form from the seed plan is only relevant when emitting raw SQL via the rejected
option (a) `exec_sql` path.

14 tables × 4 round-trips = 56 head/select requests for one full triage run. At ~50 ms per round-trip from a
laptop that's <3 s wall-clock — fine for a one-off.

## Operator runbook

```bash
# Required env (do NOT commit these — they live in .env.local locally and in the operator's shell only):
export SUPABASE_URL=https://lregiwsovpmljxjvrrsc.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=<service-role JWT from .env.local>

# Run from repo root:
npx tsx scripts/triage-readonly-viewers.ts
```

Capture stdout into the issue thread for [#476](https://github.com/last-rev-llc/lr-apps/issues/476) when authoring
the annotated report.
