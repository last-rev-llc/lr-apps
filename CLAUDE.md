<!-- managed by alpha-loop -->

## Overview

`lr-apps` is a Turborepo monorepo that hosts ~28 small apps under one Next.js App Router deployment (`apps/web`). Subdomain-based routing is implemented in `apps/web/proxy.ts`: `<slug>.lastrev.com` is rewritten to `/apps/<routeGroup>/...`, and `auth.lastrev.com` is the central auth hub. The proxy merges Auth0 v4 middleware cookies/headers with the rewrite response via `mergeAuthMiddlewareResponse`, then layers CSP, rate limiting, and CSRF on top. App metadata (slug, subdomain, route group, tier, gating) lives in `apps/web/lib/app-registry.ts` and is the single source of truth consumed by both the proxy and per-app layouts.

## Tech Stack

- **Runtime / build:** pnpm 9.15.4, Turbo 2, Node 22, TypeScript 5
- **Web:** Next 16 (App Router, Turbopack dev), React 19, Tailwind 4 (`@tailwindcss/postcss`)
- **Auth:** `@auth0/nextjs-auth0` v4 (per-host client via `getAuth0ClientForHost`)
- **Data:** Supabase (`@supabase/supabase-js` v2, `@supabase/ssr` v0.6) with separate browser/server/service-role clients; Upstash Redis for runtime cache and rate limits
- **Billing:** Stripe v17 via `@repo/billing`
- **Email:** Resend v4 via `@repo/email`
- **UI:** `@repo/ui` (Radix primitives + CVA + lucide); design tokens from `@repo/theme` CSS
- **Observability:** Sentry 10 (`sentry.{client,server,edge}.config.ts`, `instrumentation*.ts`), OpenTelemetry SDK (`lib/otel.ts`, `lib/otel-sdk.ts`)
- **Tests / quality:** Vitest 3, Playwright 1, ESLint 9, `punchlist-qa` (runs alongside `dev`)

## Directory Structure

```
apps/web/
  proxy.ts                       # Subdomain routing + Auth0 + CSP + CSRF + rate limit
  next.config.ts, vercel.json
  instrumentation.ts, instrumentation-client.ts, sentry.*.config.ts
  app/
    layout.tsx, page.tsx, global-error.tsx, not-found.tsx, globals.css
    (auth)/                      # Auth hub on auth.lastrev.com
      layout.tsx
      (dashboard)/account, (dashboard)/my-apps
      (forms)/login, (forms)/signup, (forms)/unauthorized
    apps/<slug>/                 # 28 apps (accounts, client-health, command-center, sentiment, ...)
    api/                         # checkout, cron, health, vitals, webhooks
    checkout/, pricing/
  lib/                           # Shared web-app helpers (see lib-listing below)
  components/                    # Web-only components (mini-header, UpgradePrompt, ...)
  __tests__/, tests/             # Vitest unit tests + Playwright e2e
packages/
  auth/        # Auth0 factory, merge middleware, requireAccess, self-enroll, AuthProvider
  billing/     # Stripe client, customers, subscriptions, has-feature-access, webhook handler
  config/      # Shared tsconfig (base, nextjs), eslint, prettier
  db/          # Supabase clients (browser/server/service-role), middleware, audit, cache
  email/       # Resend send + templates
  logger/      # Sentry-aware structured logger
  storage/     # Supabase storage helpers
  test-utils/  # Shared Vitest/RTL helpers
  theme/       # Tailwind v4 CSS bundles (theme/globals/landing/components)
  ui/          # Radix-based component library
supabase/migrations/             # Append-only SQL migrations (paired up.sql/down.sql)
scripts/                         # create-app, db-rollback, db-seed, audit-tokens, sync checks
```

`apps/web/lib/` files (kept in sync with reality by `scripts/check-claude-md-lib-sync.ts` — `pnpm lint` will fail if this list drifts):

<!-- lib-listing:start -->
- `app-host.ts`
- `app-registry.ts`
- `auth-login-redirect.ts`
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

## Code Style

- File and directory names are **kebab-case** (`auth-login-redirect.ts`, `meeting-summaries/`). React component files in `@repo/ui` use `kebab-case.tsx` and export PascalCase symbols.
- Imports: cross-package via `@repo/<name>` (or its named subpath exports — e.g. `@repo/db/server`, `@repo/auth/auth0-factory`); within `apps/web` use the `@/*` alias.
- TypeScript everywhere, ESM (`"type": "module"`), no default exports for shared utilities. Validate API/server inputs with `zod`.
- Supabase: never import the service-role client outside server code (`@repo/db/service-role` is server-only). Use `@repo/db/server` from Server Components / route handlers, `@repo/db/client` from Client Components.
- Styling: Tailwind v4 utilities + tokens from `@repo/theme`. **No hardcoded colors or hex values** in components — `scripts/audit-tokens.ts` flags violations. Compose `cn()` from `@repo/ui/lib/utils`.
- Logging via `@repo/logger` (which routes to Sentry when available); never `console.log` in production code paths. Wrap meaningful server work in `withSpan` from `lib/otel.ts`.

## Non-Negotiables

- **`apps/web/lib/app-registry.ts` is the source of truth** for every app's slug, subdomain, route group, tier, permission, public routes, and post-enroll path. Add new apps via `pnpm create-app`; do not hand-edit routing in `proxy.ts` or duplicate this metadata.
- **The proxy contract:** every response returned from `apps/web/proxy.ts` must (a) start from the `auth0.middleware(request)` response so Auth0 cookies/headers survive, merging app responses via `mergeAuthMiddlewareResponse`, (b) be wrapped with `applyCspHeader`, and (c) preserve/refresh the CSRF cookie via `ensureCsrfCookie` for non-auth paths. Use `getAuth0ClientForHost(host)` — never construct an Auth0 client directly, since allowed base URLs are host-derived.
- **App-level access gating** must go through `requireAppLayoutAccess` (in `lib/require-app-layout-access.ts`) from each app's `layout.tsx`. Tier checks come from `lib/tier-config.ts` + `@repo/billing/has-feature-access`; do not reimplement.
- **Environment variables** must be declared in `turbo.json` `globalEnv` (otherwise Turbo cache poisoning) and accessed through `lib/env.ts` so they're typed and validated. Never read `process.env.X` directly in app code.
- **Database migrations are append-only.** Every migration in `supabase/migrations/` ships as a paired `*.up.sql` + `*.down.sql`; `scripts/check-migration-pairs.ts` (run by `pnpm lint`) enforces this. Never edit or delete an existing migration — write a new one. Use `pnpm db:rollback` for local revert.
- **Billing flows** go through `@repo/billing` exclusively (Stripe client, customers, subscriptions, webhook handler). Web routes under `app/api/webhooks/` and `app/api/checkout/` should be thin adapters.
- **Cron endpoints** must validate via `lib/cron-auth.ts` (`CRON_SECRET`); webhooks must validate signatures inside the package's `webhook-handler`. Rate-limit any unauthenticated POST via `lib/rate-limit.ts`.
- **Keep this file's `lib-listing` block accurate.** When adding/removing files in `apps/web/lib/`, update the bullet list above in the same change — `pnpm lint` will block otherwise.

## External Schema Dependencies

- **`sites` table is owned by [`last-rev-llc/status-pulse`](https://github.com/last-rev-llc/status-pulse)** — not this repo. We join to it by URL from `client-health` and read it directly from `uptime`. Because the schema lives in another repo, every read site **must pin the column list** (no `select("*")`) so an upstream rename or drop surfaces as an explicit PostgREST `42703` error rather than a silent join miss. The pinned list is the single export `STATUS_PULSE_SITE_COLUMNS` in `apps/web/app/apps/client-health/lib/status-pulse-schema.ts` — import from there, don't redeclare. The smoke test `apps/web/__tests__/sites-schema.test.ts` is the canary: it queries each pinned column against the live `sites` table in CI and fails loudly if one disappears.
