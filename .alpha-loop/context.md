## Architecture
- **Single Next.js 16 host** at `apps/web/` routes multi-tenant apps by subdomain. `proxy.ts` resolves the host via `lib/proxy-utils.ts`, looks up the app in `lib/app-registry.ts`, and rewrites to `app/<routeGroup>/...` while merging Auth0 middleware from `@repo/auth`.
- **Dev shortcut**: `?app=<subdomain>` query param in dev mode bypasses subdomain resolution (proxy.ts:22-38).
- **Database**: Supabase (Postgres) with migrations in `supabase/migrations/` (append-only, numbered + date-prefixed). Client helpers in `packages/db/src/`: `client.ts` (browser), `server.ts` (SSR), `service-role.ts` (server-only), `queries.ts`, `types.ts`.
- **Key directories**: `apps/web/app/` (route groups `(auth)`, `apps/<slug>/`, `api/`, `checkout/`, `pricing/`), `apps/web/lib/` (host/proxy/access helpers, `tier-config.ts`), `packages/` (`auth`, `billing`, `db`, `ui`, `theme`, `config`, `test-utils`).

## Conventions
- **Stack**: pnpm workspaces + Turbo, Next 16 (turbopack dev), React 19, TS 5, Auth0 v4, Supabase v2, Stripe, Tailwind 4, Vitest, Playwright, ESLint 9, punchlist-qa.
- **Imports**: workspace packages as `@repo/*`, local app files as `@/*`. Files use kebab-case.
- **Tests**: Vitest unit tests via workspace (`vitest.workspace.ts`), colocated in `__tests__/` dirs. E2E via Playwright (`apps/web/playwright.config.ts`). Run `pnpm test` (turbo), `pnpm --filter @repo/web test:e2e` for E2E.
- **Wiring a new app**: add an `AppConfig` entry to `apps/web/lib/app-registry.ts`, create `apps/web/app/apps/<slug>/` matching its `routeGroup`, and gate pages with `requireAppLayoutAccess` from `apps/web/lib/`.

## Critical Rules
- **`app-registry.ts` is the single source of truth** for subdomain→route mapping, auth, tier, and public routes. Adding routes without a registry entry leaves them unreachable via subdomain.
- **Auth middleware must be merged** via `mergeAuthMiddlewareResponse` — don't return bare `NextResponse` from proxy logic or you drop session cookies.
- **Service-role client is server-only** (`packages/db/src/service-role.ts`). Never import from client components.
- **Migrations are append-only** — never edit or delete files in `supabase/migrations/`.
- **New env vars** must be added to `turbo.json` `globalEnv` or they won't reach tasks.
- **No hardcoded hex colors** — use tokens from `@repo/theme` (enforced by `scripts/audit-tokens.ts`).

## Active State
- Test status: (will be filled in by the loop)
- Recent changes: (will be filled in by the loop)
