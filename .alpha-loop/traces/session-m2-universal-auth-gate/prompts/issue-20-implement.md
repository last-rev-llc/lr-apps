Implement GitHub issue #20: Auth gate: Roblox Dances

## Summary
Add authentication gate to the Roblox Dances app so it requires login.

## Details
- Update `apps/web/app/apps/roblox-dances/layout.tsx` to call `requireAppLayoutAccess("roblox-dances")`
- Update app registry entry: set `auth: true`
- Add smoke tests for auth behavior

## Acceptance Criteria
- [ ] `layout.tsx` calls `requireAppLayoutAccess("roblox-dances")`
- [ ] App registry entry has `auth: true`
- [ ] Test: unauthenticated request redirects to `/login`
- [ ] Test: authenticated user without permission redirects to `/unauthorized`
- [ ] `pnpm test` passes


## Implementation Plan
1. apps/web/app/apps/roblox-dances/layout.tsx: Import requireAppLayoutAccess from '@/lib/require-app-layout-access'. Make RobloxDancesLayout async. Add 'await requireAppLayoutAccess("roblox-dances")' as first line of function body. 2. apps/web/lib/app-registry.ts: Change roblox-dances entry from auth:false to auth:true (line 75). 3. apps/web/app/apps/roblox-dances/__tests__/layout.test.tsx: Create test file following cringe-rizzler pattern — mock requireAppLayoutAccess, test it's called with 'roblox-dances', test NEXT_REDIRECT to /login for unauthenticated, test NEXT_REDIRECT to /unauthorized for unauthorized, test children render for authenticated user.


## Product Vision
Written to `docs/VISION.md` — 396 words covering current state, target state, strategy across the three focus areas, execution model, and guiding principles. Let me know if you'd like to adjust the tone, add anything, or trim further.



## Technical Context
Here's the project context file:

---

## Architecture
- **Entry point**: Next.js 16 App Router in `apps/web/`. Request interception via `apps/web/proxy.ts`. No `middleware.ts` — uses Next.js 16 proxy pattern instead.
- **Micro-apps**: 29+ apps live under `apps/web/app/apps/<slug>/`, each with its own `layout.tsx`. Auth hub is at `app/(auth)/`. No top-level API routes directory — apps handle their own API routes internally.
- **Database**: Supabase (Postgres). Client wrappers in `packages/db/src/` with separate exports: `server.ts`, `middleware.ts`, `service-role.ts`. Queries centralized in `packages/db/src/queries.ts`.
- **Auth**: Auth0 via `packages/auth/` — multi-tenant client factory (per-Host header). Permission checks in server layouts using `requireAppLayoutAccess()`.
- **Packages**: `packages/{auth,billing,db,ui,theme,config,test-utils}` — imported as `@repo/*` workspace aliases. UI has 80+ Radix+Tailwind components.

## Conventions
- TypeScript strict ESM. Server Components by default; `'use client'` only when needed. Tailwind 4 with oklch theme tokens from `packages/theme/`.
- Tests via Vitest (`pnpm test` / `turbo run test`). Test utils in `packages/test-utils/`.
- **Adding a new app**: Register in `apps/web/lib/app-registry.ts` (slug, subdomain, auth, tier, permissions), then create `apps/web/app/apps/<slug>/layout.tsx` with `requireAppLayoutAccess()` for gated apps. Use `publicRoutes` array for hybrid public/gated apps.
- Import from package sub-paths (`@repo/auth/server`, `@repo/db/middleware`) — never from `src/` directly.

## Critical Rules
- **`app-registry.ts` is source of truth** — app routing, access control, and subdomain mapping all derive from it. An unregistered app doesn't exist.
- **Supabase client separation is load-bearing** — `server.ts` for RSC/actions, `middleware.ts` for proxy, `service-role.ts` for admin only. Mixing breaks sessions.
- **Auth0 client must be per-request** (factory pattern via Host header) — never a global singleton.
- **`packages/theme/src/theme.css`** owns all design tokens via `@theme` directive — not tailwind.config files.
- **Never import server-only code into client bundles** — sub-path exports enforce this boundary.

## Active State
- **Test status**: _(pending — run `pnpm test`)_
- **Recent changes**: Billing metadata added to app registry (#11, #5 merged). Main branch has untracked `CLAUDE.md`, `docs/VISION.md`, `.alpha-loop/` files.



## Previous Issue in This Session
- Issue #19: Auth gate: Proper Wine Pour
- Status: success
- Tests: PASSING
- Files changed: 8
- Duration: 229s
- PR: https://github.com/last-rev-llc/lr-apps/pull/103

Build on what was already done. Avoid duplicating work.


## Learnings from Previous Runs

### Run #8 (success)
- All 148 tests passed across 8 packages with zero retries, including 7 new test files covering auth redirect logic and layout access control
- Code review caught two critical security/correctness bugs (open redirect via protocol-relative URLs, subdomain-to-slug mapping mismatch) that were fixed before merge
- Self-enroll env var (`APP_SELF_ENROLL_SLUGS`) documented in `.env.compose` with sensible dev fallback (all slugs allowed locally)
- Nothing — all tests passed on first run and review findings were addressed inline

### Run #7 (success)
- Auth gate pattern applied cleanly: layout calls `requireAppLayoutAccess("lighthouse")`, registry updated to `auth: true`, matching the established pattern from Area 52 (#6)
- All 4 acceptance criteria tests passed on first run with zero retries across the full monorepo (62 web tests, 114 total)
- Verification correctly skipped — server-side redirect logic is fully covered by unit tests with no UI to validate
- Nothing — all tests passed on first attempt
- Minor: branch carried unrelated Area 52 diff from issue #6 (already merged via PR #93), adding noise to the changeset

### Run #6 (success)
- Clean, minimal implementation: only 3 files changed (layout, registry, test) with no unnecessary modifications
- Test strategy correctly mocks `requireAppLayoutAccess` and covers all 4 acceptance criteria (auth call, unauthenticated redirect, unauthorized redirect, authenticated access)
- Followed existing codebase patterns — matches how other auth-gated apps are structured
- Nothing — all tests passed on first run with zero retries

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


## Known Anti-Patterns to Avoid
- **Duplicated subdomain-to-slug mapping**: `SUBDOMAIN_TO_SLUG` in `self-enroll.ts` duplicates data already in `app-registry.ts`, creating a sync risk. The review flagged this but it was left unfixed — should extract to a shared utility
- **Open redirect via protocol-relative URLs**: `isSafeReturnTo` only checked for leading `/` without rejecting `//`, which `new URL` resolves as a protocol-relative redirect to an external domain. Always reject `//` in return-to validation
- Avoid carrying forward diffs from prior issues on the same session branch — creates confusing review diffs even when functionally correct
- Don't skip creating a fresh branch per issue when working sequentially on related tasks
- None observed in this run
- Writing a test that claims to exercise a code branch (glob `/**` matching) but actually re-tests an already-covered exact match — tests should prove distinct behavior
- Skipping browser verification is acceptable for pure server-side auth changes, but should be explicitly justified in the plan rather than silently omitted
- None observed in this run
- Avoid committing unrelated files (`.env.compose`) in feature branches — keep PRs scoped to the issue
- Don't skip `renderWithProviders` tests even when the implementation seems straightforward — the diff shows the file was created but test coverage for it isn't visible in the test output
- Silently ignoring DB write errors (customers.ts upsert doesn't check error result) — can mask data loss in production
- Duplicating types across packages (`Subscription` in billing/types.ts vs `SubscriptionRow` in db/types.ts) creates drift risk — prefer re-exporting from a single source
- Building upsert payloads without including the primary/conflict key field — the original upsertSubscription omitted user_id, which would have caused NOT NULL violations on webhook-driven inserts
- The diff includes unrelated auth gate changes for other apps (age-of-apes, alpha-wins, area-52) bundled into the same branch — these should ideally be separate PRs per issue to keep changes atomic and reviewable
- The diff includes auth gate tests for multiple unrelated apps (age-of-apes, alpha-wins, area-52) that appear to be from prior issues bundled into this branch — mixing concerns across issues makes per-issue review harder
- **Batching unrelated UI polish into a feature ticket**: The login form, signup link, and unauthorized page copy changes go beyond the issue scope. These should be separate commits or tickets to keep blame/revert clean
- **Backfilling tests for prior issues in a new ticket's PR**: Adding age-of-apes/alpha-wins/area-52 tests here muddies the diff — those belong in their original PRs or a dedicated test-coverage ticket

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
3. Commit with: git commit -m "feat: Auth gate: Roblox Dances (closes #20)"