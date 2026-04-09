Implement GitHub issue #45: Slang Translator: app-specific tests

## Summary
Add test coverage for Slang Translator — lookup and bi-directional display.

## Acceptance Criteria
- [ ] Test: slang lookup returns expected results
- [ ] Test: bi-directional display renders correctly
- [ ] Test: auth gate redirects work
- [ ] `pnpm test` passes


## Implementation Plan
1. Create lib/__tests__/queries.test.ts: Mock @repo/db/server with createMockSupabase. Test getAllSlang() returns merged gen-alpha (from DB) + gen-x (from local JSON) sorted by vibe_score desc. Test error case throws. Verify supabase.from('slang').select('*').order('vibe_score') is called.
2. Create lib/__tests__/gen-x-map.test.ts: Test GEN_X_MAP has expected entry count (46). Verify known mappings (e.g. skibidi → 'Gnarly / Radical', rizz → 'Game / Mack Daddy'). Verify all values are non-empty strings.
3. Create components/__tests__/slang-app.test.tsx: Mock @repo/ui with working Tabs context (same pattern as generations/slang-app.test.tsx). Create makeEntry() fixture helper for SlangEntry type. Test SlangApp renders Dictionary tab by default. Test tab switching to Translator, Compare, Quiz tabs. Test DictionaryTab: search filters terms by term/definition/alias, generation filter buttons work, category filter works, shows 'X terms found' count, clicking card opens SlangDetailModal. Test bi-directional display: SlangCard shows Gen X equivalent for gen-alpha entries (via GEN_X_MAP), shows Gen Alpha equivalent for gen-x entries (via equivalents.genAlpha). Test TranslatorTab: direction swap button toggles between alpha-to-x and x-to-alpha, typing known slang produces translated output, unknown text shows 'No recognized slang terms found'. Test CompareTab renders side-by-side pairs with both generation badges.
4. Create __tests__/layout.test.tsx: Mock @/lib/require-app-layout-access. Test it calls requireAppLayoutAccess('slang-translator'). Test renders children when authorized. Test throws when access is rejected. Test renders nav links (App, About, Dashboard). Test renders header title '🗣️ Slang Translator'.


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
- Issue #44: Slang Translator: component migration
- Status: success
- Tests: PASSING
- Files changed: 3
- Duration: 523s
- PR: https://github.com/last-rev-llc/lr-apps/pull/130

Build on what was already done. Avoid duplicating work.


## Learnings from Previous Runs

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

### Run #40 (success)
- Clean single-file migration: all inline UI (Badge, Button) replaced with `@repo/ui` shared components in `joke-viewer.tsx` only, correctly identifying that `page.tsx` had no inline UI to migrate.
- A11y regression caught and fixed during review: interactive Badge elements wrapped in `<button>` to preserve keyboard navigation and screen reader support that raw `<div>`-based Badge would lose.
- Zero test fix retries — build and all 54 web tests passed on first run.
- Nothing — all acceptance criteria met, tests passed, no retries needed.


## Known Anti-Patterns to Avoid
- Diff includes unrelated test files (dad-joke-of-the-day tests) that aren't part of issue #44's scope — component migration issues should stay focused on the target app only
- Playwright verification was skipped due to missing CLI — E2E coverage gap on visual regressions from component swaps
- **Avoid testing against raw HTML elements in production code**: The joke-viewer had raw `<button>` elements for category filters and ratings instead of using the shared UI library, making test queries brittle and inconsistent with other components
- Using `dangerouslySetInnerHTML` with user input (slang translations) without HTML escaping — always sanitize or use text content instead
- Scoping migration too narrowly to "swap components" without auditing security of surrounding code
- Avoid testing against raw styled `<button>` elements with class-based selectors; prefer semantic components with `title`/`role` attributes for stable queries
- Replacing `<button>` with a component that renders a `<div>` without checking — silently breaks keyboard/screen-reader accessibility with no test failure to catch it.
- The `act(...)` warnings in accounts-app tab tests indicate `fireEvent.keyDown` on tabs triggers async state updates not wrapped in `act()` — should be addressed in a future cleanup pass to keep test output clean
- The diff includes accounts app test files that appear unrelated to issue #33 (Meeting Summaries) — agent may have created or committed tests for the wrong app alongside the target app
- Review flagged 5 unfixed inline UI patterns in the command-center integration of meeting-summaries — these should be tracked as a follow-up issue rather than left as known debt without a ticket
- Accounts app tests emit `act(...)` warnings in stderr for tab interactions — while tests pass, these warnings indicate test helpers (`clickTab`) should use `act()` wrapping to avoid false confidence
- `act(...)` warnings in accounts-app tests (stderr noise from tab state updates not wrapped in act) — tests pass but warnings indicate potential flakiness; future runs should wrap tab interactions in `act()` or use `userEvent` instead of `fireEvent`
- Skipping tests for the target app while the issue's own acceptance criteria don't explicitly require them — agents should default to adding tests for migrated components
- Not surfacing the missing Select component gap as a follow-up issue during the run
- **`act(...)` warnings in accounts tests**: the Accounts tab-switching tests produce React `act()` warnings in stderr — not blocking but indicates state updates outside the test lifecycle that could cause flaky failures later
- **Diff included unrelated accounts test files**: the code changes bundle accounts tests alongside standup tests, suggesting the worktree carried over uncommitted work from issue #27

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
3. Commit with: git commit -m "feat: Slang Translator: app-specific tests (closes #45)"