Implement GitHub issue #4: Expand  with typed query helpers

## Summary
Add typed query helpers to `@repo/db` to replace raw `.from().select().eq()` chains across the codebase.

## Details
- `getAppPermission(userId, slug)` — replaces raw `.from("app_permissions").select()` chains
- `getUserSubscription(userId)` — for billing package consumption
- `upsertPermission()` — for self-enroll and admin flows
- Typed return types for all helpers

## Acceptance Criteria
- [ ] `packages/db/src/queries.ts` exists with typed query helpers
- [ ] `getAppPermission(userId, slug)` returns `Permission | null`
- [ ] `getUserSubscription(userId)` returns `SubscriptionRow | null`
- [ ] `upsertPermission(userId, appSlug, permission)` returns `AppPermission`
- [ ] `SubscriptionRow` type added to `packages/db/src/types.ts`
- [ ] `Database` interface updated with `subscriptions` table
- [ ] Tests in `packages/db/src/__tests__/queries.test.ts` cover all helpers
- [ ] Queries re-exported from `packages/db/src/index.ts`
- [ ] `vitest.config.ts` and `test` script added to `packages/db/package.json`


## Implementation Plan
1. Update packages/db/src/types.ts: Add SubscriptionRow type (id, user_id, stripe_customer_id, stripe_subscription_id, status, plan, current_period_start, current_period_end, created_at, updated_at). Add subscriptions table to Database interface with Row/Insert/Update variants matching existing app_permissions pattern.
2. Create packages/db/src/queries.ts with three typed helpers: (a) getAppPermission(client, userId, slug) — queries app_permissions with .eq('user_id').eq('app_slug').maybeSingle(), returns Permission | null by extracting the permission field; (b) getUserSubscription(client, userId) — queries subscriptions with .eq('user_id').maybeSingle(), returns SubscriptionRow | null; (c) upsertPermission(client, userId, appSlug, permission) — uses .upsert() with onConflict on user_id+app_slug, returns AppPermission. All helpers accept a SupabaseClient<Database> as first argument so they work with both server and service-role clients.
3. Update packages/db/src/index.ts: Re-export all three query helpers and the new SubscriptionRow type.
4. Add vitest to packages/db: Create packages/db/vitest.config.ts (copy pattern from apps/web). Add vitest@^3 as devDependency and 'test': 'vitest run' script to packages/db/package.json.
5. Create packages/db/src/__tests__/queries.test.ts: Mock @supabase/supabase-js client with chained .from().select().eq().maybeSingle() and .upsert() methods. Test getAppPermission returns Permission | null, getUserSubscription returns SubscriptionRow | null, upsertPermission returns AppPermission. Test error/null cases.


## Product Vision
Written to `docs/VISION.md` — 396 words covering current state, target state, strategy across the three focus areas, execution model, and guiding principles. Let me know if you'd like to adjust the tone, add anything, or trim further.



## Technical Context
Execution error



## Previous Issue in This Session
- Issue #3: Add Vitest workspace config + shared test utilities
- Status: success
- Tests: PASSING
- Files changed: 10
- Duration: 647s
- PR: https://github.com/last-rev-llc/lr-apps/pull/88

Build on what was already done. Avoid duplicating work.


## Learnings from Previous Runs

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
3. Commit with: git commit -m "feat: Expand  with typed query helpers (closes #4)"