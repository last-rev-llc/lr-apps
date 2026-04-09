Implement GitHub issue #35: Uptime: app-specific tests

## Summary
Add test coverage for Uptime app — status badge logic and history charts.

## Acceptance Criteria
- [ ] Test: status badge renders correct color/label for each status
- [ ] Test: history chart renders with mock data
- [ ] Test: site list renders correctly
- [ ] Test: auth gate redirects work
- [ ] `pnpm test` passes


## Implementation Plan
1. Create `apps/web/app/apps/uptime/__tests__/layout.test.tsx`: Mock `requireAppLayoutAccess`, test it's called with 'uptime', test children render when authed, test Topbar renders with title, test auth error propagates. Follow meeting-summaries layout test pattern exactly.
2. Create `apps/web/app/apps/uptime/__tests__/page.test.tsx`: Mock `@repo/db/server` createClient to return mock supabase with `from().select().order()` chain returning mock Site[] data. Test cases:
   a. Status badge: all-up sites show 'All Systems Operational' with success variant; mix of statuses shows '⚠️ N Systems Experiencing Issues'.
   b. Site list: renders site names, URLs, status labels ('Operational', 'Down', 'Degraded'), response times, uptime percentages in cards.
   c. History chart: renders bars (check DOM elements with appropriate bg-color classes for up/down/degraded), verify title attributes contain date and status.
   d. Empty state: when no sites returned, renders 'No sites are being monitored yet.' EmptyState.
   e. Edge cases: site with no history shows no bars, site with unknown status shows 'Unknown' label.
3. Use `renderWithProviders` and `screen` from `@repo/test-utils`. Use `// @vitest-environment jsdom` directive. Mock supabase at module level with `vi.mock('@repo/db/server')`. Create helper `makeSite()` factory for test data.
4. Run `pnpm test` from apps/web to verify all tests pass.


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
- Issue #34: Uptime: component migration
- Status: success
- Tests: PASSING
- Files changed: 3
- Duration: 443s
- PR: https://github.com/last-rev-llc/lr-apps/pull/132

Build on what was already done. Avoid duplicating work.


## Learnings from Previous Runs

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

### Run #41 (success)
- Tests passed on first run with zero retries, indicating solid mock patterns and test setup
- Reused shared `createMockSupabase` and `renderWithProviders` from `@repo/test-utils` for consistent test infrastructure
- Component was refactored (raw buttons → Badge/Button components) to improve testability alongside writing tests
- Nothing


## Known Anti-Patterns to Avoid
- **Avoid testing against raw HTML when @repo/ui exists**: The dad-joke-of-the-day component used raw `<button>` elements for ratings and styled `<button>` for category filters instead of @repo/ui primitives — this was caught and fixed during test work but should be caught during initial implementation
- Diff includes unrelated test files (dad-joke-of-the-day tests) that aren't part of issue #44's scope — component migration issues should stay focused on the target app only
- Playwright verification was skipped due to missing CLI — E2E coverage gap on visual regressions from component swaps
- **Avoid testing against raw HTML elements in production code**: The joke-viewer had raw `<button>` elements for category filters and ratings instead of using the shared UI library, making test queries brittle and inconsistent with other components
- Using `dangerouslySetInnerHTML` with user input (slang translations) without HTML escaping — always sanitize or use text content instead
- Scoping migration too narrowly to "swap components" without auditing security of surrounding code
- Avoid testing against raw styled `<button>` elements with class-based selectors; prefer semantic components with `title`/`role` attributes for stable queries
- Replacing `<button>` with a component that renders a `<div>` without checking — silently breaks keyboard/screen-reader accessibility with no test failure to catch it.
- Not wrapping tab-switching `fireEvent` calls in `act()` produces noisy warnings — future tab interaction tests should use `await act(async () => { ... })` or `userEvent` which handles act internally
- Adding tests for a sibling app (Accounts) in a PR scoped to a different app (Uptime) — keeps the diff clean but muddies the issue scope
- The `act(...)` warnings in accounts-app tab tests indicate `fireEvent.keyDown` on tabs triggers async state updates not wrapped in `act()` — should be addressed in a future cleanup pass to keep test output clean
- The diff includes accounts app test files that appear unrelated to issue #33 (Meeting Summaries) — agent may have created or committed tests for the wrong app alongside the target app
- Review flagged 5 unfixed inline UI patterns in the command-center integration of meeting-summaries — these should be tracked as a follow-up issue rather than left as known debt without a ticket
- Accounts app tests emit `act(...)` warnings in stderr for tab interactions — while tests pass, these warnings indicate test helpers (`clickTab`) should use `act()` wrapping to avoid false confidence
- `act(...)` warnings in accounts-app tests (stderr noise from tab state updates not wrapped in act) — tests pass but warnings indicate potential flakiness; future runs should wrap tab interactions in `act()` or use `userEvent` instead of `fireEvent`

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
3. Commit with: git commit -m "feat: Uptime: app-specific tests (closes #35)"