## Architecture
- **Turbo monorepo** (pnpm@9.15.4) — `apps/web` is a Next.js 16 (App Router) app; shared logic lives in `packages/`
- **Entry point**: `apps/web/app/` — Next.js App Router; all pages/routes live here
- **Database**: Supabase via `@repo/db` (supabase-js + ssr); client/server helpers exported from `packages/db/src/`
- **Packages**: `@repo/ui` (Radix UI components), `@repo/auth` (Auth0/NextAuth), `@repo/billing`, `@repo/theme`, `@repo/test-utils`, `@repo/config` (shared ESLint/TS/Prettier)
- **Routing**: Wildcard subdomain routing via Vercel (`<app-name>.adam-harris.alphaclaw.app`)

## Conventions
- **TypeScript + React 19**, TailwindCSS 4, Next.js App Router patterns throughout
- **Tests**: Vitest with `globals: true`; setup in `apps/web/vitest.setup.ts`; run via `pnpm test` (Turbo orchestrated)
- **New UI components** → `packages/ui/src/`; export from package index and import as `@repo/ui`
- **New DB queries** → use Supabase client from `@repo/db`; separate server/client imports
- **Shared configs** extend from `@repo/config` (tsconfig, eslint, prettier)

## Critical Rules
- `pnpm-workspace.yaml` + `turbo.json` must stay in sync if adding new packages — Turbo pipeline breaks otherwise
- `packages/db/src/` is shared across auth and billing — changes affect both
- `@repo/auth` wraps Auth0 via NextAuth; modifying session shape or callbacks breaks all auth-dependent pages
- Style kit from marketing site is the **default design language** for all apps (per project memory)

## Active State
- **Test status**: (will be filled in by the loop)
- **Recent changes**: Recent commits show Playwright/alpha-loop tooling added; new `.claude/skills/` (code-review, git-workflow, security-analysis, testing-patterns, etc.); several old skills deleted; `.gitignore` updated
