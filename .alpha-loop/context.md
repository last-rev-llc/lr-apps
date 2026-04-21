## Architecture
- Turborepo monorepo (pnpm workspaces): `apps/web` (Next.js 16 + React 19 app), `packages/{auth,billing,config,db,test-utils,theme,ui}`. Root scripts delegate via `turbo run <task>`.
- Entry point: `apps/web/proxy.ts` is the Next.js middleware — resolves subdomains via `lib/proxy-utils.ts`, applies Auth0 (`@repo/auth`), rewrites `<slug>.adam-harris.alphaclaw.app` to `app/apps/<slug>/...`. Local dev uses `?app=<slug>` query param.
- App registry: `apps/web/lib/app-registry.ts` declares every app (slug, subdomain, routeGroup, auth/permission/tier/features). Each app folder lives at `apps/web/app/apps/<slug>/`.
- Database: Supabase (Postgres). Migrations in `supabase/migrations/*.sql`. Access via `@repo/db`. Auth via Auth0 (`@repo/auth`), billing via Stripe (`@repo/billing`).
- Key dirs: `apps/web/app/api/{checkout,webhooks}` (route handlers), `apps/web/lib/` (`app-host.ts`, `app-registry.ts`, `proxy-utils.ts`, `require-app-layout-access.ts`, `tier-config.ts`, `auth-login-redirect.ts`, `platform-urls.ts`).

## Conventions
- TypeScript `^5`, Next.js 16 (Turbopack dev), React 19, Tailwind v4, ESM modules (`"type": "module"`).
- Tests: Vitest (unit) via `vitest.workspace.ts` covering `apps/*` and `packages/*`; Playwright e2e in `apps/web/tests/e2e/`. Run with `pnpm test` / `pnpm --filter @repo/web test:e2e`.
- Adding a new app: create `apps/web/app/apps/<slug>/`, register an `AppConfig` entry in `lib/app-registry.ts` (slug, subdomain, routeGroup, tier, permission), add `vercel.json` rewrite for the subdomain.
- Workspace packages import via `@repo/<name>`; internal deps declared as `workspace:*`.
- `globalEnv` in `turbo.json` is the source of truth for env vars that affect builds (Auth0, Supabase, Stripe, Playwright).

## Critical Rules
- `lib/app-registry.ts` is the single source of truth for app routing/auth/tier — `proxy.ts`, `require-app-layout-access.ts`, and billing all read it. Adding an app folder without registering it will 404.
- `proxy.ts` + `lib/proxy-utils.ts` + `app-registry.ts` must stay in sync; subdomain changes break production routing.
- `publicRoutes` patterns on `AppConfig` bypass auth — review carefully; webhook handlers under `/api/webhooks/**` must remain public.
- Supabase migrations are append-only and numbered/dated — never edit a merged migration, write a new one.
- Stripe price IDs (`STRIPE_PRICE_ID_PRO`, `STRIPE_PRICE_ID_ENTERPRISE`) and tier config in `lib/tier-config.ts` must match registry `tier` values.

## Active State
- Test status: (will be filled in by the loop)
- Recent changes: (will be filled in by the loop)
