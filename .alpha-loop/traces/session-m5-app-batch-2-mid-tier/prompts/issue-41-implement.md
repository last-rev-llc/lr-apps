Implement GitHub issue #41: Dad Joke of the Day: app-specific tests

## Summary
Add test coverage for Dad Joke of the Day — JOTD selection and category filtering.

## Acceptance Criteria
- [ ] Test: joke of the day selection displays correctly
- [ ] Test: category filtering works
- [ ] Test: joke cards render with mock data
- [ ] Test: auth gate redirects work
- [ ] `pnpm test` passes


## Implementation Plan
1. Create apps/web/app/apps/dad-joke-of-the-day/lib/__tests__/queries.test.ts:
   - Test getJokeOfTheDay: returns null for empty array, returns deterministic joke based on date seed, returns same joke for same date (mock Date), returns different joke for different date.
   - Test getCategories: returns empty array for no jokes, extracts unique sorted categories, filters out falsy categories.
   - Test getAllJokes: mock @repo/db/server createClient, verify it queries dad_jokes table, test error path returns empty array.

2. Create apps/web/app/apps/dad-joke-of-the-day/components/__tests__/joke-viewer.test.tsx:
   - Mock @repo/db/client createClient (for trackShown/rateJoke calls).
   - Mock @repo/ui to provide minimal Button/Badge/Card/CardContent stubs.
   - Test joke card renders: setup text displayed, punchline hidden initially, reveal button present.
   - Test punchline reveal: click reveal button, punchline text appears, rating buttons appear.
   - Test category filtering: render with multiple categories, click a category badge, verify filtered pool count text appears.
   - Test JOTD mode badge shows correctly on initial render.
   - Test random joke button changes displayed joke.

3. Auth gate test already exists in apps/web/lib/__tests__/require-app-layout-access.test.ts (line 52-55 tests dad-joke-of-the-day slug). Add one supplemental test there verifying that auth:false apps with no publicRoutes still call requireAccess (already covered — no changes needed, just verify it passes).

4. Run pnpm test to verify all tests pass.


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
- Issue #40: Dad Joke of the Day: component migration
- Status: success
- Tests: PASSING
- Files changed: 1
- Duration: 388s
- PR: https://github.com/last-rev-llc/lr-apps/pull/123

Build on what was already done. Avoid duplicating work.


## Learnings from Previous Runs

### Run #40 (success)
- Clean single-file migration: all inline UI (Badge, Button) replaced with `@repo/ui` shared components in `joke-viewer.tsx` only, correctly identifying that `page.tsx` had no inline UI to migrate.
- A11y regression caught and fixed during review: interactive Badge elements wrapped in `<button>` to preserve keyboard navigation and screen reader support that raw `<div>`-based Badge would lose.
- Zero test fix retries — build and all 54 web tests passed on first run.
- Nothing — all acceptance criteria met, tests passed, no retries needed.

### Run #29 (success)
- Clean first-pass success with zero test fix retries — all 121 web tests passed immediately
- Consistent test structure across apps (standup follows same layout/page/app-component pattern as accounts and command-center)
- Good use of shared `@repo/test-utils` (`renderWithProviders`, `mockSupabaseCall`) kept test boilerplate minimal
- Nothing — all acceptance criteria met on first attempt

### Run #28 (success)
- Clean first-pass execution with zero test retries, consistent with prior migration issues (#24-#27)
- Reused established migration pattern: swap inline UI patterns for `@repo/ui` shared components (Card, Button, Badge)
- Existing test infrastructure (`@repo/test-utils`, `renderWithProviders`) enabled comprehensive test coverage without new tooling
- Nothing — all 95 tests passed across 10 test files, build succeeded
- Minor: `act(...)` warnings in accounts-app tests indicate tab-switching state updates aren't fully wrapped, though tests still pass

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


## Known Anti-Patterns to Avoid
- Replacing `<button>` with a component that renders a `<div>` without checking — silently breaks keyboard/screen-reader accessibility with no test failure to catch it.
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
3. Commit with: git commit -m "feat: Dad Joke of the Day: app-specific tests (closes #41)"