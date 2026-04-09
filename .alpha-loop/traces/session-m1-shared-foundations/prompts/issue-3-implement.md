Implement GitHub issue #3: Add Vitest workspace config + shared test utilities

## Summary
Configure Vitest at monorepo root with workspace support and create `packages/test-utils` with mock helpers for Supabase, Auth0, and React rendering.

## Details
- Configure Vitest at monorepo root with workspace support
- Create `packages/test-utils` with helpers:
  - Mock Supabase client
  - Mock Auth0 session
  - `renderWithProviders()` wrapper
- Add `test` script to every package

## Acceptance Criteria
- [ ] `packages/test-utils/` exists with `package.json` and barrel exports
- [ ] `src/mock-supabase.ts` — chainable mock Supabase client with `createMockSupabase()`
- [ ] `src/mock-auth0.ts` — mock Auth0 session helper with `createMockAuth0()`
- [ ] `src/render-with-providers.tsx` — `renderWithProviders()` wrapper using `@testing-library/react`
- [ ] Every package in the workspace has a `test` script in `package.json`
- [ ] `pnpm test` from root runs all workspace tests via Turbo
- [ ] `@repo/test-utils` added as devDependency to packages that need it


## Implementation Plan
Step 1 — Create vitest.workspace.ts at monorepo root. Define workspace array pointing to ['apps/*', 'packages/*'] so each package uses its own vitest.config.ts (or defaults). No root-level vitest.config.ts needed since turbo orchestrates.

Step 2 — Create packages/test-utils/package.json. Name: @repo/test-utils, type: module. Exports: '.' -> ./src/index.ts. Dependencies: @supabase/supabase-js ^2, @auth0/nextjs-auth0 ^4, @testing-library/react, @testing-library/jest-dom, react, react-dom. DevDeps: @repo/config, typescript ^5, vitest ^3, @types/react ^19, @types/react-dom ^19, jsdom. Scripts: { test: 'vitest run' }. Add tsconfig.json extending @repo/config/tsconfig/base.

Step 3 — Create src/mock-supabase.ts. Export createMockSupabase() that returns a chainable mock SupabaseClient using vi.fn(). Mock .from() returning an object with .select(), .insert(), .update(), .delete(), .eq(), .single(), .maybeSingle() — each returning the chain plus a terminal data/error promise via mockResolvedValue. Use the Database type from @repo/db/types for type safety.

Step 4 — Create src/mock-auth0.ts. Export createMockAuth0() that returns a mock Auth0 session object matching the shape returned by auth0.getSession(): { user: { sub, email, name, picture, email_verified, org_id }, accessToken, ... }. Accept partial overrides. Also export createMockAuth0Client() that returns a mock object with getSession/getAccessToken/handleAuth vi.fn() stubs.

Step 5 — Create src/render-with-providers.tsx. Export renderWithProviders(ui, options?) that wraps the component in any shared providers (React context providers used across the app). Use @testing-library/react render() under the hood. For now, the wrapper is a simple fragment since the monorepo doesn't have a global provider tree yet — but the function signature is in place for future providers.

Step 6 — Create src/index.ts barrel file re-exporting everything from mock-supabase, mock-auth0, and render-with-providers.

Step 7 — Add basic self-tests: src/__tests__/mock-supabase.test.ts (verify chainable API works, data resolves), src/__tests__/mock-auth0.test.ts (verify session shape, overrides).

Step 8 — Add 'test': 'vitest run' script to packages missing it: packages/db/package.json, packages/ui/package.json. Add vitest ^3 as devDependency to both. Skip packages/theme (CSS-only, nothing to test) and packages/config (config-only) — add a 'test': 'echo no tests' placeholder script so turbo doesn't error.

Step 9 — Add @repo/test-utils as devDependency (workspace:*) to packages that will use it: apps/web, packages/auth, packages/db, packages/ui.

Step 10 — Verify: run 'pnpm install' then 'pnpm test' from root. All workspace packages should be discovered and tests should pass.


## Product Vision
Written to `docs/VISION.md` — 396 words covering current state, target state, strategy across the three focus areas, execution model, and guiding principles. Let me know if you'd like to adjust the tone, add anything, or trim further.



## Technical Context
Execution error



## Previous Issue in This Session
- Issue #2: Create  package
- Status: success
- Tests: PASSING
- Files changed: 10
- Duration: 616s
- PR: https://github.com/last-rev-llc/lr-apps/pull/87

Build on what was already done. Avoid duplicating work.


## Learnings from Previous Runs

### Run #2 (success)
- Clean package scaffold with all acceptance criteria met on first pass — 17 tests across 4 test files, all passing
- Code review caught a critical bug (upsertSubscription missing user_id lookup) that was fixed before merge
- Infrastructure-only scope was respected — no app-level gating or UI changes leaked in
- Nothing — all tests passed without retries


## Known Anti-Patterns to Avoid
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
3. Commit with: git commit -m "feat: Add Vitest workspace config + shared test utilities (closes #3)"