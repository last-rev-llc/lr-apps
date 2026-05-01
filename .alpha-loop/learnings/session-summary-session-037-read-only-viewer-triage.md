# Session Summary: session/037-read-only-viewer-triage

## Overview
A read-only viewer triage session producing a 14-table audit report and 13 bucket-driven action issues. The first batch (5 issues, all failed) was blocked by 2 pre-existing sprint-planning test failures that the agent never attempted to repair; the second and third batches (8 issues, all succeeded) landed cleanly after the test brittleness was proactively fixed with frozen system time. Doc-only batching of routed actions through follow-up issues (#644-#648) + paused-PR comments worked well as the auditable artifact pattern.

## Recurring Patterns
- **Dev-env caveat in triage reports** — explicitly downgrading confidence on `abandoned`/`stalled` buckets when the run is against dev (not prod read-replica) prevented every downstream issue from forcing premature deprecation PRs.
- **Manual §4 override with three-place documentation** — when literal AC conflicted with dev-vs-prod evidence, deviation was documented in commit + report + linked PR comment + follow-up issue, giving a defensible audit trail.
- **Action-log batching** — grouping bucket-driven issues with the same routing (#493/#499/#505/#512/#517) into a single doc commit reduced churn while keeping per-app rationale.
- **Frozen system time for date-window UI tests** — `vi.useFakeTimers({ shouldAdvanceTime: true })` + `vi.setSystemTime(...)` + `afterAll` cleanup is the canonical fix for components filtering against hardcoded fixture dates.
- **Multi-roundtrip supabase-js over `SECURITY DEFINER` RPC** for one-off audit scripts — no schema change, no cleanup debt.

## Recurring Anti-Patterns
- **Shipping with failing tests and `test_fix_retries=0`** — issues #466/#471/#476/#481/#487 all failed on the same 2 sprint-planning Archives tab tests and none of them attempted a repair, even when the failure was unrelated to the issue's scope.
- **Partial-text matchers** — `getByText("Weekly")` against a rendered "Weekly Summaries" label is brittle; full strings or `getByRole('button', { name: /^Weekly/ })` would prevent it.
- **Brittle relative imports through `packages/db/node_modules/@supabase/supabase-js/...`** — relies on pnpm symlink internals; should use a workspace-resolved path even for throwaway scripts.
- **Treating dev-env empty tables as "abandoned"** — repeatedly flagged in 8+ learnings; the rule is internalized but the script still produces these buckets, requiring per-issue manual override.

## Recommendations
- **Update the implement prompt** to require a test-fix retry loop (≥1 attempt) whenever `turbo run test` reports failures, even when failures appear unrelated to the issue's scope — pre-existing failures still block CI and should be repaired or explicitly triaged before reporting completion.
- **Update `test-robustness` skill** with the date-window pattern from issue #523/#530/#535 as the canonical example: `vi.setSystemTime` at module scope + `shouldAdvanceTime: true` + `afterAll(() => vi.useRealTimers())`.
- **Update `testing-patterns` skill** to recommend exact-string or anchored-regex matchers (`getByRole('button', { name: /^Weekly$/ })`) and to grep the component source for the actual rendered string before writing the assertion.
- **Update `code-review` skill** with a check: "any new page/registry entry calling `supabase.from('<table>')` must have a corresponding migration in `supabase/migrations/`" — caught in #530/#535 review, would have been a runtime break.
- **Bake the dev-env caveat into the triage script itself** — emit `bucket: stalled (dev-only — prod re-triage required)` rather than `abandoned` when running against a non-prod project, so per-issue manual overrides become unnecessary.
- **Resolve the brittle `node_modules/...` import** in `scripts/triage-readonly-viewers.ts` by adding `@supabase/supabase-js` to the script's package or using the existing `@repo/db` re-export, before the script gets re-run.

## Metrics
| Metric | Value |
|--------|-------|
| Issues processed | 13 |
| Success rate | 62% |
| Avg duration | 313s |
| Total duration | 68 min |
