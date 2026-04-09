Implement GitHub issue #48: Daily Updates: component migration

## Summary
Replace inline UI in Daily Updates with `@repo/ui` shared components.

## Acceptance Criteria
- [ ] Feed cards use `@repo/ui` Card
- [ ] Profile badges use `@repo/ui` Badge/Avatar
- [ ] Category filters use shared components
- [ ] All buttons use `@repo/ui` Button
- [ ] `pnpm build` passes


## Implementation Plan
1. feed-app.tsx — UpdateCard component:
   a. Already imports Card; add CardHeader, CardContent, CardFooter wrapping the header/body/reactions sections.
   b. Replace the inline profile icon div (lines 99-104) with Avatar + AvatarFallback (emoji icon), styled with neon background via style prop.
   c. Replace the category span (line 119-121) with Badge variant="secondary".
   d. Replace the priority emoji span (lines 113-117) with Badge variant="destructive" containing the fire emoji.
   e. Replace link anchor pills (lines 140-154) with Button variant="outline" size="sm" wrapped in asChild with <a>.
   f. Replace reaction buttons (lines 164-175) with Button variant="ghost" size="sm" with conditional className for active state.

2. feed-app.tsx — Filter controls:
   a. Replace the search <input> (lines 286-294) with Input from @repo/ui.
   b. Replace time range buttons (lines 336-353) with Tabs/TabsList/TabsTrigger for the all/day/week/month toggle.
   c. Replace the load-more button (lines 370-376) with Button variant="outline".

3. feed-app.tsx — Empty state:
   a. Replace the inline empty-state div (lines 358-361) with EmptyState component (icon, title props).

4. about/page.tsx:
   a. Replace feature card divs (lines 51-58) with Card + CardHeader + CardContent.
   b. Replace character card divs (lines 85-96) with Card + CardContent.
   c. Replace the CTA anchor (lines 101-106) with Button asChild wrapping the <a>.

5. Update imports in both files to pull Card, CardHeader, CardContent, CardFooter, Badge, Avatar, AvatarFallback, Button, Input, EmptyState, Tabs, TabsList, TabsTrigger from @repo/ui.

6. Run pnpm build to verify no regressions.


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
- Issue #47: Cringe Rizzler: app-specific tests
- Status: success
- Tests: PASSING
- Files changed: 3
- Duration: 424s
- PR: https://github.com/last-rev-llc/lr-apps/pull/136

Build on what was already done. Avoid duplicating work.


## Learnings from Previous Runs

### Run #47 (success)
- Clean first-pass execution with zero test fix retries across 6 new test files (47 tests)
- Existing test patterns (renderWithProviders, vi.mock for @repo/ui) reused consistently from prior app test runs (Slang Translator, Generations)
- About page required production code changes (migrating to @repo/ui Card/Button components) to make it testable — agent handled this as part of test work without scope creep
- Nothing — all 206 tests passed on first run

### Run #46 (success)
- Clean migration of buttons and cards to `@repo/ui` (`Button`, `Card`, `CardContent`) with zero test failures
- Consistent replacement of hardcoded `text-white/*` opacity tokens with semantic `text-foreground` / `text-muted-foreground` tokens
- Code review caught remaining hardcoded tokens (VibeBar label, saved items card, glossary cards) and they were fixed before merge
- Nothing — all tests passed on first run, build succeeded, and review findings were addressed

### Run #45 (success)
- Clean first-pass execution with zero test retries — all 153 tests passed across 16 test files
- Followed established testing patterns from prior issues (mock Supabase, mock @repo/ui, renderWithProviders) for consistency
- Component refactors (replacing raw `<button>` with `<Badge>` and `<Button>` from @repo/ui) improved testability and design consistency
- Nothing — all acceptance criteria met on first attempt

### Run #44 (success)
- Clean first-pass completion with zero test retries — agent correctly migrated inline UI to `@repo/ui` shared components (Button, Badge, Card)
- Bonus work: added comprehensive test suites for dad-joke-of-the-day (joke-viewer + queries) alongside the slang translator migration
- All 116 web tests passed, full turbo cache hit across 8 packages
- Nothing — build and tests passed on first attempt

### Run #43 (success)
- Clean first-pass execution with zero test fix retries across 43 new tests in 6 files
- Consistent use of shared test utilities (`createMockSupabase`, `renderWithProviders`) from `@repo/test-utils`
- Production code was minimally adjusted (joke-viewer.tsx category filters and rating buttons) to use proper UI components, making tests more idiomatic
- Nothing — all 116 tests passed on first run with full turbo cache


## Known Anti-Patterns to Avoid
- None observed in this run
- Don't migrate form elements (inputs, selects) to `@repo/ui` when no matching component exists in the shared library — leave inline styles rather than forcing a partial abstraction
- **Avoid testing against raw HTML when @repo/ui exists**: The dad-joke-of-the-day component used raw `<button>` elements for ratings and styled `<button>` for category filters instead of @repo/ui primitives — this was caught and fixed during test work but should be caught during initial implementation
- Diff includes unrelated test files (dad-joke-of-the-day tests) that aren't part of issue #44's scope — component migration issues should stay focused on the target app only
- Playwright verification was skipped due to missing CLI — E2E coverage gap on visual regressions from component swaps
- **Avoid testing against raw HTML elements in production code**: The joke-viewer had raw `<button>` elements for category filters and ratings instead of using the shared UI library, making test queries brittle and inconsistent with other components
- Using `dangerouslySetInnerHTML` with user input (slang translations) without HTML escaping — always sanitize or use text content instead
- Scoping migration too narrowly to "swap components" without auditing security of surrounding code
- Avoid testing against raw styled `<button>` elements with class-based selectors; prefer semantic components with `title`/`role` attributes for stable queries
- Replacing `<button>` with a component that renders a `<div>` without checking — silently breaks keyboard/screen-reader accessibility with no test failure to catch it.
- Unused imports left behind: `createMockSupabase` was imported but never used in page.test.tsx — linting should catch this
- React `act(...)` warnings in accounts-app tests (from prior issue) still present in stderr — tab click helpers should wrap state updates in `act()` to suppress warnings
- Not wrapping tab-switching `fireEvent` calls in `act()` produces noisy warnings — future tab interaction tests should use `await act(async () => { ... })` or `userEvent` which handles act internally
- Adding tests for a sibling app (Accounts) in a PR scoped to a different app (Uptime) — keeps the diff clean but muddies the issue scope

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
3. Commit with: git commit -m "feat: Daily Updates: component migration (closes #48)"