Implement GitHub issue #52: HSPT Practice: component migration

## Summary
Replace inline UI in HSPT Practice with `@repo/ui` shared components.

## Acceptance Criteria
- [ ] Question cards use `@repo/ui` Card
- [ ] Timer display uses shared components
- [ ] Score display uses shared components
- [ ] Section selection uses `@repo/ui` Button/Tabs
- [ ] `pnpm build` passes


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
- Issue #51: Proper Wine Pour: app-specific tests
- Status: failure
- Tests: FAILING
- Files changed: 0
- Duration: 25s


Build on what was already done. Avoid duplicating work.


## Learnings from Previous Runs

### Run #48 (success)
- Clean migration of feed cards, avatars, badges, buttons, input, and empty state to `@repo/ui` shared components with zero test failures
- Time range filter successfully migrated from custom buttons to `@repo/ui` Tabs/TabsTrigger pattern
- All 206 tests passed on first run with full turbo cache hits across 8 packages
- Nothing — all tests passed without retries and build succeeded

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


## Known Anti-Patterns to Avoid
- React `act(...)` warnings in cringe-rizzler tests indicate async state updates aren't properly wrapped — these pass but should be cleaned up before they mask real issues
- Adding layout and about page tests for cringe-rizzler as part of issue #48 (Daily Updates migration) suggests scope creep from a prior issue leaking into this one
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
- The `act(...)` warnings from accounts tests are accumulating in stderr output — these should be addressed to keep test output clean, though they don't block CI

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
3. Commit with: git commit -m "feat: HSPT Practice: component migration (closes #52)"