Implement GitHub issue #27: Accounts: app-specific tests

## Summary
Add test coverage for Accounts app — client list, PR aggregation, contact display.

## Details
- Test client list rendering with mock data
- Test PR aggregation display
- Test contact display and filtering
- Test auth gate behavior

## Acceptance Criteria
- [ ] Test: client list renders with mock Supabase data
- [ ] Test: PR aggregation displays correctly
- [ ] Test: contact display shows expected fields
- [ ] Test: auth gate redirects work
- [ ] `pnpm test` passes


## Implementation Plan
1. Create `accounts/__tests__/layout.test.tsx`: Mock `requireAppLayoutAccess`, verify it's called with 'accounts', verify children render when authed, verify layout header shows 'Accounts' title, verify auth error propagation on rejection. Follow command-center layout test pattern exactly.
2. Create `accounts/__tests__/page.test.tsx`: Mock `./lib/queries` to return mock client array via `getClients` and `computeOverviewStats`. Verify PageHeader renders 'Accounts'. Verify 4 StatCard labels render (Clients, Open PRs, Contacts, Jira Tickets). Verify AccountsApp receives clients prop. Need IntersectionObserver mock for StatCard count-up.
3. Create `accounts/__tests__/accounts-app.test.tsx`: Import AccountsApp directly with 2-3 mock Client objects. Test: (a) client selector dropdown renders all client names as options, (b) selecting a client updates the dashboard, (c) health badge renders for selected client, (d) empty state shows when clients array is empty. Test contacts tab: render ContactsTab content — verify contact names, roles, emails, isPrimary badge ('Primary' text), LinkedIn links. Test PR/repos tab: verify open PR count displays, PR list renders with #number and title, repo links render, 'Needs attention' badge when prCount > 10. Use `userEvent` for dropdown/tab interactions.
4. Create `accounts/lib/__tests__/queries.test.ts`: Unit test `computeOverviewStats` — verify totals for clients count, PRs, contacts, jira tickets with mock data. Test edge cases: empty array, clients with missing optional fields.


## Product Vision
Written to `docs/VISION.md` — 396 words covering current state, target state, strategy across the three focus areas, execution model, and guiding principles. Let me know if you'd like to adjust the tone, add anything, or trim further.



## Technical Context
Here's the project context:

---

## Architecture
- **Turborepo + pnpm monorepo** with one Next.js 16 app (`apps/web/`) and 7 shared packages (`auth`, `billing`, `config`, `db`, `test-utils`, `theme`, `ui`)
- **Multi-tenant via subdomain routing**: `proxy.ts` resolves `<app>.alphaclaw.app` subdomains → rewrites to `apps/web/app/apps/<app-name>/` routes. 27 mini-apps live under that directory (accounts, command-center, standup, etc.)
- **Database**: Supabase (Postgres). Schema in `supabase/migrations/`. Query layer in `packages/db/src/` — separate `client.ts` (browser), `server.ts` (RSC), `service-role.ts` (admin) exports
- **Auth**: Auth0 via `@auth0/nextjs-auth0` v4, multi-host aware (`packages/auth/auth0-factory`). Auth routes handled in `proxy.ts` and `app/(auth)/` route group
- **Billing**: Stripe v17 via `packages/billing/`. Tier-gated features derive from app-registry metadata

## Conventions
- **TypeScript + React 19 + Tailwind v4 + Next.js App Router** with Turbopack dev. ESLint 9 flat config via `@repo/config`
- **Workspace imports**: `@repo/ui`, `@repo/db`, `@repo/auth`, `@repo/theme`, `@repo/billing`, `@repo/config`, `@repo/test-utils`
- **Tests**: Vitest with workspace-level config (`vitest.workspace.ts`). Each package/app has own `vitest.config.ts`. Run via `turbo run test`
- **Adding a new app**: Create route directory under `apps/web/app/apps/<name>/`, register in app-registry (billing tiers + features), proxy routing picks it up via subdomain resolution
- **Design system**: `packages/theme/` for tokens, `packages/ui/` (~47 components). Marketing site style-kit is the default design baseline

## Critical Rules
- **Billing via `@repo/billing`** is non-negotiable for tier-gated features — never bypass it
- **`proxy.ts`** is the routing backbone — breaking it breaks all 27 apps. Updates must preserve subdomain→route mapping and Auth0 middleware merge
- **Supabase client separation**: Never use `service-role.ts` in client code; `server.ts` for RSC, `client.ts` for browser
- **App-registry** must stay in sync with proxy routing, billing tiers, and the apps directory — these three break if updated independently
- **Theme tokens**: Use `@repo/theme` tokens, not hardcoded values. Token audit scripts exist (`scripts/audit-tokens.ts`)

## Active State
- **Test status**: _(to be filled by loop)_
- **Recent changes**: Token audit branch active — standardized glass/shadow/animation usage, replaced hardcoded tokens in batch 1, audited and documented token violations (PRs #107, #108, #110)



## Previous Issue in This Session
- Issue #26: Accounts: component migration
- Status: success
- Tests: PASSING
- Files changed: 1
- Duration: 581s
- PR: https://github.com/last-rev-llc/lr-apps/pull/118

Build on what was already done. Avoid duplicating work.


## Learnings from Previous Runs

### Run #26 (success)
- Clean migration of inline Badge, SectionCard, Empty, and Row components to `@repo/ui` equivalents (StatusBadge, Card/CardHeader/CardContent, EmptyState, Button)
- Color mapping approach (`STATUS_VARIANT_MAP` + `BADGE_CLASS_OVERRIDES`) preserved custom badge colors while using shared StatusBadge component
- All 163 tests passed across 8 packages with zero retries; 7/8 packages were cache hits, keeping the run fast
- Nothing — build and all tests passed on first attempt

### Run #25 (success)
- Clean first-pass success: all 15 new tests (8 layout, 7 page) passed without retries
- Effective mocking strategy: `IntersectionObserver` mock for StatCard count-up animation, `next/link` mock for href assertions, and `requireAppLayoutAccess` mock for auth gate testing
- Good use of `@repo/test-utils` `renderWithProviders` in all new app-level tests as required by acceptance criteria
- Nothing — all tests passed on first run, all acceptance criteria met

### Run #24 (success)
- Systematic migration of inline buttons, badges, and stat cards to `@repo/ui` equivalents (`Button`, `Badge`, `StatCard`) across hub page and module chrome
- Five new shared components (`DataGrid`, `Table`, `StatusBadge`, `LoadingSkeleton`, `ErrorBoundary`) were created with full test coverage (31 tests passing)
- Zero test failures — all 8 packages passed on first run with full turbo cache hits
- New `@repo/ui` components were built and tested but never actually used in the command-center app files — they are dead code from this migration's perspective
- Several sub-module files (`meetings-app.tsx`, `shopping-list-app.tsx`, `error.tsx`, `pr-app.tsx`) still contain raw `<input>`, `<button>`, and local `StatusBadge` patterns that should have been migrated


## Known Anti-Patterns to Avoid
- **Missing shared primitives**: The raw `<select>` element was left because `@repo/ui` lacks a Select component. Future migrations should audit which shared components are needed _before_ starting, and add them to `@repo/ui` first to avoid leaving gaps.
- **Unused shared components**: DataGrid, ErrorBoundary, and LoadingSkeleton were added to `@repo/ui` during this run but not consumed by the accounts app. Adding components speculatively increases the shared package surface without immediate validation through usage.
- **Direct `@testing-library/react` imports in shared packages**: The 6 UI tests bypass `@repo/test-utils`, creating inconsistency. Acceptable for leaf components but should be documented as a conscious choice, not a default
- **Asserting specific Tailwind classes** (e.g., `bg-white/15`, `w-14`): Couples tests to styling implementation. Prefer role/aria queries or data-testid for structural assertions
- **Missing `console.error` spy cleanup**: Error boundary test spies on `console.error` without `afterEach` restore. Vitest file isolation masks this, but it's a bad habit for test suites that grow
- Building shared components speculatively without wiring them into the actual migration target — creates dead code and inflates the diff without delivering value
- Scoping migration to "hub page and chrome" but leaving obvious inline patterns in sibling files that were clearly in scope (e.g., raw inputs in meetings-app when agents-app was migrated)

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
3. Commit with: git commit -m "feat: Accounts: app-specific tests (closes #27)"