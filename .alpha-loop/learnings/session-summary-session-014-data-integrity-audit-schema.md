# Session Summary: session/014-data-integrity-audit-schema

## Overview
All 5 issues completed successfully on first test run with zero retries, but review caught the same two systemic CI gaps across every issue: RLS test seeds missing `auth.users` rows (silent FK failures) and `lint:registry` silently skipping in CI without Supabase. Both were fixed in-run each time, but the pattern points to a prompt-level blind spot rather than five independent mistakes.

## Recurring Patterns
- **Seed `auth.users` before FK-dependent inserts** using idempotent `admin.auth.admin.createUser({ id, email, email_confirm: true })`, and surface upsert errors via `throwOnError()` so zero rows from failed seeds don't masquerade as RLS denials.
- **Wire service-dependent CI checks into jobs that provision the service** — e.g., `lint:registry` belongs in `rls-tests` (which runs `supabase db reset`), not the generic `lint` job.
- **Gate environment-dependent tests with `describe.skipIf(!process.env.X)`** and expose them via dedicated scripts (`test:rls`) so default `pnpm test` stays hermetic.
- **Extending nullable helpers like `requireAppLayoutAccess`**: narrow at call sites with `if (!access) return ...` rather than `access!` assertions.

## Recurring Anti-Patterns
- **Silent-skip CI guards**: scripts that `exit 0` when prerequisites are missing create false-confidence checks. Every issue re-introduced this via `lint:registry`.
- **Seeding FK-dependent rows without surfacing errors** — tests pass because nothing inserted, not because RLS denied.
- **Misleading test names**: `billing-flows.test.ts` kept a test called "end-to-end DB row write" that still mocks the service-role client.
- **Non-null assertions (`access!.user.id`)** on a helper whose null contract depends on caller arguments — fine today, footgun if `publicRoutes` is later adopted.
- **Scope creep (issue 214)**: shipped CI/refactor work while none of the stated DB index ACs (`idx_app_permissions_app_slug`, EXPLAIN ANALYZE migration, paired `.down.sql`) landed.

## Recommendations
- **Update the implement prompt** to include an RLS-test checklist: "If seeding tables with FKs to `auth.users`, create users via `admin.auth.admin.createUser` first and use `.throwOnError()` on all seed upserts."
- **Update the implement prompt** with a CI-wiring rule: "Before adding a script to `pnpm lint` or `pnpm test`, verify the CI job that runs it provisions every service the script depends on. If not, move the check to a job that does, or fail loudly on missing prerequisites."
- **Update the review prompt / `code-review` skill** to grep for silent-skip patterns: `if (!process.env.X) { ... process.exit(0) }` in scripts invoked by lint/test, and flag tests named "end-to-end"/"integration" that import from `vi.mock` / `jest.mock`.
- **Update the plan prompt** to explicitly restate acceptance criteria and cross-check the diff against them before declaring success — issue 214 shipped entirely unrelated work with a green review.
- **Add a lint rule or review-prompt check** against `access!.user.id` patterns in layout files under `app/apps/*/layout.tsx`, since this idiom was re-introduced in 3 layouts.
- **Refactor the billing-flows "end-to-end" test** in a follow-up: either rename to reflect its mocked nature or move real DB coverage into the `rls-tests` job.

## Metrics
| Metric | Value |
|--------|-------|
| Issues processed | 5 |
| Success rate | 100% |
| Avg duration | 342s |
| Total duration | 29 min |
