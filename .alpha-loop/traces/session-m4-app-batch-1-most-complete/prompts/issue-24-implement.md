Implement GitHub issue #24: Command Center: component migration

## Summary
Migrate Command Center hub page and shared module chrome to `@repo/ui` components. Sub-module internals are deferred to M6.

## Details
- Replace inline buttons, cards, badges, inputs, navigation with `@repo/ui` equivalents
- Migrate dashboard grid layout and module navigation sidebar
- Preserve all existing functionality
- Leave unique components but ensure they use theme tokens
- This is the largest migration surface in the codebase

## Acceptance Criteria
- [ ] Hub page uses `@repo/ui` Card, Button, Badge components
- [ ] Sidebar navigation uses `@repo/ui` navigation components
- [ ] Module chrome (headers, breadcrumbs, layout) uses shared components
- [ ] No inline Tailwind button/card/badge patterns remain in hub/chrome code
- [ ] All existing functionality preserved
- [ ] `pnpm build` passes
- [ ] Visual appearance matches or improves current design


## Implementation Plan
Phase 1 — Layout chrome (layout.tsx): Replace custom <header> with Topbar component from @repo/ui. Replace custom <aside> sidebar with Sidebar + SidebarItem components. Extract module list array to a shared constant. Wire active-state detection to SidebarItem props.

Phase 2 — Hub page (page.tsx): Replace inline h1/subtitle with PageHeader. Replace inline stats cards (glass div pattern) with StatCard from @repo/ui. Replace inline category badge spans (style={{background, borderColor}}) with Badge component. Keep module grid Links but ensure Card usage is consistent.

Phase 3 — Module chrome standardization (all 21 module *-app.tsx files): Replace inline filter buttons (px-3 py-1.5 rounded-lg border conditional className pattern) with Button component using variant='ghost' or variant='outline' plus data-active styling. Replace inline status/category badges (span with style={{bg, text, border}}) with Badge or StatusBadge from @repo/ui, passing color via className or style prop. Replace native <select> elements (in contentful, users modules) with consistent styling using @repo/ui patterns. Ensure all modules use PageHeader consistently (most already do). Ensure all stats displays use StatCard where applicable.

Phase 4 — Cleanup: Remove any remaining raw Tailwind button/card/badge class patterns in hub and chrome code. Verify no inline Tailwind button/card/badge patterns remain via grep. Run pnpm build to confirm no regressions.

Key constraint: Sub-module internals (unique domain-specific components like star ratings, mermaid diagrams, media previews) are deferred to M6. Only migrate the shared chrome patterns: buttons, cards, badges, inputs, navigation, headers, breadcrumbs, and layout.


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
- Issue #23: Extend @repo/ui with missing common components
- Status: success
- Tests: PASSING
- Files changed: 5
- Duration: 1154s
- PR: https://github.com/last-rev-llc/lr-apps/pull/113

Build on what was already done. Avoid duplicating work.


## Learnings from Previous Runs

### Run #69 (success)
- Code review caught 5 real issues (missed migration, inconsistent color formats, semantic mismatch, gradient collapse, missing light-theme overrides) — all fixed before completion
- All 8 packages passed tests (106 total) with zero retries, confirming token replacements introduced no regressions
- Visual regression baseline snapshots were not created (explicit acceptance criterion) — skipped due to missing Playwright visual comparison infrastructure rather than flagged as a blocker
- Verification was skipped entirely with rationale that changes are "token-for-token" — but the review found 5 substantive issues, proving visual/semantic review is necessary even for token migrations

### Run #23 (success)
- Clean first-pass implementation of 6 components (Table, DataGrid, StatusBadge, LoadingSkeleton, ErrorBoundary, EmptyState) following existing CVA/cn/forwardRef patterns
- Comprehensive test coverage (31 tests across 5 test files) all passing on first run with no retries needed
- Code review caught real issues (missing 'use client' directive, broken test logic, missing aria-sort) that were fixed before merge
- Nothing — build and all tests passed without retries


## Known Anti-Patterns to Avoid
- **Skipping unmet acceptance criteria without follow-up**: Visual regression baselines were an explicit AC but silently dropped — unmet criteria should block success status or generate a tracked follow-up issue
- **Over-trusting "mechanical" changes**: Labeling token migration as "token-for-token with no behavioral changes" led to skipping verification, yet review found gradient collapse and semantic color mismatches — never assume CSS changes are safe without visual confirmation
- **Missing 'use client' directives on interactive components**: Any component accepting event handler props (onSort, onClick callbacks) needs the directive. Check this during implementation, not just review.
- **Test logic that doesn't match React lifecycle**: ErrorBoundary reset test initially had wrong sequencing (click before rerender). Always reason through component state transitions when testing stateful class components.

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
3. Commit with: git commit -m "feat: Command Center: component migration (closes #24)"