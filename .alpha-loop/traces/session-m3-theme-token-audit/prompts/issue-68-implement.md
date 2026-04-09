Implement GitHub issue #68: Replace hardcoded tokens — batch 1 (internal apps)

## Summary
Replace inline color values with Tailwind theme token classes across internal apps: Command Center, Accounts, Standup, Sprint Planning, Summaries, Daily Updates, Sentiment, Meeting Summaries, Uptime, Sales.

## Acceptance Criteria
- [ ] No hardcoded hex/rgb/oklch color values in any listed app
- [ ] All colors reference theme tokens (e.g. `bg-navy-800` not `bg-[#0f1629]`)
- [ ] Visual regression baseline snapshot per app
- [ ] Existing functionality preserved


## Implementation Plan
Token mapping (packages/theme/src/theme.css defines all tokens):
- #0f1629 / #0a0e1a → bg-navy / bg-navy-950
- #1a1b3a / #171b4e → bg-navy-900
- rgba(255,255,255,0.05-0.12) → bg-surface / bg-surface-hover / bg-surface-active
- rgba(255,255,255,0.1) borders → border-surface-border
- #f59e0b / amber → text-accent / bg-accent
- #10b981 → text-green, #f87171/#ef4444 → text-red, #f97316 → text-orange, #38bdf8/#3b82f6 → text-blue
- #a78bfa → text-neon-violet, #60a5fa → text-neon-blue, #4ade80 → text-neon-green, #f472b6 → text-neon-pink
- #7c3aed → text-pill-0, #2563eb → text-pill-1, #22c55e → text-pill-2, etc. (pill-0 through pill-9)
- rgba(0,0,0,0.3) shadows → shadow-glass / shadow-glass-sm
- Inline style backgrounds using gradients → className with gradient-navy / gradient-accent

Steps:
1. Process each file: read it, map every hardcoded color to its theme token equivalent using the mapping above.
2. For Tailwind arbitrary classes like bg-[#0f1629], replace with bg-navy. For text-[#f59e0b], replace with text-accent.
3. For inline style colors (style={{ color: '#f59e0b' }}), convert to className-based approach using theme tokens.
4. For rgba() values in inline styles (e.g. chart configs in sentiment-chart.tsx), use CSS custom properties: var(--color-green), var(--color-red), etc.
5. For colors used in JS objects (chart datasets, color arrays in daily-updates), reference CSS variables via var(--color-pill-N) or var(--color-green) etc.
6. Start with the highest-impact file (contact-detail.tsx, 42 instances) and work through command-center files, then sprint-planning, daily-updates, sentiment.
7. Run `pnpm lint` and `pnpm build` after each batch to catch regressions.
8. Six apps (accounts, standup, summaries, meeting-summaries, uptime, sales) have no hardcoded colors — no changes needed.


## Product Vision
Written to `docs/VISION.md` — 396 words covering current state, target state, strategy across the three focus areas, execution model, and guiding principles. Let me know if you'd like to adjust the tone, add anything, or trim further.



## Technical Context
Here's the project context file:

---

## Architecture
- **Entry point**: Next.js 16 App Router in `apps/web/`. Request interception via `apps/web/proxy.ts`. No `middleware.ts` — uses Next.js 16 proxy pattern instead.
- **Micro-apps**: 29+ apps live under `apps/web/app/apps/<slug>/`, each with its own `layout.tsx`. Auth hub is at `app/(auth)/`. No top-level API routes directory — apps handle their own API routes internally.
- **Database**: Supabase (Postgres). Client wrappers in `packages/db/src/` with separate exports: `server.ts`, `middleware.ts`, `service-role.ts`. Queries centralized in `packages/db/src/queries.ts`.
- **Auth**: Auth0 via `packages/auth/` — multi-tenant client factory (per-Host header). Permission checks in server layouts using `requireAppLayoutAccess()`.
- **Packages**: `packages/{auth,billing,db,ui,theme,config,test-utils}` — imported as `@repo/*` workspace aliases. UI has 80+ Radix+Tailwind components.

## Conventions
- TypeScript strict ESM. Server Components by default; `'use client'` only when needed. Tailwind 4 with oklch theme tokens from `packages/theme/`.
- Tests via Vitest (`pnpm test` / `turbo run test`). Test utils in `packages/test-utils/`.
- **Adding a new app**: Register in `apps/web/lib/app-registry.ts` (slug, subdomain, auth, tier, permissions), then create `apps/web/app/apps/<slug>/layout.tsx` with `requireAppLayoutAccess()` for gated apps. Use `publicRoutes` array for hybrid public/gated apps.
- Import from package sub-paths (`@repo/auth/server`, `@repo/db/middleware`) — never from `src/` directly.

## Critical Rules
- **`app-registry.ts` is source of truth** — app routing, access control, and subdomain mapping all derive from it. An unregistered app doesn't exist.
- **Supabase client separation is load-bearing** — `server.ts` for RSC/actions, `middleware.ts` for proxy, `service-role.ts` for admin only. Mixing breaks sessions.
- **Auth0 client must be per-request** (factory pattern via Host header) — never a global singleton.
- **`packages/theme/src/theme.css`** owns all design tokens via `@theme` directive — not tailwind.config files.
- **Never import server-only code into client bundles** — sub-path exports enforce this boundary.

## Active State
- **Test status**: _(pending — run `pnpm test`)_
- **Recent changes**: Billing metadata added to app registry (#11, #5 merged). Main branch has untracked `CLAUDE.md`, `docs/VISION.md`, `.alpha-loop/` files.



## Learnings from Previous Runs

### Run #9 (success)
- Clean first-pass execution with zero test retries — the audit script worked correctly on initial run
- Code review caught dead code (unused `classifySeverity` function and 10 regex constants) and it was fixed before completion
- Comprehensive report covering all 27 apps with per-file, per-line violation detail and a reference section for available theme tokens
- Nothing — all acceptance criteria met, no retries needed

### Run #10 (success)
- Shared utility approach (glass, glass-sm, glass-strong, glass-header, shadow tokens, animation utilities) cleanly replaced scattered inline definitions across apps
- All 8 packages passed tests (106 total) with zero retries needed
- Tooling additions (token-violations-report.md, audit-tokens.ts) provided systematic discovery of violations rather than manual grep
- Nothing — build, typecheck, and all tests passed first try


## Known Anti-Patterns to Avoid
- Hardcoded skip-lists (e.g. excluding `#fff`/`#000`) can mask real violations — make filtering configurable rather than baked in
- Framework-required literal values (Next.js `themeColor` in viewport metadata) will always be false positives in token audits — document known exceptions upfront to avoid noise in reports
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
3. Commit with: git commit -m "feat: Replace hardcoded tokens — batch 1 (internal apps) (closes #68)"