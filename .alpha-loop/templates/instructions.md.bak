<!-- managed by alpha-loop -->
# lr-apps

## Overview
A Next.js 16 monorepo hosting 20+ internal SaaS tools and applications (Command Center, Generations, Sentiment, Accounts, etc.) for Last Rev / AlphaClaw. Each app is served at a unique subdomain (`<app>.adam-harris.alphaclaw.app`) via Vercel wildcard routing. Authentication is provided by Auth0 and billing/tier access by Stripe, with Supabase as the backend database.

## Tech Stack
- **Language:** TypeScript 5.9 (strict mode, ES2022)
- **Runtime:** Node.js 22
- **Framework:** Next.js 16 (App Router, Turbopack in dev), React 19
- **Package manager:** pnpm 9.15.4 with workspaces; Turbo 2 for task orchestration
- **Key dependencies:** `@auth0/nextjs-auth0`, `@supabase/supabase-js`, Tailwind CSS 4, Radix UI, `@repo/ui` (internal component library), Stripe

## Directory Structure
```
apps/web/              # Main Next.js application
  app/
    (auth)/            # Auth layout group — authenticated pages
      (dashboard)/     # Authenticated dashboard
    apps/              # One folder per app (e.g., command-center/, generations/)
    api/               # API route handlers (route.ts files)
  components/          # App-level shared components
  lib/                 # Utilities: app-registry.ts, platform-urls.ts, auth helpers

packages/
  ui/src/components/   # Shared Radix UI + Tailwind component library
  auth/src/            # Auth0 factory, requireAccess(), middleware merging
  db/src/              # Supabase clients: server.ts, client.ts, service-role.ts
  billing/             # Stripe integration
  theme/src/           # globals.css, theme.css, components.css
  config/              # Shared tsconfig, ESLint, Prettier configs
  test-utils/          # renderWithProviders() and test helpers

supabase/              # Supabase migrations and config
```

## Code Style
- **Files:** kebab-case (`app-registry.ts`, `auth-provider.tsx`)
- **Functions/variables:** camelCase; **Types/interfaces:** PascalCase
- **Exports:** Named exports everywhere except Next.js page/layout defaults
- **Imports order:** React/Next → `@repo/*` workspace packages → local `@/` aliases → relative
- **Components:** Functional components with explicit TypeScript `interface` for props; destructure in signature
- **Classnames:** Always use `cn()` from `@repo/ui/lib/utils` for Tailwind class merging; no hardcoded hex/rgb color values (enforced by custom ESLint rule)
- **Server vs Client:** Server Components by default; add `"use client"` only when interactivity requires it
- **Formatting:** Prettier — 2-space indent, double quotes, semicolons, trailing commas

## Non-Negotiables
- **App registry is the single source of truth.** All apps must be registered in `lib/app-registry.ts` with `subdomain`, `tier`, `publicRoutes`, and `routeGroup`. Never hardcode app metadata in route handlers — use `getAppBySlug()` / `getAppBySubdomain()`.
- **Never expose the Supabase service role key to the client.** Use `db/server.ts` in Server Components and API routes; `db/client.ts` in Client Components only.
- **Auth guard with `requireAccess()`.** Protected server routes must call `requireAccess()` from `@repo/auth` — do not roll custom auth checks.
- **All shared UI goes through `@repo/ui`.** Do not create app-local copies of components that belong in the shared library. Import from `@repo/ui`, not from `packages/ui/src` directly.
- **Monorepo imports only.** Cross-package dependencies use `workspace:*` in `package.json`; never use relative paths (`../../packages/ui`) across package boundaries.
- **TypeScript strict — no `any`.** ESLint is configured to warn on `any`; unused variables must be prefixed with `_` or removed.
