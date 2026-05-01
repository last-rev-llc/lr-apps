<!-- managed by alpha-loop -->

## Overview

`lr-apps` is a pnpm/turbo monorepo that hosts every Last Rev internal/customer app under one Next.js deployment. The single Next app at `apps/web` is multi-tenant: each app is a subdomain (e.g. `ideas.apps.lastrev.com`, `auth.lastrev.com`) routed through `apps/web/proxy.ts` (Next 16 Routing Middleware) into a route group under `apps/web/app/apps/<slug>`. Auth is centralized through an auth hub (`auth.lastrev.com`); access is gated by Auth0 + a billing tier check; Supabase is the canonical datastore.

Per-app metadata (subdomain, route group, tier, public routes, self-enroll, etc.) lives in `apps/web/lib/app-registry.ts`. Treat that file as the source of truth — `proxy.ts`, layout gates, and billing all read from it.

## Tech Stack

- **Runtime:** Node 24+, pnpm `9.15.4` (pinned in `package.json#packageManager`), turbo `^2.9`.
- **Web app:** Next.js `16.2` App Router (Turbopack dev), React 19, TypeScript 5, Tailwind 4, ESLint 10.
- **Auth:** `@auth0/nextjs-auth0` v4 with a per-host client factory (`getAuth0ClientForHost`) so each subdomain uses the correct Auth0 tenant.
- **Data:** Supabase (`@supabase/supabase-js` v2) + local Supabase CLI; migrations in `supabase/migrations/`.
- **Billing:** Stripe v17 via `@repo/billing` (customers, subscriptions, feature flags, webhook handler).
- **Email:** Resend via `@repo/email`.
- **Cache / rate limit:** Upstash Redis (`UPSTASH_REDIS_REST_URL`/`_TOKEN`).
- **Observability:** Sentry `@sentry/nextjs` 10, OpenTelemetry (`@opentelemetry/sdk-node` 0.216), PostHog (`@repo/analytics`).
- **AI:** Vercel AI SDK v6 + `@ai-sdk/anthropic`. Prefer AI Gateway (`"provider/model"` strings) over direct provider packages unless explicitly asked.
- **Testing:** Vitest 4 (unit), Playwright 1 (e2e + a11y + mobile), `@axe-core/playwright`.

## Directory Structure

- `apps/web/` — the only Next.js app. Tenants live under `app/apps/<slug>/`. Cross-cutting code under `app/(auth)/`, `app/api/`, `app/checkout/`, `app/pricing/`.
- `apps/web/proxy.ts` — Next Routing Middleware: CSRF, CSP nonce, rate limit, Auth0 session, subdomain → route-group rewrite. **All routing changes go here.**
- `apps/web/lib/` — web-app-only helpers. The list below is enforced by `scripts/check-claude-md-lib-sync.ts`; update it whenever you add/remove a file.

<!-- lib-listing:start -->
- `app-card-media.ts`
- `app-host.ts`
- `app-registry.ts`
- `auth-login-redirect.ts`
- `concurrent.ts`
- `cron-auth.ts`
- `csp.ts`
- `csrf.ts`
- `enforce-feature-tier.ts`
- `env.ts`
- `health-checks.ts`
- `otel-sdk.ts`
- `otel.ts`
- `platform-urls.ts`
- `proxy-utils.ts`
- `rate-limit.ts`
- `require-app-layout-access.ts`
- `tier-config.ts`
- `validate-request.ts`
<!-- lib-listing:end -->

- `packages/` — 11 internal workspaces (`@repo/*`):
  - `analytics` — PostHog client + capture helpers.
  - `auth` — Auth0 factory, session merge, `requireAccess`, self-enroll, permissions.
  - `billing` — Stripe client, customers, subscriptions, feature flags, webhook handler.
  - `config` — shared tsconfig/eslint config bases.
  - `db` — Supabase client + typed schema.
  - `email` — Resend client + transactional templates.
  - `logger` — structured logger used across packages.
  - `storage` — file/object storage helpers.
  - `test-utils` — vitest/playwright helpers shared across packages.
  - `theme` — design tokens.
  - `ui` — shared React components.
- `supabase/migrations/` — every `<name>.sql` MUST ship with a paired `<name>.down.sql` (enforced by `scripts/check-migration-pairs.ts`).
- `scripts/` — repo-level TS scripts (lib-sync check, migration-pair check, db rollback/seed, app scaffolder, token audit).
- `docs/` — architecture, guides, ops, and superpowers notes.

## Code Style

- ES modules everywhere (`"type": "module"`). TypeScript strict; no `any` unless justified.
- Internal imports use the `@repo/<pkg>` alias; per-package subpath exports (e.g. `@repo/auth/server`, `@repo/billing/webhook-handler`) are declared in each `package.json#exports` — use them rather than reaching into `src/`.
- Server vs client separation matters: `@repo/auth/server` is server-only; `@repo/auth/client` is the React provider.
- App pages should call `requireAppLayoutAccess(slug, pathname)` in their root layout — it handles public-route bypass via `app-registry.publicRoutes`, the auth check, and the `app_opened` analytics event.
- When adding env vars used by any workspace, add them to `turbo.json#globalEnv` so turbo includes them in the cache key.
- Wrap notable server work in `withSpan(...)` from `apps/web/lib/otel.ts` (or the per-package equivalent) for tracing.
- Migrations: append-only. Never edit a merged `.sql` file — write a new migration and its `.down.sql`.

## Non-Negotiables

- **App registry is the source of truth.** Don't hard-code subdomains, route groups, or tier requirements in routing/layout code — read from `apps/web/lib/app-registry.ts`.
- **Routing happens in `proxy.ts`.** Don't add a second middleware or shadow-route via `next.config.ts` rewrites for tenant routing.
- **Layout-level auth via `requireAppLayoutAccess`.** Don't roll a per-page `getSession()` check that bypasses the registry's public-route logic or the `app_opened` event.
- **Auth0 client per host.** Always go through `getAuth0ClientForHost(host)` — never instantiate `Auth0Client` directly; multi-tenant tenants will break.
- **`turbo.json#globalEnv` must list every env var** read at build/runtime, or turbo's cache will silently serve stale builds.
- **Migrations are append-only and paired.** `pnpm lint` runs `check-migration-pairs.ts`; missing `.down.sql` fails the build.
- **lib-listing block stays in sync.** `pnpm lint` runs `check-claude-md-lib-sync.ts` against the markers above; adding/removing a file in `apps/web/lib/` without updating the list fails the build.
- **Billing gates are layered:** app-level `tier` in the registry + per-feature overrides in `features` + `enforceFeatureTier` for fine-grained checks. Don't bypass with ad-hoc `if (user.email === ...)` checks.
- **Webhook handlers verify signatures.** Stripe webhooks go through `@repo/billing/webhook-handler` (verifies `STRIPE_WEBHOOK_SECRET`); cron endpoints use `cron-auth.ts` (`CRON_SECRET`).
