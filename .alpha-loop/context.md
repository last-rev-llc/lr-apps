Here's the project context:

---

## Architecture
- **Single Next.js 16 host** at `apps/web/` serves 27 micro-apps via subdomain routing. `proxy.ts` resolves subdomains → rewrites to `app/apps/<name>/` routes. In dev, `?app=<name>` query param simulates subdomains.
- **Auth**: Auth0 via `@repo/auth` package; all app routes sit under `app/(auth)/` layout group. `proxy.ts` runs Auth0 middleware on every request and merges auth headers into rewrites.
- **Database**: Supabase Postgres. Migrations in `supabase/migrations/` (001–002 so far). All DB access goes through `@repo/db` helpers — never raw Supabase client in components.
- **Billing**: Stripe via `@repo/billing`. Apps must check entitlements before rendering paid features.
- **Packages**: `auth`, `billing`, `db`, `ui` (~47 components), `theme` (tokens + globals.css), `config` (ESLint/TS/Prettier), `test-utils`.

## Conventions
- **Imports**: Always `@repo/<pkg>` for cross-package imports, never relative paths across boundaries.
- **App pattern**: Each micro-app is a directory under `apps/web/app/apps/<name>/` with `page.tsx`, `components/`, and `lib/` (queries, utils). Server Components by default; `'use client'` only when needed.
- **Tests**: Vitest 3 with workspace config (`apps/*`, `packages/*`). Run `pnpm test` (delegates to Turbo). Co-locate test files next to source.
- **Styling**: Tailwind 4 utility classes + `@repo/theme` design tokens. Marketing site style-kit is the baseline design language.
- **Dev**: `pnpm dev` runs Turbopack + punchlist-qa overlay. Access apps via `localhost:3000?app=<name>`.

## Critical Rules
- **Never add new apps outside `apps/web/`** — single deployable constraint. New micro-apps go in `app/apps/<name>/`.
- **`turbo.json` globalEnv** must list any new env var or Turbo cache invalidation breaks silently.
- **`proxy.ts` not `middleware.ts`** — this is the Next.js 16 pattern; middleware.ts is not used.
- **Stripe secrets server-only** — only `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` can reach the browser. `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` stay in server code.
- **Auth + Billing are mandatory** — every new app route must be under `(auth)` layout and check billing entitlements. Skipping either is a ship-blocker.

## Active State
- **Test status**: _(to be filled by loop)_
- **Recent changes**: Component migrations (Daily Updates, Cringe Rizzler, Slang Translator) and app-specific tests — batch 2 mid-tier work on current branch.
