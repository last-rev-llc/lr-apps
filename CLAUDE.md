<!-- managed by alpha-loop -->

## Overview

Monorepo for Last Rev / AlphaClaw apps. A single Next.js 16 host (`apps/web`) routes multiple tenant apps by subdomain via `proxy.ts`. Each app lives under `apps/web/app/apps/<slug>/` and is registered in `lib/app-registry.ts`. Auth0 handles authentication; Supabase backs data; Stripe handles billing tiers (`free` / `pro` / `enterprise`) enforced per-app and per-feature.

## Tech Stack

- **Runtime**: Node (pnpm@9.15.4 workspaces, Turborepo)
- **Framework**: Next.js 16 (App Router, Turbopack dev), React 19
- **Language**: TypeScript 5 (extends `@repo/config/tsconfig/*`)
- **Auth**: `@auth0/nextjs-auth0` v4 via `@repo/auth`
- **DB**: Supabase (`@supabase/supabase-js` v2) via `@repo/db`
- **Billing**: Stripe via `@repo/billing`
- **Styling**: Tailwind 4 + design tokens in `@repo/theme`
- **Testing**: Vitest (unit) + Playwright (e2e)
- **Lint**: ESLint 9 flat config + custom `no-hardcoded-colors` rule
- **Dev QA**: `punchlist-qa` runs alongside `pnpm dev`

## Directory Structure

```
apps/web/                 Single Next.js host for all apps
  app/
    (auth)/
      (dashboard)/        account, my-apps (authed shell)
      (forms)/            login, signup, unauthorized
      layout.tsx
    apps/<slug>/          Per-app route group (page.tsx, layout.tsx, components/, lib/, __tests__/)
    api/                  checkout/, webhooks/
    pricing/, checkout/
  components/             Web-app-scoped shared components (mini-header, UpgradePrompt)
  lib/
    app-registry.ts       Source of truth: slug → subdomain, permission, tier, features
    app-host.ts           Host-aware helpers
    proxy-utils.ts        Subdomain → route resolution used by proxy.ts
    require-app-layout-access.ts   Gate layouts by permission + tier
    auth-login-redirect.ts, platform-urls.ts, tier-config.ts
  proxy.ts                Edge middleware: subdomain routing + Auth0 merge

packages/
  auth/                   Auth0 factory, merge-middleware, permissions, self-enroll, require-access
  billing/                Stripe customers, subscriptions, portal, webhook handler, has-feature-access
  db/                     Supabase client/server/service-role, middleware, queries, types
  theme/                  Global CSS + design tokens (theme.css, globals.css, components.css, landing.css)
  ui/                     Shared React components (card, button, dialog, data-grid, pricing, etc.)
  config/                 Shared eslint, prettier, tsconfig/base, tsconfig/nextjs, custom lint rules
  test-utils/             Shared test helpers

supabase/migrations/      Numbered SQL migrations (app_permissions, subscriptions, webhook_events, ...)
scripts/                  audit-tokens.ts, seed-stripe.ts, generate-app-cards.py
docs/                     superpowers/, token-violations-report.md
```

Workspace imports use `@repo/<pkg>`. Web app uses `@/*` alias for its own root.

## Code Style

- TypeScript strict; no implicit any; prefer explicit return types on exported APIs
- ES modules (`"type": "module"`); use `.ts`/`.tsx` extensions, not `.js`
- File/dir naming: **kebab-case** (`app-registry.ts`, `require-app-layout-access.ts`)
- React components: PascalCase file names allowed for components (`UpgradePrompt.tsx`), but lib utilities stay kebab-case
- Tests live under `__tests__/` next to the code they cover, or as `*.test.ts` siblings in packages
- Styling: Tailwind classes + CSS custom properties from `@repo/theme` — **no hardcoded hex colors** (enforced by custom ESLint rule)
- Prefer `@repo/ui` components over one-off implementations
- Server-only DB access uses `@repo/db/server` or `service-role`; never import service-role keys from client code

## Non-Negotiables

- **Do not bypass `app-registry.ts`**: adding or changing an app's slug, subdomain, permission, tier, or `features` must go through this file. `proxy.ts`, access gates, and billing all key off it.
- **Gate routes with `requireAppLayoutAccess`** in each app's `layout.tsx` unless the path is listed in `publicRoutes` on its `AppConfig`.
- **Billing tier enforcement**: feature access goes through `@repo/billing` `hasFeatureAccess`. Don't hand-roll tier checks.
- **Auth middleware must stay merged**: `proxy.ts` uses `mergeAuthMiddlewareResponse` — any new proxy branch must preserve Auth0 cookies by merging through it.
- **Supabase service-role** (`@repo/db/service-role`) is server-only. Never import it into a client component or edge-exposed path.
- **Env vars**: add new vars to `turbo.json` `globalEnv` or they won't be available in built tasks.
- **Migrations are append-only**: add a new numbered file under `supabase/migrations/`; never edit an existing migration.
- **Design tokens over hex**: use `var(--color-*)` or Tailwind theme classes; the `no-hardcoded-colors` rule will flag violations.
- **Don't edit `apps/web/next.config.ts`, `turbo.json`, or `pnpm-workspace.yaml`** without a clear reason — these affect every app.
