Implement GitHub issue #23: Extend @repo/ui with missing common components

## Summary
Audit component gaps needed for M4–M6 app migrations and build missing shared components in `@repo/ui`.

## Details
- Audit all 27 apps for commonly-used UI patterns not yet in `@repo/ui`
- Likely needed: `Table`, `DataGrid`, `StatusBadge`, `LoadingSkeleton`, `ErrorBoundary`, `EmptyState` variants
- Follow existing patterns: forwardRef, CVA (class-variance-authority), cn() utility
- Each component should support theme tokens and dark mode
- Add Storybook-style examples or tests for variant coverage

## Acceptance Criteria
- [ ] Audit complete — documented list of needed components
- [ ] `Table` component with sortable columns and row selection
- [ ] `DataGrid` component for tabular data display
- [ ] `StatusBadge` component with semantic color variants
- [ ] `LoadingSkeleton` component with configurable shapes
- [ ] `ErrorBoundary` wrapper component
- [ ] `EmptyState` component with icon, title, description, action slots
- [ ] All components use forwardRef, CVA, cn() patterns
- [ ] All components render with theme tokens
- [ ] `pnpm build` passes
- [ ] `pnpm test` passes


## Implementation Plan
Step 1 — Table component (table.tsx): Create Table, TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell, TableCaption sub-components. All use forwardRef wrapping native HTML table elements with cn() className merging. No external deps needed. Follow the Card multi-sub-component pattern exactly. Add sortable column support via an optional onSort callback prop on TableHead and a 'sorted' variant via CVA (asc/desc/none). Add row selection via optional checkbox column with onSelectRow/onSelectAll callbacks on Table.

Step 2 — DataGrid component (data-grid.tsx): Higher-level wrapper around Table for tabular data display. Props: columns (array of {key, header, render?, sortable?}), data (array of row objects), sortable, selectable, emptyState. Renders Table internally. Uses 'use client' directive for interactive state (sort state, selection state). Includes built-in empty state via existing EmptyState component when data is empty.

Step 3 — StatusBadge component (status-badge.tsx): Extend beyond existing Badge with semantic status variants via CVA. Variants: success (green), warning (amber), error (red), info (blue), neutral (gray), pending (yellow pulse animation). Each variant sets bg, text, and optional border colors using theme tokens (Tailwind classes). Support dark mode via dark: prefixed classes. Include optional dot indicator. Use forwardRef + CVA + cn() pattern matching button.tsx.

Step 4 — LoadingSkeleton component (loading-skeleton.tsx): CVA variants for shape (line, circle, rect, card) and size (sm, md, lg, full). Renders a div with animate-pulse and rounded corners based on shape. Support configurable width/height props. Add compound variants: 'card' shape renders a Card-like skeleton with header + body lines. Use forwardRef + CVA + cn(). No 'use client' needed.

Step 5 — ErrorBoundary component (error-boundary.tsx): Class component (required for React error boundaries) wrapping children. Props: fallback (ReactNode or render function receiving {error, reset}), onError callback. Default fallback shows error message with retry button using existing Button component. Export ErrorBoundary class and a useErrorBoundary hook (optional). Must use 'use client' directive.

Step 6 — Update barrel export (index.ts): Add new exports to appropriate category sections. Table sub-components under 'Base UI', DataGrid under 'Interactive', StatusBadge under 'Base UI', LoadingSkeleton under 'Animation/Utility', ErrorBoundary under 'Utility'.

Step 7 — Update package.json: Add @tanstack/react-table as optional peer dep only if DataGrid needs it; otherwise keep zero new deps by implementing sort/select logic inline.

Step 8 — Write tests: Create __tests__/ directory. For each component, test: renders without crashing, forwards refs, applies variant classes correctly, handles interactive callbacks (sort, select). Use vitest + @testing-library/react (already configured).


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



## Learnings from Previous Runs

### Run #9 (success)
- Clean first-pass execution with zero test retries — the audit script worked correctly on initial run
- Code review caught dead code (unused `classifySeverity` function and 10 regex constants) and it was fixed before completion
- Comprehensive report covering all 27 apps with per-file, per-line violation detail and a reference section for available theme tokens
- Nothing — all acceptance criteria met, no retries needed

### Run #68 (success)
- Systematic token replacement across 10 internal apps with all 8 packages passing tests (106 total) on first run
- Code review caught real regressions (hover states losing visual feedback, null-state colors becoming opaque) that were fixed before completion
- Visual regression baseline snapshots were not created (acceptance criterion) due to missing Playwright visual comparison infrastructure
- Commit message used `closes #68` which may prematurely auto-close the issue since this is only batch 1

### Run #10 (success)
- Shared utility approach (glass, glass-sm, glass-strong, glass-header, shadow tokens, animation utilities) cleanly replaced scattered inline definitions across apps
- All 8 packages passed tests (106 total) with zero retries needed
- Tooling additions (token-violations-report.md, audit-tokens.ts) provided systematic discovery of violations rather than manual grep
- Nothing — build, typecheck, and all tests passed first try


## Known Anti-Patterns to Avoid
- Hardcoded skip-lists (e.g. excluding `#fff`/`#000`) can mask real violations — make filtering configurable rather than baked in
- Framework-required literal values (Next.js `themeColor` in viewport metadata) will always be false positives in token audits — document known exceptions upfront to avoid noise in reports
- **Using `closes` keyword on batch work**: partial work (batch 1 of N) should use `refs #68` not `closes #68` to avoid premature issue closure
- **Missing light-theme overrides for new tokens**: shadow/glow tokens added without `[data-theme='light']` counterparts will likely render too heavy in light mode — always add both theme variants when creating new visual tokens
- **Over-normalizing unique styles**: forcing context-specific effects (wine pour glow, quiz accent shadow) into shared tokens would create overly specific utilities that only one app uses
- **Leaving large generated reports tracked in git**: the 1871-line token-violations-report.md should be gitignored and generated on-demand to avoid repo bloat

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
3. Commit with: git commit -m "feat: Extend @repo/ui with missing common components (closes #23)"