Implement GitHub issue #71: Add theme token lint rule

## Summary
Add ESLint rule that warns on hardcoded color values in TSX files. Integrate into @repo/config.

## Acceptance Criteria
- [ ] ESLint rule detects hardcoded hex colors in className strings
- [ ] Rule integrated into @repo/config shared config
- [ ] All existing violations documented or auto-fixable
- [ ] Prevents regression after token migration


## Implementation Plan
1. Create `packages/config/rules/no-hardcoded-colors.mjs` — custom ESLint rule that inspects JSX attributes (className, style) for hardcoded hex color patterns (#rgb, #rrggbb, #rrggbbaa). Use AST visitors for JSXAttribute nodes; check string literals and template literal quasi values. Report with message suggesting CSS custom property tokens (var(--color-*)). Allow an exemption comment (e.g. `// eslint-disable-next-line`) for legitimate cases like metadata themeColor.
2. Wire into `packages/config/eslint.config.mjs` — import the custom rule, register it as a plugin (flat config plugin object with rules map), and add a config entry enabling `no-hardcoded-colors: warn` for `**/*.tsx` files only.
3. Add `@eslint/rule-tester` (or vitest) as a devDependency in `packages/config/package.json` and update the test script.
4. Create `packages/config/rules/__tests__/no-hardcoded-colors.test.mjs` — test valid cases (theme tokens, non-color hex strings) and invalid cases (hex colors in className, style objects, template literals).
5. Run the rule across the monorepo (`pnpm -w eslint . --ext tsx`) to catalog existing violations. Document them in the PR description or add inline eslint-disable comments for accepted exceptions (e.g. meme-generator template data, metadata themeColor).


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
- Issue #70: Replace hardcoded tokens — batch 3 (showcase apps)
- Status: success
- Tests: PASSING
- Files changed: 6
- Duration: 1013s
- PR: https://github.com/last-rev-llc/lr-apps/pull/114

Build on what was already done. Avoid duplicating work.


## Learnings from Previous Runs

### Run #9 (success)
- Clean first-pass execution with zero test retries — the audit script worked correctly on initial run
- Code review caught dead code (unused `classifySeverity` function and 10 regex constants) and it was fixed before completion
- Comprehensive report covering all 27 apps with per-file, per-line violation detail and a reference section for available theme tokens
- Nothing — all acceptance criteria met, no retries needed

### Run #70 (success)
- Systematic token replacement across 7 showcase apps with all 8 packages passing tests (106 total) on first run, zero retries
- Code review caught 2 remaining hardcoded green-500/green-400 classes in travel-collection that were fixed before completion
- Appropriate triage of unfixable items: metadata hex values, data-driven brand colors, and app-specific CSS custom properties correctly left as-is
- Visual regression baseline snapshots were not created (acceptance criterion) — verification was skipped entirely with rationale that code review suffices, but this leaves the AC unmet without a tracked follow-up

### Run #69 (success)
- Code review caught 5 real issues (missed migration, inconsistent color formats, semantic mismatch, gradient collapse, missing light-theme overrides) — all fixed before completion
- All 8 packages passed tests (106 total) with zero retries, confirming token replacements introduced no regressions
- Visual regression baseline snapshots were not created (explicit acceptance criterion) — skipped due to missing Playwright visual comparison infrastructure rather than flagged as a blocker
- Verification was skipped entirely with rationale that changes are "token-for-token" — but the review found 5 substantive issues, proving visual/semantic review is necessary even for token migrations

### Run #68 (success)
- Systematic token replacement across 10 internal apps with all 8 packages passing tests (106 total) on first run
- Code review caught real regressions (hover states losing visual feedback, null-state colors becoming opaque) that were fixed before completion
- Visual regression baseline snapshots were not created (acceptance criterion) due to missing Playwright visual comparison infrastructure
- Commit message used `closes #68` which may prematurely auto-close the issue since this is only batch 1

### Run #23 (success)
- Clean first-pass implementation of 6 components (Table, DataGrid, StatusBadge, LoadingSkeleton, ErrorBoundary, EmptyState) following existing CVA/cn/forwardRef patterns
- Comprehensive test coverage (31 tests across 5 test files) all passing on first run with no retries needed
- Code review caught real issues (missing 'use client' directive, broken test logic, missing aria-sort) that were fixed before merge
- Nothing — build and all tests passed without retries


## Known Anti-Patterns to Avoid
- Hardcoded skip-lists (e.g. excluding `#fff`/`#000`) can mask real violations — make filtering configurable rather than baked in
- Framework-required literal values (Next.js `themeColor` in viewport metadata) will always be false positives in token audits — document known exceptions upfront to avoid noise in reports
- **Skipping acceptance criteria without follow-up**: Verification was skipped with inline justification rather than creating a tracked issue for the missing visual regression baselines — unmet ACs should always produce a follow-up ticket
- **Inconsistent shadow token adoption**: `hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)]` in alpha-wins was left as inline rgba when a `shadow-glass-hover` token exists — borderline cases should be decided consistently per a documented policy
- **Skipping unmet acceptance criteria without follow-up**: Visual regression baselines were an explicit AC but silently dropped — unmet criteria should block success status or generate a tracked follow-up issue
- **Over-trusting "mechanical" changes**: Labeling token migration as "token-for-token with no behavioral changes" led to skipping verification, yet review found gradient collapse and semantic color mismatches — never assume CSS changes are safe without visual confirmation
- **Using `closes` keyword on batch work**: partial work (batch 1 of N) should use `refs #68` not `closes #68` to avoid premature issue closure
- **Missing light-theme overrides for new tokens**: shadow/glow tokens added without `[data-theme='light']` counterparts will likely render too heavy in light mode — always add both theme variants when creating new visual tokens
- **Missing 'use client' directives on interactive components**: Any component accepting event handler props (onSort, onClick callbacks) needs the directive. Check this during implementation, not just review.
- **Test logic that doesn't match React lifecycle**: ErrorBoundary reset test initially had wrong sequencing (click before rerender). Always reason through component state transitions when testing stateful class components.
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
3. Commit with: git commit -m "feat: Add theme token lint rule (closes #71)"