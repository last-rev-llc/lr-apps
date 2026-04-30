<!-- managed by alpha-loop -->

# lr-apps

## Overview

Monorepo hosting 27+ micro-apps behind a single Next.js 16 host (`apps/web/`)
with shared workspace packages under `packages/`. Apps are routed by
subdomain via the registry in `apps/web/lib/app-registry.ts` and gated by
Auth0 + Supabase-backed permissions. Subscription tiers (`free`/`pro`/
`enterprise`) and per-feature overrides are enforced through `@repo/billing`
+ Stripe. Local dev uses Supabase, Playwright for E2E, and `punchlist-qa`
alongside `next dev`.

## Tech Stack

- **Runtime/build:** Node 22+, pnpm 9.15.4, Turborepo 2.x, TypeScript 5
- **Framework:** Next.js 16 (App Router, Turbopack), React 19, Tailwind 4
- **Auth:** Auth0 (`@auth0/nextjs-auth0` v4) — multi-host via `getAuth0ClientForHost`
- **Data:** Supabase (`@supabase/ssr` + `@supabase/supabase-js`); migrations in `supabase/migrations/`
- **Cache:** Upstash Redis (`@upstash/redis`) keyed by `CACHE_VERSION`
- **Billing:** Stripe v17 (`@repo/billing`), webhook handler at `app/api/webhooks/`
- **AI:** AI SDK v6 + `@ai-sdk/anthropic` (Anthropic via `ANTHROPIC_API_KEY`)
- **Email:** Resend v6 (`@repo/email`)
- **Observability:** Sentry 10 (`@sentry/nextjs`), OpenTelemetry SDK + OTLP HTTP exporter
- **Testing:** Vitest 4, Playwright 1, `@testing-library/jest-dom`, jsdom

## Directory Structure

```
apps/web/                  Single Next.js host serving all apps
  app/(auth)/              Auth hub (login, dashboard, forms) — subdomain "auth"
  app/apps/<slug>/         Per-app route groups (registry-driven)
  app/api/                 checkout, cron, health, vitals, webhooks
  components/              Cross-app shared components (cards, headers, logos)
  lib/                     Web-host helpers (see lib-listing below)
  proxy.ts                 Routing middleware: subdomain → route, CSRF, CSP, rate-limit
  instrumentation*.ts      OpenTelemetry + Sentry init
packages/
  analytics/  @repo/analytics — server/client/backend capture wrappers
  auth/       @repo/auth — Auth0 factory, requireAccess, self-enroll
  billing/    @repo/billing — Stripe client, customers, subscriptions, feature flags
  config/     @repo/config — shared tsconfig/eslint
  db/         @repo/db — Supabase server/client/middleware, cache, audit
  email/      @repo/email — Resend wrapper + templates
  logger/     @repo/logger — structured logging
  storage/    @repo/storage — file/blob helpers
  test-utils/ @repo/test-utils — shared vitest fixtures
  theme/      @repo/theme — design tokens (enforced by audit:tokens)
  ui/         @repo/ui — shared React UI components
supabase/migrations/       Append-only SQL; every X.sql needs X.down.sql
scripts/                   create-app, db-rollback, db-seed, lint checkers
docs/                      Operational/architecture docs
```

`apps/web/lib/` contents (kept in sync with `scripts/check-claude-md-lib-sync.ts`):

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

## Code Style

- TypeScript strict; ESM (`"type": "module"`); no default exports for utilities.
- Prefer named workspace subpath imports (e.g. `@repo/auth/server`,
  `@repo/db/cache`). Do not deep-import package internals.
- Server-only modules must not be imported from client components — respect
  `@repo/db/server` vs `@repo/db/client` and `@repo/auth/server` vs `/client`.
- Tailwind-first styling; design tokens come from `@repo/theme`. Hardcoded
  colors fail `pnpm audit:tokens`.
- Comments only for non-obvious *why* (security invariants, ordering quirks).
  Don't restate code. Don't reference task/PR numbers in source.
- Schemas validated with Zod v4 at trust boundaries (route handlers,
  webhooks, server actions).

## Non-Negotiables

1. **Registry is the source of truth** for routing, auth, tier, and public
   routes. Add new apps via `pnpm create-app <slug>`; never hand-edit a
   route group without an `app-registry.ts` entry.
2. **`requireAppLayoutAccess(slug, pathname)`** must wrap every gated app
   layout. Public routes go through `publicRoutes` in the registry — do
   not bypass the helper.
3. **Auth0 host resolution** must use `getAuth0ClientForHost(...)` from
   `@repo/auth/auth0-factory`. Never instantiate `auth0.Auth0Client`
   directly — multi-domain (`*.apps.lastrev.com`, `*.lastrev.com`,
   `*.apps.lastrev.localhost`) depends on the factory.
4. **`proxy.ts`** owns subdomain rewriting, CSRF, CSP nonce, and rate
   limiting. Side-effect import `./lib/app-registry` must remain so the
   self-enroll tier resolver is registered before requests are served.
5. **Migrations are append-only.** Every `supabase/migrations/<name>.sql`
   needs a matching `<name>.down.sql`. Enforced by
   `scripts/check-migration-pairs.ts` in `pnpm lint`.
6. **`turbo.json` `globalEnv`** must list every env var the app reads.
   Adding a var without registering it here means Turbo will not pass it
   through and builds will silently use stale values. Mirror the same var
   in `.env.example`.
7. **`apps/web/lib/` listing** between the `lib-listing:start`/`:end`
   markers above must match the filesystem. Enforced by
   `scripts/check-claude-md-lib-sync.ts` in `pnpm lint`.
8. **Billing/feature gates** go through `@repo/billing/has-feature-access`
   and `enforce-feature-tier.ts`. Never inline tier checks against the
   subscription row — feature overrides on the registry entry must win.
9. **Stripe webhooks** are verified with `STRIPE_WEBHOOK_SECRET` and
   handled idempotently via the `webhook_events` table. Never trust the
   request body without signature verification.
10. **CSP nonce** generated in `proxy.ts` flows through `applyCspHeader`
    and must be threaded into any inline script tag (`<Script nonce>`).
    Don't disable CSP — set `CSP_REPORT_ONLY=1` to debug.

## Database

- Typed query helpers and client selection live in `@repo/db`. See
  `packages/db/README.md` for `getAppPermission`, `upsertPermission`,
  `getUserSubscription`, and the `server.ts` / `client.ts` /
  `service-role.ts` distinction.
- Migration authoring, naming, rollback pattern, and CI checks:
  `docs/guides/migrations.md`.

## Accessibility

- Author-time enforcement: `eslint-plugin-jsx-a11y` (recommended ruleset)
  is wired into the shared ESLint config in `@repo/config`, scoped to
  `**/*.tsx`. Disabled rule:
  - `jsx-a11y/anchor-is-valid` — off because Next.js `<Link>` wraps `<a>`
    in patterns where the href lives on the parent component; the Next
    ESLint preset already lints `<Link>` misuse.
- Runtime audit: `pnpm test:a11y` runs `@axe-core/playwright` against
  every registered app's root route and fails on any `critical` violation.
  Mobile layout audit at 375 / 768 / 1440 px: `pnpm test:mobile`.
