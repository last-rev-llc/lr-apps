Implement GitHub issue #5: Update auth middleware for universal gate

## Summary
Update `requireAppLayoutAccess()` to gate ALL apps by default, removing the `publicEntry` bypass. Add `publicRoutes` escape hatch for specific paths.

## Details
- Update `requireAppLayoutAccess()` to gate ALL apps by default (remove `publicEntry` bypass)
- Add `publicRoutes` escape hatch for specific paths (webhooks, marketing pages)
- Ensure redirect-after-login works for all 27 apps

## Acceptance Criteria
- [ ] `requireAppLayoutAccess()` calls `requireAccess()` for ALL apps regardless of `publicEntry` flag
- [ ] `publicEntry` bypass logic removed entirely
- [ ] `publicRoutes` escape hatch exists for webhook endpoints and marketing pages
- [ ] Redirect-after-login preserves the original app subdomain for all 27 apps
- [ ] Tests verify: standard apps gated, formerly-public apps gated, unknown slugs gated
- [ ] All existing tests continue to pass
- [ ] No regressions in proxy.ts routing


## Implementation Plan
1. app-registry.ts: (a) Remove `publicEntry` field from AppConfig interface and from ai-calculator config. (b) Add optional `publicRoutes?: string[]` field to AppConfig — array of path patterns relative to the app routeGroup (e.g. ["/", "/pricing", "/api/webhooks/**"]). (c) Add `publicRoutes` to ai-calculator config with ["/"] so its landing page stays public. (d) Export a helper `isPublicRoute(appSlug: string, pathname: string): boolean` that checks the incoming pathname against the app's publicRoutes globs.

2. require-app-layout-access.ts: (a) Remove the `if (cfg?.publicEntry) return;` bypass entirely. (b) Accept an optional second arg `pathname?: string`. (c) If pathname is provided and `isPublicRoute(appSlug, pathname)` returns true, return early (public escape hatch). (d) Otherwise always call `await requireAccess(appSlug)` — this is the universal gate.

3. Layout files (13 auth apps + ai-calculator): Each layout already calls `requireAppLayoutAccess('slug')`. No changes needed — they now all gate by default since publicEntry bypass is removed. The ai-calculator layout can optionally pass pathname if its root should remain public.

4. require-access.ts: Verify redirect uses `appSlug` in the redirect param (`/login?redirect=appSlug`). This already works — the Auth0 callback in auth0-factory.ts reads `ctx.returnTo` and redirects back, preserving the original app path. The subdomain is preserved because the rewrite in proxy.ts maps subdomain→routeGroup, so the browser stays on the original subdomain throughout the redirect flow. No changes needed here.

5. app-registry.test.ts: (a) Remove test for `publicEntry` on ai-calculator. (b) Add test that ai-calculator has `publicRoutes` containing '/'. (c) Add test for `isPublicRoute` helper — matching and non-matching paths.

6. require-app-layout-access.test.ts (NEW): (a) Mock `@repo/auth/server` requireAccess and `./app-registry` getAppBySlug/isPublicRoute. (b) Test: standard auth app (e.g. sentiment) always calls requireAccess. (c) Test: formerly-public-entry app (ai-calculator) with no pathname calls requireAccess. (d) Test: ai-calculator with pathname '/' skips requireAccess (public route). (e) Test: ai-calculator with pathname '/calculator' calls requireAccess. (f) Test: unknown slug still calls requireAccess. (g) Test: app with auth:false and no publicRoutes still calls requireAccess at layout level.


## Product Vision
Written to `docs/VISION.md` — 396 words covering current state, target state, strategy across the three focus areas, execution model, and guiding principles. Let me know if you'd like to adjust the tone, add anything, or trim further.



## Technical Context
Execution error



## Previous Issue in This Session
- Issue #4: Expand  with typed query helpers
- Status: success
- Tests: PASSING
- Files changed: 8
- Duration: 316s
- PR: https://github.com/last-rev-llc/lr-apps/pull/89

Build on what was already done. Avoid duplicating work.


## Learnings from Previous Runs

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
3. Commit with: git commit -m "feat: Update auth middleware for universal gate (closes #5)"