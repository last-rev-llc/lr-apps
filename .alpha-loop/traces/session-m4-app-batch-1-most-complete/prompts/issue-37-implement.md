Implement GitHub issue #37: Sentiment: app-specific tests

## Summary
Add test coverage for Sentiment app — mood entry rendering, dashboard, changelog, docs.

## Acceptance Criteria
- [ ] Test: dashboard renders with mock sentiment entries
- [ ] Test: mood badge displays correct color for each mood
- [ ] Test: member filter works correctly
- [ ] Test: stats row computes correct values
- [ ] Test: changelog page renders
- [ ] Test: docs page renders
- [ ] Test: auth gate redirects work
- [ ] `pnpm test` passes


## Implementation Plan
Create 5 test files in apps/web/app/apps/sentiment/__tests__/ following the exact patterns from uptime and standup tests.

1. sentiment-dashboard.test.tsx — Client component tests using renderWithProviders:
   - Build mock SentimentEntry[] with 3+ entries across 2 members, covering all 5 moods (positive, excited, neutral, frustrated, blocked).
   - Test: dashboard renders heading 'Dashboard' and all child sections.
   - Test: MoodBadge displays correct text for each mood; verify color classes (bg-green-500/20 for positive, bg-purple-500/20 for excited, bg-muted for neutral, bg-orange-500/20 for frustrated, bg-red-500/20 for blocked).
   - Test: MemberFilter renders 'All Members' option plus one option per unique member; use fireEvent.change to select a specific member and verify only that member's entries appear.
   - Test: StatsRow shows correct computed values — avgSentiment (sum/count toFixed(1)), total entries count, unique member count, blocked days count, total highlights count.
   - Test: empty entries array shows dash '—' for avg sentiment and zeros elsewhere.

2. page.test.tsx — Server component test with Supabase mock (follow uptime/page.test.tsx pattern):
   - Use vi.hoisted() to create mockBuilder and mockSupabase with chainable methods.
   - Mock @repo/db/server createClient.
   - Test: page renders 'Team Sentiment' heading and subtitle text.
   - Test: page passes fetched entries to SentimentDashboard (verify dashboard content renders).
   - Test: empty data returns empty dashboard state.

3. layout.test.tsx — Auth gate test (follow uptime/layout.test.tsx pattern):
   - Mock @/lib/require-app-layout-access.
   - Test: calls requireAppLayoutAccess with 'sentiment'.
   - Test: renders children when authenticated.
   - Test: renders 'Sentiment' title in header.
   - Test: propagates auth error when requireAppLayoutAccess rejects.

4. changelog.test.tsx — Static page rendering:
   - Test: renders 'Changelog' heading.
   - Test: renders all 3 version entries (v3.0.0, v2.0.0, v1.0.0).

5. docs.test.tsx — Static page rendering:
   - Test: renders 'Documentation' heading.
   - Test: renders all 3 section headings (Overview, Data Schema, Scoring Guide).
   - Test: renders scoring range entries (9-10, 7-8, 5-6, 3-4, 1-2).


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
- Issue #36: Sentiment: component migration
- Status: failure
- Tests: FAILING
- Files changed: 0
- Duration: 814s


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
3. Commit with: git commit -m "feat: Sentiment: app-specific tests (closes #37)"