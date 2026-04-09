Implement GitHub issue #32: Meeting Summaries: component migration

## Summary
Replace inline UI patterns in Meeting Summaries app with `@repo/ui` shared components.

## Acceptance Criteria
- [ ] Meeting list uses shared Table/Card components
- [ ] Meeting detail view uses shared components
- [ ] All buttons, badges, inputs use `@repo/ui`
- [ ] `pnpm build` passes


## Implementation Plan
1. **page.tsx** — Replace inline stats grid with `StatCard` from @repo/ui (size='sm'). Replace inline `<h2>/<p>` header block with `PageHeader` component (title='Meeting Summaries', subtitle='Never lose track...').
2. **layout.tsx** — Replace inline `<header>` with `PageHeader` component for consistency with other apps.
3. **meetings-app.tsx — imports** — Add imports: `Badge, Button, EmptyState, Search, PillList` from @repo/ui. Remove `Card` from existing import (already imported, keep it).
4. **meetings-app.tsx — SentimentBadge** — Replace inline `<span>` with `<Badge variant='outline' className={SENTIMENT_STYLES[sentiment]}>`. Keep SENTIMENT_STYLES map for color classes.
5. **meetings-app.tsx — SummaryCard header badges** — Replace inline badge `<span>`s for client_id, duration, and 'pending' status with `<Badge variant='outline' className=...>` using appropriate color classes.
6. **meetings-app.tsx — SummaryCard topics** — Replace inline topic `<span>`s with `<Badge variant='outline'>` with purple color classes.
7. **meetings-app.tsx — ActionItemCard badges** — Replace inline owner, priority, and client_id `<span>`s with `<Badge variant='outline'>`. Keep PRIORITY_STYLES map for colors.
8. **meetings-app.tsx — ActionItemCard buttons** — Replace inline `<button>` elements ('Generate Follow-up', 'Done') with `<Button variant='outline' size='sm'>` from @repo/ui.
9. **meetings-app.tsx — Search inputs** — Replace both inline `<input>` elements (search meetings, search action items) with `<Search>` component (value, onChange, placeholder, debounce=0 for instant filtering).
10. **meetings-app.tsx — Filter pill groups** — Replace all three inline filter button groups (date range, status, priority) with `<PillList>` component using items/selected/onSelect props and size='sm'.
11. **meetings-app.tsx — Empty states** — Replace both inline empty-state divs (no meetings, no action items) with `<EmptyState icon='...' title='...'>`.
12. **Verify** — Run `pnpm build` to confirm no type errors or broken imports.


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
- Issue #31: Summaries: app-specific tests
- Status: success
- Tests: PASSING
- Files changed: 3
- Duration: 704s
- PR: https://github.com/last-rev-llc/lr-apps/pull/126

Build on what was already done. Avoid duplicating work.


## Learnings from Previous Runs

### Run #41 (success)
- Tests passed on first run with zero retries, indicating solid mock patterns and test setup
- Reused shared `createMockSupabase` and `renderWithProviders` from `@repo/test-utils` for consistent test infrastructure
- Component was refactored (raw buttons → Badge/Button components) to improve testability alongside writing tests
- Nothing

### Run #40 (success)
- Clean single-file migration: all inline UI (Badge, Button) replaced with `@repo/ui` shared components in `joke-viewer.tsx` only, correctly identifying that `page.tsx` had no inline UI to migrate.
- A11y regression caught and fixed during review: interactive Badge elements wrapped in `<button>` to preserve keyboard navigation and screen reader support that raw `<div>`-based Badge would lose.
- Zero test fix retries — build and all 54 web tests passed on first run.
- Nothing — all acceptance criteria met, tests passed, no retries needed.

### Run #31 (success)
- All 6 acceptance criteria met on first attempt with zero test fix retries
- Consistent test patterns reused from prior app test runs (accounts, standup) — mock data, layout auth gate, page rendering, component interaction tests
- Turbo cache hits on all 8 packages kept total test time to 91ms
- Nothing — all 140 tests passed across 17 test files

### Run #30 (success)
- Clean migration of inline UI (Pill, cards, badges, inputs, empty states, page header) to `@repo/ui` shared components with build passing
- Zero test fix retries — agent got it right on the first pass
- No app-specific tests were written for the summaries app, unlike peer migrations (standup, accounts) that included test suites
- Three native `<select>` elements left with inline styling because `@repo/ui` lacks a Select component — migration gap not flagged upfront

### Run #29 (success)
- Clean first-pass success with zero test fix retries — all 121 web tests passed immediately
- Consistent test structure across apps (standup follows same layout/page/app-component pattern as accounts and command-center)
- Good use of shared `@repo/test-utils` (`renderWithProviders`, `mockSupabaseCall`) kept test boilerplate minimal
- Nothing — all acceptance criteria met on first attempt


## Known Anti-Patterns to Avoid
- Avoid testing against raw styled `<button>` elements with class-based selectors; prefer semantic components with `title`/`role` attributes for stable queries
- Replacing `<button>` with a component that renders a `<div>` without checking — silently breaks keyboard/screen-reader accessibility with no test failure to catch it.
- `act(...)` warnings in accounts-app tests (stderr noise from tab state updates not wrapped in act) — tests pass but warnings indicate potential flakiness; future runs should wrap tab interactions in `act()` or use `userEvent` instead of `fireEvent`
- Skipping tests for the target app while the issue's own acceptance criteria don't explicitly require them — agents should default to adding tests for migrated components
- Not surfacing the missing Select component gap as a follow-up issue during the run
- **`act(...)` warnings in accounts tests**: the Accounts tab-switching tests produce React `act()` warnings in stderr — not blocking but indicates state updates outside the test lifecycle that could cause flaky failures later
- **Diff included unrelated accounts test files**: the code changes bundle accounts tests alongside standup tests, suggesting the worktree carried over uncommitted work from issue #27
- The `act(...)` warnings should be addressed to prevent future test fragility — wrapping tab clicks in `act()` or using `userEvent` instead of `fireEvent` would eliminate these
- Diff provided includes unrelated Accounts test files (not Standup) — suggests the agent may have carried over or re-committed work from issue #27
- Using `fireEvent.keyDown` for tab switching instead of `userEvent.setup().click()` causes noisy `act()` warnings in stderr
- `as unknown as Client` casts in data parsing skip runtime validation — prefer zod or a guard function at system boundaries
- Silently returning empty arrays on query failure (`getClients`) hides real errors from users and tests alike
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
3. Commit with: git commit -m "feat: Meeting Summaries: component migration (closes #32)"