Implement GitHub issue #28: Standup: component migration

## Summary
Replace inline cards and UI patterns in Standup app with `@repo/ui` shared components.

## Details
- Replace inline card patterns with `@repo/ui` Card
- Replace inline buttons, badges, inputs
- Ensure Slack/GitHub data aggregation UI uses shared components

## Acceptance Criteria
- [ ] All card patterns use `@repo/ui` Card component
- [ ] All buttons use `@repo/ui` Button
- [ ] Slack/GitHub data display uses shared components
- [ ] `pnpm build` passes


## Implementation Plan
1. standup-app.tsx — Replace inline SourceBadge with @repo/ui Badge: import Badge (already imported), apply 'outline' variant with custom className for source-specific colors via cn(). Remove the inline SourceBadge component.
2. standup-app.tsx — Replace inline filter pill <button> elements (lines 171-181) with @repo/ui Button: use variant='ghost' or 'outline' with size='sm' and conditional className for active/inactive state styling. Add rounded-full override via className.
3. standup-app.tsx — Replace inline empty state Card (lines 186-192) with @repo/ui EmptyState component: use icon='📋', title='No standup entries yet.' Props map directly.
4. layout.tsx — Replace inline back link with @repo/ui Button: use variant='link' or 'ghost' with size='sm' and asChild wrapping the Next.js Link.
5. Consolidate imports: ensure all @repo/ui imports use a single import statement. Remove unused Badge import if SourceBadge migration makes it used, or keep as-is.
6. Run `pnpm build` from repo root to verify no type or build errors.


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
- Issue #27: Accounts: app-specific tests
- Status: success
- Tests: PASSING
- Files changed: 3
- Duration: 882s
- PR: https://github.com/last-rev-llc/lr-apps/pull/119

Build on what was already done. Avoid duplicating work.


## Learnings from Previous Runs

### Run #27 (success)
- All 179 tests passed across 8 packages with zero retries needed
- Test coverage hit all acceptance criteria: client list rendering, PR aggregation, contact display, and auth gate behavior
- Leveraged existing `renderWithProviders` and `@repo/test-utils` infrastructure for consistent test patterns
- Nothing — all tests passed on first run

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
3. Commit with: git commit -m "feat: Standup: component migration (closes #28)"