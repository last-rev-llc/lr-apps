Implement GitHub issue #10: Standardize glass/shadow/animation usage

## Summary
Replace inline glass effects, shadows, and animations with shared theme utilities across all apps.

## Acceptance Criteria
- [ ] All inline glass effects replaced with `glass`, `glass-sm`, `glass-strong` utilities
- [ ] All inline shadows replaced with theme shadow tokens (`shadow-glass`, `shadow-glass-sm`, `shadow-glow`)
- [ ] All inline animations replaced with `animate-fade-in-up`, `animate-scale-in` utilities
- [ ] No duplicate glass/shadow/animation definitions remain in app-level CSS
- [ ] Build passes with no TypeScript errors


## Implementation Plan
Step 1 — Extend theme utilities in packages/theme/src/globals.css:
  - Add @utility glass-header { background-color: oklch(from var(--color-bg) l c h / 0.85); backdrop-filter: blur(12px); border-bottom: 1px solid var(--color-surface-border); } for sticky header glass pattern (used in ~10 layouts).
  - Add @utility glass-input { background: rgba(0,0,0,0.2); border: 1px solid var(--color-surface-border); border-radius: var(--radius-glass); } for the recurring bg-black/20 border-white/10 input pattern (wine-app, command-center forms).
  - Add @utility glass-overlay { background: oklch(0% 0 0 / 0.6); backdrop-filter: blur(4px); } for modal backdrops.
  - Add shadow tokens to theme.css: --shadow-glass-hover-strong: 0 8px 32px oklch(0% 0 0 / 0.4); --shadow-glow-accent-sm: 0 8px 32px rgba(245,158,11,0.12); --shadow-lightbox: 0 0 60px rgba(0,0,0,0.5).
  - Add @utility animate-cc-pop for the empty-state bounce animation.
  - Move confetti-fall keyframes to globals.css shared keyframes (already partially there, normalize).
  - Move typewriter blink keyframes (tw-blink) to globals.css.

Step 2 — Replace inline shadows in packages/ui components:
  - media-card.tsx: Replace hover:shadow-[0_8px_32px_rgba(245,158,11,0.12)] with hover:shadow-glow-accent-sm (new token).
  - lightbox.tsx: Replace shadow-[0_0_60px_rgba(0,0,0,0.5)] with shadow-lightbox (new token).
  - filter-drawer.tsx: Replace shadow-[-4px_0_30px_rgba(0,0,0,0.5)] with shadow-glass token.
  - pricing.tsx: Replace shadow-[0_0_24px_rgba(245,158,11,0.15)] with shadow-glow-accent or new token.
  - travel-app.tsx: Replace hover:shadow-[0_8px_32px_oklch(0%_0_0/0.4)] with hover:shadow-glass.

Step 3 — Replace inline glass patterns in app layouts (batch by pattern):
  - Headers using 'bg-background/80 backdrop-blur-sm' or 'bg-background/85 backdrop-blur-md': Replace with glass-header utility in: dad-joke layout, hspt-practice layout, hspt-tutor layout, soccer-training layout, roblox-dances layout, travel-collection layout, age-of-apes layout, command-center layout, superstars layout, cringe-rizzler layout, last-rev-mini-header.
  - Cards using 'bg-white/5 border-white/10 backdrop-blur-sm': Replace with glass-sm in: joke-viewer, dad-joke about, cringe-app, cringe about, hspt-practice-app, hspt-tutor-app, soccer-training page, superstars person-profile, roblox-dances dance-app, alpha-wins wins-gallery.
  - Modal overlays using 'bg-black/60 backdrop-blur-sm': Replace with glass-overlay in: slang-app, roblox-dances dance-app, soccer-training drill-library.
  - Form inputs using 'bg-black/20 border border-white/10': Replace with glass-input in: wine-app (10+ inputs), command-center form fields.

Step 4 — Replace inline animations:
  - confetti.tsx: Remove inline <style> block with @keyframes confetti-fall, reference shared keyframes from globals.css.
  - typewriter.tsx: Remove inline <style> block with @keyframes tw-blink, reference shared keyframes.
  - empty-state.tsx: Replace animate-[cc-es-pop_0.5s_cubic-bezier(0.34,1.56,0.64,1)_both] with animate-cc-pop utility.
  - superstars/person-profile.tsx: Extract hero-glow and marquee keyframes from inline <style> to globals.css.
  - brommie-quake/page.tsx: This app has 15+ unique keyframes in inline <style>. These are app-specific (earthquake themed) — extract to a brommie-quake.css file imported only by that app, NOT to shared globals. This prevents polluting the shared theme.

Step 5 — Verify no duplicates remain:
  - Grep for backdrop-blur-sm, backdrop-blur-md, bg-white/5.*backdrop, shadow-\[ across apps/ to confirm all replaced.
  - Grep for @keyframes in apps/ and packages/ui to confirm no inline duplicates of shared animations.

Step 6 — Build verification:
  - Run pnpm build to confirm no TypeScript errors.
  - Run pnpm lint if available.


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



## Previous Issue in This Session
- Issue #9: Audit and document token usage violations
- Status: success
- Tests: PASSING
- Files changed: 1
- Duration: 516s
- PR: https://github.com/last-rev-llc/lr-apps/pull/107

Build on what was already done. Avoid duplicating work.


## Learnings from Previous Runs

### Run #9 (success)
- Clean first-pass execution with zero test retries — the audit script worked correctly on initial run
- Code review caught dead code (unused `classifySeverity` function and 10 regex constants) and it was fixed before completion
- Comprehensive report covering all 27 apps with per-file, per-line violation detail and a reference section for available theme tokens
- Nothing — all acceptance criteria met, no retries needed


## Known Anti-Patterns to Avoid
- Hardcoded skip-lists (e.g. excluding `#fff`/`#000`) can mask real violations — make filtering configurable rather than baked in
- Framework-required literal values (Next.js `themeColor` in viewport metadata) will always be false positives in token audits — document known exceptions upfront to avoid noise in reports

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
3. Commit with: git commit -m "feat: Standardize glass/shadow/animation usage (closes #10)"