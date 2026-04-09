Implement GitHub issue #26: Accounts: component migration

## Summary
Complete `@repo/ui` migration for Accounts app. Already partially uses shared components.

## Details
- Audit remaining inline UI patterns
- Replace any remaining inline buttons, cards, inputs with `@repo/ui`
- Ensure client list, PR aggregation, contact display use shared components

## Acceptance Criteria
- [ ] All UI elements use `@repo/ui` components
- [ ] Client list display uses shared Table/Card
- [ ] Contact display uses shared components
- [ ] No inline Tailwind button/card patterns remain
- [ ] `pnpm build` passes


## Implementation Plan
1. **page.tsx** — Replace inline stat grid (lines 20-37) with `StatCard` from @repo/ui (supports value, label, icon, size props). Replace inline h2/p header (lines 12-17) with `PageHeader` component.

2. **accounts-app.tsx imports** — Expand @repo/ui import to include: `CardHeader, CardTitle, CardContent, Button, Badge as UiBadge, StatusBadge, EmptyState, PageHeader`. Remove local Badge, SectionCard, Empty, Row helper components.

3. **Remove custom Badge (lines 52-85)** — Replace all `Badge` usages with `StatusBadge` from @repo/ui which has colored variants (success/warning/error/info/neutral) matching the existing color semantics. Map: green->success, amber->warning, red->error, blue->info, purple/gray/cyan->use StatusBadge with className overrides or Badge with outline variant + className.

4. **Remove SectionCard (lines 89-104)** — Replace with `Card` + `CardHeader` + `CardTitle` + `CardContent` composition. Apply `glass border-surface-border` to Card className. ~15 usages across OverviewTab, MeetingsTab, IntegrationsTab.

5. **Remove Empty (lines 108-112)** — Replace with `EmptyState` from @repo/ui. For inline short messages use EmptyState with just title prop.

6. **Remove Row (lines 116-122)** — Replace with `TableRow`/`TableCell` from @repo/ui Table components where data is tabular (PRRow, NetlifyRow, StandupRow). For non-tabular rows, use a simple flex div with cn().

7. **Replace button-like links (lines 139-179, 358-369)** — Replace styled `<a>` tags with `Button variant='outline' size='sm' asChild` wrapping an `<a>`. Covers: Website, Production, Staging, GitHub repo links.

8. **Replace inline select (lines 703-713)** — Wrap native `<select>` with `Input`-like styling or keep native select but apply consistent @repo/ui styling via cn().

9. **Replace inline health badge (line 715)** — Use `StatusBadge` with appropriate variant.

10. **Replace empty state at line 688-694** — Use `EmptyState` with icon='👥' and title='No clients found'.

11. **Replace Jira alert box (lines 529-534)** — Use `StatusBadge variant='warning'` or a Card with warning styling.

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
- Issue #25: Command Center: app-specific tests
- Status: success
- Tests: PASSING
- Files changed: 3
- Duration: 766s
- PR: https://github.com/last-rev-llc/lr-apps/pull/117

Build on what was already done. Avoid duplicating work.


## Learnings from Previous Runs

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
3. Commit with: git commit -m "feat: Accounts: component migration (closes #26)"