<!-- managed by alpha-loop -->

# Overview

Monorepo hosting a family of multi-tenant web apps behind a single Next.js 16
host. Requests are routed to the correct app by subdomain in
`apps/web/proxy.ts`, which resolves the subdomain, looks up the target route
group in `apps/web/lib/app-registry.ts`, and rewrites the URL under
`app/apps/<slug>/` or `app/(auth)/...`. Auth0 middleware runs on every request
and its response is merged with the rewrite via
`@repo/auth/merge-auth-middleware`. In development the same logic is triggered
by an `?app=<slug>` query param. The auth hub lives on `auth.lastrev.com`
(route group `(auth)`) and owns login, signup, account, and `/my-apps`.

# Tech Stack

- **Runtime/build**: pnpm 9 workspaces, Turbo 2, Node 22, TypeScript 5
- **App**: Next.js 16 (App Router, Turbopack), React 19, Tailwind 4
- **Auth**: `@auth0/nextjs-auth0` v4, per-host Auth0 client factory
- **Data**: Supabase v2 (`@supabase/supabase-js`), append-only SQL migrations
  under `supabase/migrations/`
- **Billing**: Stripe (customers, subscriptions, portal, webhook handler in
  `@repo/billing`)
- **Testing**: Vitest 3 (unit), Playwright 1 (e2e), `@repo/test-utils`
- **Lint/format**: ESLint 9 flat config, Prettier (configs in `@repo/config`)
- **QA harness**: `punchlist-qa` runs alongside `dev` (see root
  `package.json`)

# Directory Structure

```
apps/web/
  proxy.ts                      # subdomain → route-group rewrite + Auth0 merge
  app/
    layout.tsx  page.tsx  not-found.tsx  globals.css
    (auth)/                     # auth.lastrev.com
      layout.tsx
      (dashboard)/              # authenticated shell: account/, my-apps/
      (forms)/                  # login/, signup/, unauthorized/
    api/                        # checkout/, webhooks/
    apps/<slug>/                # one folder per app (accounts, sentiment,
                                # uptime, command-center, generations, ...)
    checkout/  pricing/
  lib/
    app-registry.ts             # source of truth for apps, tiers, features
    app-host.ts                 # host → app resolution
    proxy-utils.ts              # resolveSubdomain, getRouteForSubdomain
    require-app-layout-access.ts# layout-level access gate
    platform-urls.ts  tier-config.ts  auth-login-redirect.ts
  components/                   # host-only components (header, UpgradePrompt)
  tests/                        # Playwright e2e

packages/
  auth/     # auth0-factory, merge-auth-middleware, permissions,
            # require-access, self-enroll, AuthProvider
  billing/  # stripe-client, customers, subscriptions, portal,
            # webhook-handler, has-feature-access
  db/       # client (browser), server (SSR), service-role (server-only),
            # middleware, queries, types
  ui/       # shared shadcn-style components + lib/
  theme/    # theme.css, globals.css, components.css, landing.css
  config/   # shared ESLint/Prettier/tsconfig/vitest presets
  test-utils/

supabase/migrations/            # append-only, timestamp-prefixed SQL
scripts/                        # e.g. audit-tokens.ts
```

# Code Style

- File names are **kebab-case** (`require-app-layout-access.ts`,
  `last-rev-mini-header.tsx`). React component exports stay PascalCase.
- Cross-package imports use `@repo/*` (e.g. `@repo/auth`, `@repo/db/server`).
  Within `apps/web`, use the `@/*` alias rather than deep relatives.
- Server-only modules (e.g. `@repo/db/service-role`) must never be imported
  from client components. Keep the service-role key off the browser.
- Tailwind 4 only — no hardcoded hex or named colors in components. Pull from
  `@repo/theme` tokens / CSS variables. `scripts/audit-tokens.ts` checks this.
- One app per folder under `app/apps/<slug>`; host-level UI stays in
  `apps/web/components`, reusable UI stays in `@repo/ui`.
- Tests colocate next to source (`*.test.ts`) or live under `__tests__/`.
  Playwright specs live in `apps/web/tests/`.

# Non-Negotiables

- **`app-registry.ts` is the single source of truth** for apps, subdomains,
  route groups, tiers, features, public routes, and self-enroll behavior.
  Adding or changing an app starts here.
- **Gate every app layout** with `requireAppLayoutAccess(slug, pathname)`.
  Public paths must be declared via `publicRoutes` on the `AppConfig`, not
  hand-rolled in the layout.
- **Proxy must always merge Auth0**: any new response path in `proxy.ts` must
  go through `mergeAuthMiddlewareResponse(authResponse, ...)`. Never return a
  bare `NextResponse` from the middleware.
- **Multi-tenant Auth0**: resolve the client via
  `getAuth0ClientForHost(host)` — do not instantiate Auth0 directly.
- **Env vars**: any new runtime env var must be added to `turbo.json`
  `globalEnv` so Turbo caches invalidate correctly across the workspace.
- **Supabase migrations are append-only**. Never edit a committed migration;
  add a new timestamp-prefixed file in `supabase/migrations/`.
- **Billing checks** go through `@repo/billing/has-feature-access` +
  `@repo/auth/permissions`; do not read Stripe or subscription rows directly
  from app code.
