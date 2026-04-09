Implement GitHub issue #69: Replace hardcoded tokens — batch 2 (consumer apps)

## Summary
Replace inline color values with Tailwind theme token classes across consumer apps: Dad Joke, Cringe Rizzler, Generations, Slang Translator, HSPT Practice, HSPT Tutor, Proper Wine Pour, Roblox Dances, Soccer Training, Age of Apes.

## Acceptance Criteria
- [ ] No hardcoded hex/rgb/oklch color values in any listed app
- [ ] All colors reference theme tokens
- [ ] Visual regression baseline snapshot per app
- [ ] Existing functionality preserved


## Implementation Plan
Follow the batch 1 pattern (commit 3dc5db8): replace inline hex/rgb values with var(--color-*) CSS custom properties, and Tailwind hardcoded color classes with theme token classes.

Token mapping for common colors:
- #f59e0b / amber → var(--color-accent) or accent
- #ec4899 / pink → var(--color-pill-6) or pill-6
- #a855f7 / purple → var(--color-pill-0) or pill-0
- #22c55e / green → var(--color-green) or green
- #ef4444 / red → var(--color-red) or red
- #3b82f6 / blue → var(--color-blue) or blue
- #f97316 / orange → var(--color-orange) or orange
- #06b6d4 / cyan → var(--color-pill-7) or pill-7
- #8b5cf6 / violet → var(--color-pill-8) or pill-8
- #10b981 / emerald → var(--color-green) or green
- #eab308 / yellow → var(--color-yellow) or yellow
- #94a3b8 / slate → var(--color-slate) or slate
- #6b7280 / gray → var(--color-slate-dim) or slate-dim
- rgba(0,0,0,*) / rgba(255,255,255,*) → use Tailwind opacity modifiers on black/white or surface tokens
- #888 / #aaa / #666 → var(--color-slate-dim) or var(--color-slate)

App-specific notes:

Step 1 — Simple layout-only apps (themeColor metadata):
- dad-joke-of-the-day/layout.tsx: #f59e0b → var(--color-accent)
- roblox-dances/layout.tsx: #EC4899 → var(--color-pill-6)
- soccer-training/layout.tsx: #22c55e → var(--color-green)
- hspt-practice/layout.tsx: #4F46E5 → var(--color-pill-0) (indigo → closest pill)
- hspt-tutor/layout.tsx: #10B981 → var(--color-green)
- age-of-apes/layout.tsx: #F59E0B → var(--color-accent)

Step 2 — Moderate apps (layout + data/config colors):
- age-of-apes/lib/calculators.ts: Replace 7 calculator color hex values with var(--color-*) tokens using pill palette for category differentiation.
- generations/lib/generations.ts: Replace 6 generation color hex values with pill palette tokens.
- generations/components/slang-dictionary.tsx: Replace 4 status colors with semantic tokens (green/cyan/yellow/red).
- generations/components/slang-quiz.tsx: Replace 3 score-indicator colors (green/yellow/red) with semantic tokens.

Step 3 — Heavy apps (many inline styles + gradients):
- cringe-rizzler/layout.tsx: Replace themeColor + gradient background hex values with theme tokens. Use var(--color-navy-950) for dark bg, var(--gradient-navy) for gradients.
- cringe-rizzler/about/page.tsx: Replace ~20 hex values across category indicators, gradients, and box-shadows with pill palette and accent tokens.
- cringe-rizzler/components/cringe-app.tsx: Replace ~25+ hex values: status colors → semantic tokens, neon palette → pill tokens, gradients → var(--gradient-*), rgba box-shadows → shadow tokens, #0d0d1a → var(--color-navy-950), #ffffff/#000000 → white/black Tailwind.
- slang-translator/components/slang-app.tsx: Replace ~15 hex values: status colors → semantic, category colors → pill palette, #6b7280 → var(--color-slate-dim).
- hspt-practice/components/practice-app.tsx: Replace section colors with pill tokens, rgba overlays with surface/opacity tokens, #888/#aaa → var(--color-slate-dim)/var(--color-slate).
- hspt-tutor/components/tutor-app.tsx: Replace section colors with pill tokens (matching hspt-practice), status indicators with semantic tokens, rgba overlays with surface tokens.
- proper-wine-pour/layout.tsx: Replace #722F37 themeColor and #e74c6f accent. May need a new app-specific token or use closest pill.
- proper-wine-pour/page.tsx: Replace #e74c6f accent reference.
- proper-wine-pour/about/page.tsx: Replace ~8 hex values (wine red #722F37, accent #e74c6f, rgba backgrounds).
- proper-wine-pour/components/wine-app.tsx: Heaviest file — replace ~20+ hex values: #722F37 wine-red → app accent token, #e74c6f → accent variant, pour-level colors (green/yellow/orange/red) → semantic tokens, #666 → slate-dim, rgba overlays → surface tokens, gold #e8d44d/#f0e68c → accent variants.

Step 4 — Verify no remaining hardcoded colors:
- Run grep across all 10 app directories for hex/rgb/rgba/oklch/hsl patterns.
- Confirm zero violations (excluding content strings like meme templates if any).


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
3. Commit with: git commit -m "feat: Replace hardcoded tokens — batch 2 (consumer apps) (closes #69)"