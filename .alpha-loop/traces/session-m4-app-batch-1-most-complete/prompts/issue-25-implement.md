Implement GitHub issue #25: Command Center: app-specific tests

## Summary
Add test coverage for Command Center hub page and shared module chrome.

## Details
- Test hub page rendering with mock Supabase data
- Test module navigation and routing
- Test auth gate redirect behavior
- Use `@repo/test-utils` for mock setup

## Acceptance Criteria
- [ ] Test: hub page renders module cards with correct data
- [ ] Test: sidebar navigation renders all module links
- [ ] Test: unauthenticated user redirects to login
- [ ] Test: user without permission redirects to unauthorized
- [ ] All tests use `@repo/test-utils` helpers
- [ ] `pnpm test` passes


## Implementation Plan
1. Create `apps/web/app/apps/command-center/__tests__/page.test.tsx`: Import CommandCenterPage and render with `renderWithProviders` from `@repo/test-utils`. Test that all 21 module cards render with correct label, icon, description, and category badge. Test that each card links to `/apps/command-center/{slug}`. Test that stat cards show correct values (21 Modules, 21 Routes, 7 Categories, Active). 2. Create `apps/web/app/apps/command-center/__tests__/layout.test.tsx`: Mock `@repo/auth/server` (requireAccess) and `../../../lib/require-app-layout-access` (requireAppLayoutAccess). For authenticated user: mock requireAppLayoutAccess to resolve, render layout, verify Sidebar receives all 22 items (Hub + 21 modules) with correct hrefs, verify Topbar renders with title. For unauthenticated user: mock requireAccess to call `redirect('/login?redirect=command-center')` via vi.mock of `next/navigation`, verify redirect is triggered. For user without permission: mock requireAccess to call `redirect('/unauthorized?app=command-center')`, verify redirect. Note: layout is an async server component so test the auth logic by testing requireAccess directly (already partially covered in require-app-layout-access.test.ts) and test the rendered output by mocking requireAppLayoutAccess to be a no-op. 3. Create `packages/ui/src/components/__tests__/sidebar.test.tsx`: Render Sidebar with sample SidebarItem array via `renderWithProviders`. Test all items render as links with correct href and label. Test collapsed mode hides labels. Test active item gets active styling class. Test toggle button calls onToggle callback.


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
- Issue #24: Command Center: component migration
- Status: success
- Tests: PASSING
- Files changed: 4
- Duration: 1724s
- PR: https://github.com/last-rev-llc/lr-apps/pull/116

Build on what was already done. Avoid duplicating work.


## Learnings from Previous Runs

### Run #24 (success)
- Systematic migration of inline buttons, badges, and stat cards to `@repo/ui` equivalents (`Button`, `Badge`, `StatCard`) across hub page and module chrome
- Five new shared components (`DataGrid`, `Table`, `StatusBadge`, `LoadingSkeleton`, `ErrorBoundary`) were created with full test coverage (31 tests passing)
- Zero test failures — all 8 packages passed on first run with full turbo cache hits
- New `@repo/ui` components were built and tested but never actually used in the command-center app files — they are dead code from this migration's perspective
- Several sub-module files (`meetings-app.tsx`, `shopping-list-app.tsx`, `error.tsx`, `pr-app.tsx`) still contain raw `<input>`, `<button>`, and local `StatusBadge` patterns that should have been migrated


## Known Anti-Patterns to Avoid
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
3. Commit with: git commit -m "feat: Command Center: app-specific tests (closes #25)"