Implement GitHub issue #36: Sentiment: component migration

## Summary
Replace remaining inline UI patterns in Sentiment app with `@repo/ui` shared components.

## Details
- Replace inline cards, stat displays, mood badges with shared components
- Ensure chart components use theme tokens
- Migrate changelog and docs pages to shared patterns

## Acceptance Criteria
- [ ] Stat cards use `@repo/ui` Card component
- [ ] Mood badges use shared Badge/StatusBadge
- [ ] Member grid uses shared Card
- [ ] Timeline uses shared components
- [ ] `pnpm build` passes


## Implementation Plan
Step 1 — stats-row.tsx: Replace inline Card+CardContent stat display with StatCard from @repo/ui. Map each stat object to <StatCard value={stat.value} label={stat.label} size="sm" />. Remove Card/CardContent imports.

Step 2 — mood-badge.tsx: Replace custom inline badge with StatusBadge from @repo/ui. Map mood strings to StatusBadge variants: positive→success, excited→info, neutral→neutral, frustrated→warning, blocked→error. Add dot prop for visual indicator. Keep capitalize class on children.

Step 3 — member-grid.tsx: Already uses Card/CardHeader/CardTitle/CardContent correctly. Update MoodBadge import (will use new StatusBadge-based version from step 2). No other changes needed.

Step 4 — timeline.tsx: Already uses Card/CardContent from @repo/ui. Update MoodBadge import (will use new StatusBadge-based version from step 2). The data-driven grouped timeline is domain-specific and should NOT be replaced with the @repo/ui Timeline (which is for sequential event lists). No structural changes needed.

Step 5 — about/page.tsx: Replace inline glass-sm feature grid with FeatureList from @repo/ui. Import { FeatureList } and pass features array with title/description. Set columns={2}. Add PageHeader for the hero section.

Step 6 — changelog/page.tsx: Import { PageHeader, Timeline as SharedTimeline } from @repo/ui. Replace h1 with PageHeader. Replace inline glass-sm divs with SharedTimeline events array mapping version→title, description→description.

Step 7 — docs/page.tsx: Import { PageHeader } from @repo/ui. Replace inline h1 with PageHeader. Keep semantic HTML sections as-is (they are content, not UI patterns).


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
- Issue #35: Uptime: app-specific tests
- Status: success
- Tests: PASSING
- Files changed: 3
- Duration: 429s
- PR: https://github.com/last-rev-llc/lr-apps/pull/134

Build on what was already done. Avoid duplicating work.


## Learnings from Previous Runs

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

### Run #42 (success)
- Component migration completed with zero test retries — all 73 web tests passed first run
- Code review caught and fixed an XSS vulnerability in SlangTranslator's `dangerouslySetInnerHTML` before merge
- Existing `@repo/ui` components (Button, Badge, Card) dropped in cleanly with minimal style adjustment
- Nothing — build and tests passed on first attempt


## Known Anti-Patterns to Avoid
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
- The `act(...)` warnings in accounts-app tab tests indicate `fireEvent.keyDown` on tabs triggers async state updates not wrapped in `act()` — should be addressed in a future cleanup pass to keep test output clean
- The diff includes accounts app test files that appear unrelated to issue #33 (Meeting Summaries) — agent may have created or committed tests for the wrong app alongside the target app

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
3. Commit with: git commit -m "feat: Sentiment: component migration (closes #36)"