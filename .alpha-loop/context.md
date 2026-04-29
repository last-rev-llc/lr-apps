## Architecture
- Single Next.js 16 host at `apps/web/` routes 27+ micro-apps by subdomain via `apps/web/proxy.ts`; host header (or `?app=<slug>` in dev) selects an `AppConfig` from `apps/web/lib/app-registry.ts` to drive rewrite path, auth, and tier gate.
- Database: Supabase (Postgres) via `@supabase/supabase-js` v2; schema in `supabase/migrations/` as paired `.sql` / `.down.sql` files; service-role client is server-only (see `@repo/db`).
- Auth: Auth0 v4 (`@auth0/nextjs-auth0`) — auth hub on `auth.lastrev.com`; `getAuth0ClientForHost` + `mergeAuthMiddlewareResponse` from `@repo/auth` are merged inside `proxy.ts`.
- Apps live under `apps/web/app/apps/<slug>/`; shared route groups under `app/(auth)/`; APIs under `app/api/`; cross-cutting libs in `apps/web/lib/` (csp, csrf, rate-limit, otel, app-host, require-app-layout-access).
- Workspace packages: `@repo/auth`, `@repo/billing` (Stripe), `@repo/db`, `@repo/ui`, `@repo/theme`, `@repo/config`, `@repo/test-utils`, `@repo/email`, `@repo/logger`, `@repo/storage`.

## Conventions
- TypeScript 5, React 19, Next 16 (App Router, Turbopack), Tailwind 4, Auth0 v4, Stripe, Supabase v2; pnpm 9 workspaces, Turbo 2.
- File naming kebab-case; aliases `@repo/*` (workspace pkgs) and `@/*` (web app); ESLint 9 flat config.
- Tests: Vitest 3 unit (`apps/web/__tests__/`, `apps/web/vitest.config.ts`, `vitest.workspace.ts`) — `pnpm test`; Playwright 1 e2e (`apps/web/tests/`, `playwright.config.ts`) — `pnpm --filter @repo/web test:e2e`.
- New app: add `AppConfig` to `apps/web/lib/app-registry.ts`, create `apps/web/app/apps/<slug>/` matching `routeGroup`, gate pages with `requireAppLayoutAccess` from `apps/web/lib/`.
- Migrations are append-only and require a paired `.down.sql` (CI enforces via `scripts/check-migration-pairs.ts`).

## Critical Rules
- `apps/web/lib/app-registry.ts` is the single source of truth — registry, route group, and gating must stay aligned.
- `proxy.ts` must merge Auth0 middleware via `mergeAuthMiddlewareResponse` and resolve hosts via `getAuth0ClientForHost`; do not bypass CSP / CSRF / rate-limit wrappers.
- All env vars consumed by the app must be listed in `turbo.json` `globalEnv` or Turbo will not pass them through.
- Never commit a migration without its `.down.sql`; never call the Supabase service-role key from client code.
- Billing flows go through `@repo/billing`; do not hardcode Stripe price IDs or theme colors (use `@repo/theme`).

## Active State
- Test status: (will be filled in by the loop)
- Recent changes: (will be filled in by the loop)
