# LR Apps — Project Vision

## What is this project?
LR Apps is an internal SaaS platform for Last Rev / AlphaClaw. It hosts 27+ micro-applications behind a single Next.js 16 deployment, with each app served at its own subdomain (`<app>.adam-harris.alphaclaw.app`). The platform provides shared authentication (Auth0), billing/tier gating (Stripe), and a unified component library.

## Who uses it?
- **Internal team members** — daily tools like Command Center, Standup, Meeting Summaries, Sprint Planning
- **Clients** — customer-facing apps like Accounts, Sentiment, Uptime monitoring
- **Showcase/demo** — apps like Alpha Wins, Brommie Quake, Soccer Training used for demos and marketing

## Goals
1. **Complete component migration** — Every app should use `@repo/ui` shared components and `@repo/theme` design tokens instead of local/hardcoded styles
2. **Full test coverage** — Every app has app-specific tests; shared packages have unit tests; auth and billing flows have E2E/integration tests
3. **Production-grade billing** — Stripe-backed tier gating (free/pro/enterprise) enforced per-app via `@repo/billing`
4. **Universal auth gate** — All app routes require authentication via `requireAccess()` from `@repo/auth`; only explicitly declared `publicRoutes` bypass the gate
5. **CI pipeline** — Automated test runs, linting, and type checking on every PR

## Architecture decisions
- **Single deployable** — All apps ship inside `apps/web/`. No separate deployments per app.
- **App registry is the source of truth** — `lib/app-registry.ts` defines every app's slug, subdomain, tier, features, auth requirements, and public routes. All runtime checks reference this registry.
- **Proxy over middleware** — Uses `proxy.ts` (Next.js 16 pattern) instead of `middleware.ts` for request routing.
- **Workspace packages** — Shared code lives in `packages/` (`@repo/auth`, `@repo/billing`, `@repo/db`, `@repo/ui`, `@repo/theme`, `@repo/config`, `@repo/test-utils`). Cross-package imports always use `@repo/<pkg>`.
- **Style kit as baseline** — The marketing site style-kit is the default design language. Apps use theme tokens from `@repo/theme`, never hardcoded colors.

## Current state (as of 2026-04-09)
- **M1: Shared Foundations** — Complete (5/5). Billing package, test utils, typed DB queries, auth middleware, registry billing metadata.
- **M2: Universal Auth Gate** — Complete (14/14). Auth gates on all apps.
- **M3: Theme Token Audit** — Complete (6/6). Token audit, batch replacements across all apps, lint rule.
- **M4: App Batch 1** — 14/17 complete. 3 remaining: Sentiment component migration (#36), Sprint Planning migration (#38) and tests (#39).
- **M5: App Batch 2** — 0/20. Mid-tier apps: Dad Joke, Generations, Slang Translator, Cringe Rizzler, Daily Updates, Proper Wine Pour, HSPT Practice, HSPT Tutor, Roblox Dances, AI Calculator.
- **M6: App Batch 3** — 0/16. Showcase apps (Alpha Wins, Brommie Quake, Superstars, Travel Collection, Soccer Training), new stub apps (Area 52, Lighthouse, Sales), Command Center sub-modules.
- **M7: Deep Test Coverage** — 0/7. Auth E2E, billing integration, shared package units, registry integrity, proxy/routing integration, error boundaries, CI pipeline.

## What does "done" look like?
All 7 milestones complete. Every app migrated to shared components and theme tokens, with app-specific tests. Billing gating enforced. Auth universal. CI pipeline running on every PR. No hardcoded design tokens. Full E2E coverage for critical flows (auth, billing, routing).

## Constraints
- **No new `apps/` entries** — Everything ships inside `apps/web/`
- **Stripe secrets never client-side** — `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` are server-only
- **Env vars in turbo.json** — Any new env var must be listed in `turbo.json` `globalEnv`
- **TypeScript strict, no `any`** — Enforced by ESLint
