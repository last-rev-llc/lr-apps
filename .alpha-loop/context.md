## Architecture
- Single Next.js 16 host (`apps/web/`) with `proxy.ts` (Routing Middleware) dispatching 29 micro-apps by subdomain via `apps/web/lib/app-registry.ts` → `app/apps/<slug>/` route groups.
- Database: Supabase (Postgres). Migrations in `supabase/migrations/` as paired `NNN_<name>.sql` + `NNN_<name>.down.sql`. Local stack via `pnpm db:local:start`. Query through `@repo/db`; service-role from server, anon from browser.
- Workspace packages (11): `@repo/{analytics, auth, billing, config, db, email, logger, storage, test-utils, theme, ui}`. Shared turbo task graph in `turbo.json` with explicit `globalEnv`.
- Auth0 v4 (`getAuth0ClientForHost` per tenant), Stripe v17 billing, Sentry 10 + OpenTelemetry 0.216 observability, Upstash Redis rate-limit/cache, Resend for email, AI SDK v6 + `@ai-sdk/anthropic`.
- Entry points: `apps/web/proxy.ts` (host routing/CSP/CSRF/rate-limit/Auth0), `apps/web/app/layout.tsx`, `apps/web/instrumentation.ts` (OTel/Sentry init), `apps/web/app/api/**` (route handlers).

## Conventions
- TypeScript strict, ESM (`"type": "module"`), Next.js 16 App Router + Turbopack, React 19, Tailwind 4, Zod 4, pnpm 9.15.4, Node 24+.
- Tests: Vitest 4 unit (`vitest.workspace.ts` aggregates), Playwright e2e in `apps/web/tests/`, a11y/mobile via `pnpm test:a11y` / `test:mobile`. Top-level: `pnpm test`, `pnpm typecheck`, `pnpm lint`.
- New app: add `AppConfig` in `apps/web/lib/app-registry.ts`, create `app/apps/<slug>/` matching `routeGroup`, gate pages with `requireAppLayoutAccess`. New env vars must be added to `turbo.json` `globalEnv`.
- Migrations are append-only and must ship with a paired `.down.sql`; `scripts/check-migration-pairs.ts` enforces this in `pnpm lint`.
- Per-package subpath exports — import from `@repo/<pkg>/<entry>` (e.g. `@repo/auth/auth0-factory`), not deep relative paths.

## Critical Rules
- Never bypass `getAuth0ClientForHost` for per-tenant Auth0 client selection or `requireAppLayoutAccess` for tier gating — these enforce multi-tenant isolation.
- Do not edit historical migrations; only add new pairs. Don't drop `.down.sql` files. Don't seed via app code — use `scripts/db-seed.ts`.
- `apps/web/proxy.ts` + `app-registry.ts` + Auth0 callback wildcards must be updated together when adding hosts; subdomain routing breaks otherwise.
- Don't add env vars without listing them in `turbo.json` `globalEnv` — turbo will silently drop them from build cache keys.
- Billing: Stripe webhook handler depends on `STRIPE_WEBHOOK_SECRET` and the `webhook_events` table for idempotency — don't refactor without preserving the dedupe path.

## Active State
- Test status: (will be filled in by the loop)
- Recent changes: (will be filled in by the loop)
