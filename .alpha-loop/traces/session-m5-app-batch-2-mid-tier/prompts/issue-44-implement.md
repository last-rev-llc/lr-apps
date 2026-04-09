Implement GitHub issue #44: Slang Translator: component migration

## Summary
Replace inline UI in Slang Translator with `@repo/ui` shared components.

## Acceptance Criteria
- [ ] Translator input/output uses `@repo/ui` Input, Card
- [ ] Bi-directional display uses shared components
- [ ] All buttons use `@repo/ui` Button
- [ ] `pnpm build` passes


## Implementation Plan
1. slang-app.tsx — Add Textarea and Dialog imports from @repo/ui.
2. slang-app.tsx — GenBadge helper (lines ~52-62): replace raw <span> elements with <Badge variant="secondary"> styled via className overrides for gen-alpha (violet) and gen-z (blue) colors.
3. slang-app.tsx — CategoryBadge helper (lines ~64-88): replace raw <span> with <Badge variant="outline"> and move dynamic color into className/style prop.
4. slang-app.tsx — SlangDetailModal (line ~188): replace raw <button> close with <Button variant="ghost" size="icon">. Consider migrating the modal overlay to <Dialog>/<DialogContent> from @repo/ui.
5. slang-app.tsx — DictionaryTab generation filter buttons (lines ~277-289): replace raw <button> with <Button variant="outline" size="sm">, toggle active state via conditional variant="default".
6. slang-app.tsx — DictionaryTab category filter buttons (lines ~292-306): same pattern as generation filters — <Button variant="outline" size="sm"> with active variant swap.
7. slang-app.tsx — TranslatorTab textarea (lines ~442-448): replace raw <textarea> with <Textarea> from @repo/ui.
8. slang-app.tsx — QuizTab answer buttons (lines ~745-751): replace raw <button> with <Button>, use variant props for correct/incorrect/default states.
9. about/page.tsx — CTA link (lines ~78-83): wrap <a> with <Button asChild>.
10. about/page.tsx — Feature cards (lines ~14-45): replace glass-sm divs with <Card>/<CardContent>.
11. about/page.tsx — How-it-works list items (lines ~63-74): replace glass-sm <li> wrappers with <Card>/<CardContent>.
12. Run pnpm build to verify no regressions.


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
- Issue #43: Generations: app-specific tests
- Status: success
- Tests: PASSING
- Files changed: 3
- Duration: 597s
- PR: https://github.com/last-rev-llc/lr-apps/pull/129

Build on what was already done. Avoid duplicating work.


## Learnings from Previous Runs

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

### Run #32 (success)
- Clean first-pass migration with zero test fix retries — component swap pattern is well-established at this point
- Build passed immediately, indicating solid understanding of `@repo/ui` component APIs
- Existing test suites (140 tests across 17 files) all passed without modification
- Nothing — all tests and build passed on first attempt


## Known Anti-Patterns to Avoid
- **Avoid testing against raw HTML elements in production code**: The joke-viewer had raw `<button>` elements for category filters and ratings instead of using the shared UI library, making test queries brittle and inconsistent with other components
- Using `dangerouslySetInnerHTML` with user input (slang translations) without HTML escaping — always sanitize or use text content instead
- Scoping migration too narrowly to "swap components" without auditing security of surrounding code
- Avoid testing against raw styled `<button>` elements with class-based selectors; prefer semantic components with `title`/`role` attributes for stable queries
- Replacing `<button>` with a component that renders a `<div>` without checking — silently breaks keyboard/screen-reader accessibility with no test failure to catch it.
- Review flagged 5 unfixed inline UI patterns in the command-center integration of meeting-summaries — these should be tracked as a follow-up issue rather than left as known debt without a ticket
- Accounts app tests emit `act(...)` warnings in stderr for tab interactions — while tests pass, these warnings indicate test helpers (`clickTab`) should use `act()` wrapping to avoid false confidence
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
3. Commit with: git commit -m "feat: Slang Translator: component migration (closes #44)"