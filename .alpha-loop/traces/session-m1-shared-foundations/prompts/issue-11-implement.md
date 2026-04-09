Implement GitHub issue #11: Extend app registry with billing metadata

## Summary
Add `tier` and `features` fields to `AppConfig` in `apps/web/lib/app-registry.ts` to support future billing integration. Schema-only change — no runtime enforcement.

## Details
- Add `tier: "free" | "pro" | "enterprise"` to `AppConfig` interface
- Add `features: Record<string, "free" | "pro" | "enterprise">` field
- Update all 27+ registry entries with default `tier: "free"` and `features: {}`
- Update existing registry tests to validate new fields

## Acceptance Criteria
- [ ] `AppConfig` interface includes `tier` and `features` fields
- [ ] Every app entry in the registry has `tier: "free"` and `features: {}`
- [ ] Tests verify every app has a valid tier value
- [ ] Tests verify every app has a features object
- [ ] `pnpm typecheck` passes
- [ ] `pnpm test` passes


## Implementation Plan
1. In apps/web/lib/app-registry.ts, add to AppConfig interface: `tier: "free" | "pro" | "enterprise"` and `features: Record<string, "free" | "pro" | "enterprise">`. 2. Add `tier: "free", features: {}` to all 27 app entries in the apps array. 3. In apps/web/lib/__tests__/app-registry.test.ts, add two tests: (a) every app has a valid tier value (one of free/pro/enterprise), (b) every app has a features object (typeof === 'object').


## Product Vision
Written to `docs/VISION.md` — 396 words covering current state, target state, strategy across the three focus areas, execution model, and guiding principles. Let me know if you'd like to adjust the tone, add anything, or trim further.



## Technical Context
Execution error



## Previous Issue in This Session
- Issue #5: Update auth middleware for universal gate
- Status: success
- Tests: PASSING
- Files changed: 8
- Duration: 697s
- PR: https://github.com/last-rev-llc/lr-apps/pull/90

Build on what was already done. Avoid duplicating work.


## Learnings from Previous Runs

### Run #5 (success)
- Clean replacement of `publicEntry` boolean with `publicRoutes` string array pattern — more flexible and explicit
- Code review caught stale `publicEntry` references in my-apps page and architecture display before merge
- Comprehensive test coverage: 6 new `requireAppLayoutAccess` tests and 5 new `isPublicRoute` tests, all passing first try
- Nothing — zero test fix retries, all 52 web tests and 8 auth tests passed on first run

### Run #4 (success)
- Clean implementation of all three typed query helpers (`getAppPermission`, `getUserSubscription`, `upsertPermission`) with correct Supabase chaining patterns
- Thorough mock-based unit tests (11/11) covering happy path, null/missing data, error throwing, and correct table/filter assertions
- Proper package scaffolding: vitest config, test script, re-exports from index, and type additions all done in one pass with zero test retries
- Nothing — all tests passed on first run across all packages

### Run #3 (success)
- Clean first-pass implementation: all 15 test-utils tests and 64 total workspace tests passed without retries
- Proper monorepo test infrastructure: Vitest workspace config, Turbo `test` pipeline, and `--passWithNoTests` for packages without tests
- Well-structured mock helpers with chainable APIs (Supabase) and deep-merge overrides (Auth0)
- Nothing — all acceptance criteria met on first attempt
- Minor scope creep: `.env.compose` file was added but is unrelated to issue #3 (unfixed, flagged in review)

### Run #2 (success)
- Clean package scaffold with all acceptance criteria met on first pass — 17 tests across 4 test files, all passing
- Code review caught a critical bug (upsertSubscription missing user_id lookup) that was fixed before merge
- Infrastructure-only scope was respected — no app-level gating or UI changes leaked in
- Nothing — all tests passed without retries


## Known Anti-Patterns to Avoid
- Writing a test that claims to exercise a code branch (glob `/**` matching) but actually re-tests an already-covered exact match — tests should prove distinct behavior
- Skipping browser verification is acceptable for pure server-side auth changes, but should be explicitly justified in the plan rather than silently omitted
- None observed in this run
- Avoid committing unrelated files (`.env.compose`) in feature branches — keep PRs scoped to the issue
- Don't skip `renderWithProviders` tests even when the implementation seems straightforward — the diff shows the file was created but test coverage for it isn't visible in the test output
- Silently ignoring DB write errors (customers.ts upsert doesn't check error result) — can mask data loss in production
- Duplicating types across packages (`Subscription` in billing/types.ts vs `SubscriptionRow` in db/types.ts) creates drift risk — prefer re-exporting from a single source
- Building upsert payloads without including the primary/conflict key field — the original upsertSubscription omitted user_id, which would have caused NOT NULL violations on webhook-driven inserts

## Scope Rules (CRITICAL)
- ONLY modify files directly related to this issue
- If tests fail due to environment issues (missing venv, wrong port, missing deps), report it — do NOT rewrite test infrastructure
- Do NOT fix unrelated code, even if you notice problems
- Do NOT modify dev server config, build config, fonts, or styling unless the issue specifically requires it
- If the issue lists "Affected Files/Areas", stay within that scope

## Before You Start
1. Read the product vision and technical context above
2. Make decisions that align with the target users and current priority
3. Understand how your changes connect to existing code
4. If you're creating new files, make sure they're wired into the appropriate entry points

## After Implementing
1. Write tests for your changes
2. Run the test command to verify
3. Commit with: git commit -m "feat: Extend app registry with billing metadata (closes #11)"