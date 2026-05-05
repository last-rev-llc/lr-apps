# Session Summary: session/052-ai-eval-shared-package-foundation

## Overview
This session implemented the AI Eval shared package foundation across 15 issues spanning DB migrations (#677–#681), package scaffolding (#682), and ai-eval modules (#683–#691). All implementation work landed correctly per acceptance criteria, but every issue was marked failure due to the same 6 pre-existing `proxy.integration.test.ts` failures (auth.apps.lastrev.com host rewrites returning null) that live on main and are already documented in memory as `proxy-auth-hub-bug.md`. The runner repeatedly failed on this baseline noise without distinguishing it from regressions.

## Recurring Patterns
- **Idempotent pgsodium provisioning**: stable-named keys (`<table>_<column>_v1`) with lookup-before-create seed scripts, paired with zod UUID validation in `env.ts` for fail-fast misconfiguration.
- **Required env var propagation**: `lib/env.ts` schema + `turbo.json` globalEnv + `.env.example` + every CI workflow (a11y-audit, mobile-audit, ci) must update together; audit jobs use mock-UUID fallback so dev server boots without real secrets.
- **Migration patterns**: paired up/down files with `create extension if not exists`, idempotent enum creation via `DO $$ ... EXCEPTION WHEN duplicate_object`, RLS row-policies via `EXISTS` subquery against parent tables, storage RLS keyed on `storage.foldername(name)[1] = auth.uid()::text`.
- **Server-only boundaries**: `import "server-only"` + per-subpath exports (`./client`, `./server`, `./ui`, `./schema`) + grep-based "no-secret-logging" tests for defense-in-depth.
- **Verbatim source-repo ports**: parser/state-machine code (CSV) ported untouched preserves edge-case correctness vs. re-deriving.

## Recurring Anti-Patterns
- **Pre-existing failures conflated with regressions**: 15/15 runs marked failure due to the same 6 proxy tests known to be broken on main and explicitly documented in `MEMORY.md`. The harness has no way to distinguish baseline-red from new-regression.
- **Repo-wide `turbo run test` as per-issue gate**: An ai-eval-only or migration-only issue gets failed by `@repo/web#test` even when its package suite is fully green.
- **`test_fix_retries: 0` across all 15 runs**: The fix loop never engaged because the failures were correctly diagnosed as out-of-scope, but the run still terminated as failure — wasted signal.
- **Per-package typecheck gaps**: `@repo/ai-eval` lacks its own `typecheck` script, so package-level tsconfig drift (missing `dom` lib) is invisible to repo-wide `pnpm typecheck`. Caught only by reviewer running `tsc --noEmit` manually.
- **Orphaned tests**: `scripts/__tests__/seed-pgsodium-key.test.ts` lives outside any workspace package — looks like coverage but never runs in CI.
- **Scope creep**: pgsodium env wiring, CI workflow edits, ops docs, and tier-config changes bundled into single-AC issues, blurring attribution and inflating blast radius.
- **Migration/code split shipping**: ai-eval modules referencing `chatflow_*` tables and `ai_eval_encrypt_*` RPCs landed before migrations — passes mocks, breaks at runtime.

## Recommendations
- **Scope test gates per package** in the alpha-loop runner: when an issue only touches `packages/ai-eval/`, run `turbo run test --filter=@repo/ai-eval` and skip `@repo/web` until a web-touching issue lands. This single change would have flipped 15 failures to 15 successes.
- **Auto-skip known-failing baselines**: read `MEMORY.md` entries like `proxy-auth-hub-bug.md` at run start and either skip those test files or compare new-vs-baseline failure sets — only fail on net-new regressions.
- **Add `typecheck` script to every workspace package** (`tsc --noEmit`) and require it in lint pipeline so package-level tsconfig drift fails the run before review.
- **Add migration-pair guard for code references**: lint check that grepping `from('chatflow_*')` or `.rpc('ai_eval_*')` in workspace code requires a matching migration file in `supabase/migrations/`.
- **Move or wire `scripts/__tests__/`** — either promote `scripts/` to a workspace package with its own vitest, or delete the orphaned test files. Add a lint rule rejecting `*.test.ts` files outside workspace packages.
- **Tighten issue scope in the planning prompt**: when an issue title is "migration X", refuse to bundle env-var registration, CI workflow edits, or ops docs unless explicitly part of AC. Surface scope expansion as a separate issue or explicit scope-change note.
- **Update implement prompt**: before declaring complete, diff failing tests against `MEMORY.md` known-baseline list; if 100% overlap, mark as "package-scoped success, baseline-failures upstream" rather than failure.

## Metrics
| Metric | Value |
|--------|-------|
| Issues processed | 15 |
| Success rate | 0% |
| Avg duration | 467s |
| Total duration | 117 min |
