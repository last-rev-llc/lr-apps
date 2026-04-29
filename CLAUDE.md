<!-- managed by alpha-loop -->
# LR Apps — CLAUDE.md

## Overview

LR Apps is a single Next.js 16 deployment at `apps/web/` that hosts 27+ micro-applications behind subdomain routing. The host header (or the `?app=<slug>` query param in dev) selects an `AppConfig` from `apps/web/lib/app-registry.ts`, which drives the rewrite path, auth gating, billing tier, and feature flags.

**Routing pattern.** Apps are served at `<slug>.apps.lastrev.com` in production. The local dev mirror is `<slug>.apps.lastrev.localhost:3000` (configured in `/etc/hosts`). The auth hub lives at `auth.apps.lastrev.com` (production) and `auth.apps.lastrev.localhost:3000` (local).

**Transition window.** During the cutover, the legacy `<slug>.lastrev.com` host (and its local mirror `<slug>.lastrev.localhost:3000`) is still served. `proxy.ts` accepts both clusters and dispatches to the same registry-driven routing; new links emitted by the app should always use the apps-cluster host pattern. The legacy host will be removed after the smoke-test described in #264 confirms parity.

**Canonical host builder.** All cross-app URL emission must go through `apps/web/lib/app-host.ts`:

- `APPS_ROOT_DOMAIN` (`apps.lastrev.com`) is the production root.
- Internally the module classifies the inbound host into one of seven clusters (`apps-prod`, `apps-local`, `legacy-prod`, `legacy-local`, `vercel-preview`, `localhost`, `unknown`); the helpers below dispatch on that classification.
- `appHost(app, hostHeader)` returns the host string for a given app under the same cluster as the inbound request.
- `appOrigin(app, hostHeader)` returns `scheme://host[:port]` (https for production, http for local).
- `authHubOrigin(hostHeader)` returns the auth hub origin under the same cluster.
- `productionAppOrigin(slug)` is the hardcoded `https://<slug>.apps.lastrev.com` form, used only when no host context is available (e.g. login redirects).

Never construct subdomain URLs by string concatenation — always use these helpers so legacy/local/preview clusters all work without per-call branching.

## Tech stack

- **Runtime:** Next.js 16 (App Router, Turbopack), React 19, TypeScript 5 (strict, no `any`), Tailwind 4.
- **Auth:** Auth0 v4 (`@auth0/nextjs-auth0`) — auth hub on `auth.apps.lastrev.com`, factory in `@repo/auth/auth0-factory`.
- **Database:** Supabase (Postgres) via `@supabase/supabase-js` v2; service-role client server-only.
- **Billing:** Stripe v17 via `@repo/billing`; tier gating from `lib/tier-config.ts`.
- **Storage:** Supabase Storage (via `@repo/storage`), Upstash Redis for rate-limit + cache.
- **Email:** Resend (via `@repo/email`).
- **Observability:** Sentry 10 (`@sentry/nextjs`), OpenTelemetry SDK (`lib/otel.ts`, `lib/otel-sdk.ts`).
- **Tooling:** pnpm 9.15.4, Turbo 2, ESLint 9 (flat), Vitest 3, Playwright 1.

## Workspace packages (`packages/`)

- `@repo/analytics` — usage telemetry hooks.
- `@repo/auth` — Auth0 factory, `requireAccess`, `mergeAuthMiddlewareResponse`.
- `@repo/billing` — Stripe wrappers, `hasFeatureAccess`, tier resolution.
- `@repo/config` — shared ESLint / TS config (including the `no-hardcoded-colors` rule).
- `@repo/db` — typed Supabase client + queries; service-role split.
- `@repo/email` — Resend templates and senders.
- `@repo/logger` — structured logger.
- `@repo/storage` — Supabase Storage helpers (signed URLs, bucket ops).
- `@repo/test-utils` — Vitest helpers (`createMockSupabase`, `asClient`, fixtures).
- `@repo/theme` — design tokens (colors, spacing, shadows, typography).
- `@repo/ui` — shared React components built on `@repo/theme`.

Always import via `@repo/<pkg>`. Always import the web app's own modules via `@/...`.

## `apps/web/lib/` (canonical filesystem listing)

This block is enforced by `scripts/check-claude-md-lib-sync.ts` via `pnpm lint`. Update it whenever a file is added, renamed, or removed in `apps/web/lib/`.

<!-- lib-listing:start -->
- `app-host.ts` — host classification + canonical origin builder for cross-cluster URL emission.
- `app-registry.ts` — single source of truth for every app's slug, subdomain, tier, features, auth, and public routes.
- `auth-login-redirect.ts` — post-login return-to validation and same-cluster redirect builder.
- `cron-auth.ts` — shared-secret check for cron and webhook endpoints.
- `csp.ts` — Content-Security-Policy header builder applied by `proxy.ts`.
- `csrf.ts` — CSRF cookie issuance and token validation for state-changing requests.
- `enforce-feature-tier.ts` — server-side feature-tier gate used by server actions and API routes.
- `env.ts` — runtime env-var schema (zod) and accessor helpers; mirrors `turbo.json` `globalEnv`.
- `health-checks.ts` — liveness/readiness probes consumed by the platform.
- `otel-sdk.ts` — OpenTelemetry NodeSDK initialization (server-only entry).
- `otel.ts` — `withSpan` wrapper and tracing utilities used by routes / actions.
- `platform-urls.ts` — pre-built links to platform pages (account, billing, etc.).
- `proxy-utils.ts` — `resolveSubdomain`, `getRouteForSubdomain`, Vercel preview detection.
- `rate-limit.ts` — Upstash-backed sliding-window rate limiter and response helpers.
- `require-app-layout-access.ts` — server-only gate used inside `apps/<slug>/layout.tsx`.
- `tier-config.ts` — feature → required tier map (the registry of feature flags).
- `validate-request.ts` — zod request-body / query validation helpers for route handlers.
<!-- lib-listing:end -->

## Conventions

- File naming: kebab-case. Tests in `__tests__/` colocated with the code under test (Vitest), or in `apps/web/tests/e2e/` (Playwright).
- New app: scaffold with `pnpm create-app <slug> --name="..." --subdomain=<sub> --tier=<free|pro|enterprise> --template=<full|minimal> --permission=view --auth=true`. Add an `AppConfig` to `app-registry.ts`, create `apps/web/app/apps/<slug>/`, and gate the layout with `requireAppLayoutAccess`.
- Migrations are append-only and require a paired `.down.sql` (CI enforces via `scripts/check-migration-pairs.ts`).
- Tests: Vitest unit (`pnpm test`), Playwright e2e (`pnpm --filter @repo/web test:e2e`). Lint: `pnpm lint` (runs `check-claude-md-lib-sync.ts`, `check-migration-pairs.ts`, then `turbo run lint`).

## Non-Negotiables

- **`apps/web/lib/app-registry.ts` is the single source of truth.** Registry, route group (`apps/web/app/apps/<slug>/`), and gating must stay aligned. Do not bypass it.
- **`proxy.ts` proxy contract.** Always merge Auth0 middleware via `mergeAuthMiddlewareResponse` and resolve hosts via `getAuth0ClientForHost(getHostFromRequestHeaders(...))`. Do not hardcode the auth hub origin — call `authHubOrigin(hostHeader)` so apps-cluster, legacy-cluster, and local hosts all redirect correctly. Do not bypass the CSP / CSRF / rate-limit wrappers (`applyCspHeader`, `ensureCsrfCookie`, `applyRateLimitHeaders`).
- **`requireAppLayoutAccess` on every authed app layout.** Public-only routes go through the registry's `publicRoutes` field.
- **Cross-app URL emission via `app-host.ts`.** Use `appOrigin`, `appHost`, `authHubOrigin`, or `productionAppOrigin`. No string concatenation against hardcoded `.lastrev.com` / `.apps.lastrev.com` literals.
- **`turbo.json` `globalEnv`.** Any new env var consumed by the app must be listed here or Turbo will not pass it through. The same names must appear in `apps/web/lib/env.ts`'s zod schema.
- **Append-only migrations + paired `.down.sql`.** `scripts/check-migration-pairs.ts` blocks any migration without its down-pair. Service-role keys are server-only.
- **`lib-listing:start` / `lib-listing:end`.** The block above must stay in sync with the contents of `apps/web/lib/`. `scripts/check-claude-md-lib-sync.ts` (run by `pnpm lint`) fails CI when it drifts.
- **Billing flows through `@repo/billing`.** Do not hardcode Stripe price IDs. Do not call Stripe from client code. Use `hasFeatureAccess` for tier checks.
- **Theme tokens only.** No hardcoded hex colors in `className` strings — the `no-hardcoded-colors` ESLint rule from `@repo/config` enforces this. Use `@repo/theme` tokens.
