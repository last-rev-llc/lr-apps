Implement GitHub issue #70: Replace hardcoded tokens — batch 3 (showcase apps)

## Summary
Replace inline color values with Tailwind theme token classes across showcase apps: Alpha Wins, Brommie Quake, Superstars, Travel Collection, AI Calculator, Area 52, Lighthouse.

## Acceptance Criteria
- [ ] No hardcoded hex/rgb/oklch color values in any listed app
- [ ] All colors reference theme tokens
- [ ] Visual regression baseline snapshot per app
- [ ] Existing functionality preserved


## Implementation Plan
Step 1 — Alpha Wins (wins-gallery.tsx): Replace Tailwind palette classes with theme tokens. bg-amber-500/15 → bg-accent/15, text-amber-400 → text-accent, border-amber-500/30 → border-accent/30, bg-blue-500/15 → bg-blue/15, text-blue-400 → text-blue, border-blue-500/30 → border-blue/30. Six occurrences across card tags and modal badges.

Step 2 — Brommie Quake (brommie-quake.css): The :root block already defines app-level CSS vars (--quake-blue, --quake-red, etc.) — these are the app's brand token layer and the hex definitions stay. Replace ~30 inline rgba() values that duplicate var colors with color-mix() or oklch() referencing the vars: rgba(206,15,45,0.3) → color-mix(in srgb, var(--quake-red) 30%, transparent), rgba(212,168,67,*) → color-mix with --quake-gold, rgba(0,103,177,*) → color-mix with --quake-blue or var(--glow-blue), rgba(255,255,255,*) → oklch(100% 0 0 / <alpha>). Add new :root vars for derived dark colors: --quake-navy: #001428, --quake-navy-deep: #002952, --quake-near-black: #0a0a0a, --quake-dark-red: #8B0000. Replace all inline occurrences of those hex values with the new vars. CONFETTI_COLORS array in page.tsx stays as literal hex (DOM manipulation exception per batch 2 precedent). themeColor in layout.tsx stays as literal hex (Next.js framework constraint).

Step 3 — Superstars: Create superstars.css with app-level CSS custom properties: --ss-primary: #00543C, --ss-accent: #FDBB30. Import it in layout.tsx. Then: (a) layout.tsx — bg-[#0a0e1a] → bg-navy, text-[#FDBB30] → text-[var(--ss-accent)], hover:bg-[#00543C] → hover:bg-[var(--ss-primary)], hover:border-[#FDBB30] → hover:border-[var(--ss-accent)], hover:text-[#FDBB30] → hover:text-[var(--ss-accent)]. (b) page.tsx — bg-[#00543C] → bg-[var(--ss-primary)], border-[#FDBB30] → border-[var(--ss-accent)], text-[#FDBB30] → text-[var(--ss-accent)]. (c) person-card.tsx — Change defaults from literal hex to getComputedStyle CSS var values is impractical; instead change defaults to use var() strings: primary default → 'var(--ss-primary)', accent default → 'var(--ss-accent)'. These are used in inline style={{ color: accent }} which accepts CSS var(). (d) person-profile.tsx — Same default pattern as person-card. Replace from-[#FDBB30] → from-[var(--ss-accent)], bg-[#0a0e1a] → bg-navy, group-hover:text-[#FDBB30] → group-hover:text-[var(--ss-accent)], hover:text-[#FDBB30] → hover:text-[var(--ss-accent)]. themeColor in layout.tsx stays as literal hex (framework constraint).

Step 4 — Verify no regressions: Run grep for remaining hardcoded hex/rgb/rgba across all 7 app directories. The only allowed exceptions are themeColor in layout.tsx files and CONFETTI_COLORS in brommie-quake/page.tsx.

Exceptions documented (no changes needed): Travel Collection, AI Calculator, Area 52, Lighthouse — only violations are themeColor (framework constraint) or zero violations.


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
- Issue #69: Replace hardcoded tokens — batch 2 (consumer apps)
- Status: success
- Tests: PASSING
- Files changed: 6
- Duration: 2194s
- PR: https://github.com/last-rev-llc/lr-apps/pull/112

Build on what was already done. Avoid duplicating work.


## Learnings from Previous Runs

### Run #9 (success)
- Clean first-pass execution with zero test retries — the audit script worked correctly on initial run
- Code review caught dead code (unused `classifySeverity` function and 10 regex constants) and it was fixed before completion
- Comprehensive report covering all 27 apps with per-file, per-line violation detail and a reference section for available theme tokens
- Nothing — all acceptance criteria met, no retries needed

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

### Run #10 (success)
- Shared utility approach (glass, glass-sm, glass-strong, glass-header, shadow tokens, animation utilities) cleanly replaced scattered inline definitions across apps
- All 8 packages passed tests (106 total) with zero retries needed
- Tooling additions (token-violations-report.md, audit-tokens.ts) provided systematic discovery of violations rather than manual grep
- Nothing — build, typecheck, and all tests passed first try


## Known Anti-Patterns to Avoid
- Hardcoded skip-lists (e.g. excluding `#fff`/`#000`) can mask real violations — make filtering configurable rather than baked in
- Framework-required literal values (Next.js `themeColor` in viewport metadata) will always be false positives in token audits — document known exceptions upfront to avoid noise in reports
- **Skipping unmet acceptance criteria without follow-up**: Visual regression baselines were an explicit AC but silently dropped — unmet criteria should block success status or generate a tracked follow-up issue
- **Over-trusting "mechanical" changes**: Labeling token migration as "token-for-token with no behavioral changes" led to skipping verification, yet review found gradient collapse and semantic color mismatches — never assume CSS changes are safe without visual confirmation
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
3. Commit with: git commit -m "feat: Replace hardcoded tokens — batch 3 (showcase apps) (closes #70)"