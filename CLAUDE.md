<!-- managed by alpha-loop -->

# Overview

`lr-apps` is a pnpm/Turborepo monorepo that hosts a fleet of small, internal Last Rev tools (Sentiment, Lighthouse, Standup, Sales, Ideas, Sprint Planning, Meme Generator, etc.) under one Next.js 16 App Router app at `apps/web`. Each tool is a tenant subdomain (`<sub>.apps.lastrev.com`) that the platform's Routing Middleware (`apps/web/proxy.ts`) maps to a route group under `apps/web/app/apps/<slug>/`. A single registry (`apps/web/lib/app-registry.ts`) is the source of truth for slugs, subdomains, route groups, billing tier, public routes, and per-feature tier overrides. Auth is Auth0 (per-product OIDC client picked by host), data is Supabase Postgres, and billing is Stripe (subscription tiers `free`/`pro`/`enterprise` plus per-feature gates).

# Tech Stack

- **Runtime / build**: Node 24+, pnpm 9.15.4, Turbo 2.9, TypeScript 5.
- **Framework**: Next 16.2 (App Router, Turbopack dev), React 19, Tailwind 4 + PostCSS, `geist` fonts.
- **Auth**: `@auth0/nextjs-auth0` v4 — multi-product clients selected per host via `getAuth0ClientForHost` in `@repo/auth/auth0-factory`.
- **Data**: Supabase JS v2 (`@supabase/supabase-js`), local dev via `supabase` CLI; migrations in `supabase/migrations/` (paired `.sql` + `.down.sql`).
- **Billing**: Stripe v17 in `@repo/billing` (subscriptions, customer portal, webhook handler, feature flags).
- **AI**: AI SDK v6 (`ai`) with `@ai-sdk/anthropic`. Prefer the `provider/model` string form via the gateway when not given explicit provider wiring.
- **Observability**: `@sentry/nextjs` 10, `@opentelemetry/sdk-node` 0.216 (custom SDK in `apps/web/lib/otel-sdk.ts`, `withSpan` helper in `otel.ts`).
- **Caching / rate limit**: Upstash Redis (`UPSTASH_REDIS_REST_*`) via `apps/web/lib/rate-limit.ts`.
- **Testing**: Vitest 4 (workspace at `vitest.workspace.ts`), Playwright 1 (`test:e2e`, `test:mobile`, `test:a11y`), `@axe-core/playwright`.
- **Email**: Resend via `@repo/email`. **Analytics**: PostHog via `@repo/analytics`.

# Directory Structure

```
apps/web/                        the only app — all tenants live here
  app/                           App Router
    (auth)/                      auth hub route group (login/callback/logout)
    apps/<slug>/                 one folder per tenant tool, matches registry routeGroup
    api/                         shared API routes (webhooks, crons, health)
    pricing/  checkout/          billing surfaces
  lib/                           platform glue — see listing below
  proxy.ts                       Routing Middleware: CSRF, CSP nonce, rate limit, Auth0, subdomain rewrite
  instrumentation.ts             Sentry + OTel boot
  sentry.{client,server,edge}.config.ts
  next.config.ts  vercel.json    deployment config
packages/                        all published as @repo/* with subpath exports
  analytics/  auth/  billing/  config/  db/  email/  logger/  storage/  test-utils/  theme/  ui/
supabase/
  migrations/                    every <name>.sql MUST ship with <name>.down.sql
  seed.sql  config.toml
scripts/                         create-app, db-rollback, db-seed, lint guards
```

`apps/web/lib/` (kept in sync by `scripts/check-claude-md-lib-sync.ts` — edit both together):

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

# Code Style

- **Modules**: ESM only (`"type": "module"`); workspace packages imported as `@repo/<pkg>` and consumed through declared subpath exports (e.g. `@repo/auth/server`, `@repo/auth/auth0-factory`, `@repo/analytics/server`). Do not deep-import past an export entry.
- **TypeScript**: strict; prefer `import type` for types-only imports. No `any` in new code — use `unknown` + narrowing or zod (`zod` v4 is available).
- **React**: Server Components by default. Mark client boundaries explicitly with `"use client"`. Co-locate route-specific components under the route folder; share cross-app primitives via `@repo/ui`.
- **Styling**: Tailwind 4 utility classes; design tokens come from `@repo/theme`. Don't introduce ad-hoc CSS files outside `app/globals.css`.
- **Server work**: wrap meaningful spans with `withSpan(name, attrs, fn)` from `apps/web/lib/otel.ts`. Use `@repo/logger` instead of `console.*` in shipped code.
- **Validation**: validate every external boundary (request body, query, webhook payload) with zod via `apps/web/lib/validate-request.ts`. Trust internal callers.
- **Comments**: only when the *why* isn't obvious. Don't restate what the code says or reference task IDs.
- **Env access**: never read `process.env` directly in app code — go through `apps/web/lib/env.ts` or the relevant `@repo/<pkg>` config so the value is typed and audited.

# Non-Negotiables

- **Registry is the source of truth.** Adding, renaming, or re-tiering an app means editing `apps/web/lib/app-registry.ts` first; route groups under `app/apps/<slug>/` must match `routeGroup`. Use `pnpm create-app` for new tenants.
- **Layout gate.** Every tenant layout calls `requireAppLayoutAccess(slug, pathname)` (from `apps/web/lib/require-app-layout-access.ts`). Public access only via `publicRoutes` declared in the registry — never by skipping the gate.
- **Auth client per host.** Server code that needs an Auth0 client must call `getAuth0ClientForHost()` from `@repo/auth/auth0-factory`. Do not instantiate `Auth0Client` directly — multi-tenant routing depends on host-keyed selection.
- **Routing Middleware is single-source.** All cross-cutting request handling (CSRF, CSP nonce, rate limit, Auth0, subdomain → route-group rewrite) lives in `apps/web/proxy.ts`. Don't duplicate these in route handlers.
- **Billing gates layer.** Tier check (`tier-config.ts` / `enforce-feature-tier.ts`) → permission check (`@repo/auth/server`) → handler. Per-feature overrides go in the registry's `features` map; do not hard-code tier strings in route code.
- **Migrations are append-only and paired.** Every `supabase/migrations/<name>.sql` ships with `<name>.down.sql`. `scripts/check-migration-pairs.ts` enforces this in `pnpm lint`. Never edit a merged migration — write a new one.
- **Webhook signatures are mandatory.** Stripe and other webhook routes must verify the signature header before doing any work; rely on `@repo/billing/webhook-handler` for Stripe, don't roll your own.
- **`turbo.json#globalEnv` is the env contract.** Adding a new env var means adding it there too, otherwise Turbo cache will silently miss it across workspaces.
- **`apps/web/lib/` listing stays synced.** Both lints (`check-claude-md-lib-sync.ts`, `check-migration-pairs.ts`) run as part of `pnpm lint` and must stay green. Update the listing above in the same commit when you add/remove a file in `apps/web/lib/`.
- **Per-package subpath exports.** When extending a `@repo/*` package, add the new public entrypoint to its `package.json#exports` rather than relying on consumers to deep-import.
