<!-- managed by alpha-loop -->
# LR Apps — Claude Instructions

## Architecture
- Single Next.js 16 host serves 27+ micro-apps. `apps/web/proxy.ts` reads the host header, resolves a subdomain via `lib/proxy-utils.ts` against `lib/app-registry.ts`, and rewrites to `app/apps/<slug>/`.
- API routes live under `apps/web/app/api/`: `checkout`, `cron`, `health`, `vitals`, `webhooks`.
- DB: Supabase Postgres. Migrations in `supabase/migrations/` ship as paired `NNN_name.sql` + `NNN_name.down.sql`. Local dev via `pnpm db:local:start`.
- Workspace packages (`packages/`): `analytics`, `auth`, `billing`, `config`, `db`, `email`, `logger`, `storage`, `test-utils`, `theme`, `ui`. Cross-package imports always use `@repo/<pkg>`.

## Tech stack
- TypeScript strict, Next.js 16 App Router, React 19 Server Components, Tailwind 4 via `@repo/theme`.
- Auth0 v4 (multi-tenant), Stripe v17, Sentry 10, OpenTelemetry, Resend (email), Upstash Redis (rate limiting), Supabase JS v2, Zod v4.
- Turborepo + pnpm 9.15.4. Vitest workspace + Playwright e2e.

## apps/web/lib/
<!-- lib-listing:start -->
- `app-card-media.ts`
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

## Non-negotiables
- **App registry is the source of truth.** `lib/app-registry.ts` defines every app's slug, subdomain, tier, features, auth requirements, and public routes. All runtime checks reference this registry.
- **`apps/web/proxy.ts` + `lib/app-registry.ts` are coupled.** The registry side-effect import in proxy registers the tier resolver for `/auth/callback` self-enroll. Don't remove it.
- **Auth gate everywhere.** All app routes call `requireAppLayoutAccess` from `lib/require-app-layout-access.ts`; only registered `publicRoutes` bypass.
- **Auth0 host resolution must go through `getAuth0ClientForHost`** from `@repo/auth/auth0-factory`. Never instantiate Auth0 clients directly.
- **Migrations are append-only.** Never edit a committed `.sql` file. Always pair `NNN_name.sql` with `NNN_name.down.sql`; CI enforces this via `scripts/check-migration-pairs.ts`. See `docs/guides/migrations.md`.
- **Env vars in `turbo.json`.** Any new env var must be listed in `turbo.json` `globalEnv`. **Every new env var must also be added to `apps/web/lib/env.ts` (Zod schema) before being read elsewhere** — runtime reads go through `env()` so cold start fails fast.
- **Stripe secrets are server-only.** `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` must never reach the client bundle.
- **Billing webhook idempotency.** Stripe events flow through `app/api/webhooks/` and the `webhook_events` table; don't bypass.
- **Lib-listing sync.** This file's `<!-- lib-listing:start -->`/`<!-- lib-listing:end -->` block is checked by `scripts/check-claude-md-lib-sync.ts`. `pnpm lint` fails if `apps/web/lib/` and the listing diverge.

## Database
- Typed query helpers and client selection live in `@repo/db`. See `packages/db/README.md` for `getAppPermission`, `upsertPermission`, `getUserSubscription`, and the `server.ts` / `client.ts` / `service-role.ts` distinction.
- Migration authoring, naming, rollback pattern, and CI checks: `docs/guides/migrations.md`.

## Accessibility
- Author-time enforcement: `eslint-plugin-jsx-a11y` (recommended ruleset) is wired into the shared ESLint config in `@repo/config`, scoped to `**/*.tsx`. Disabled rule:
  - `jsx-a11y/anchor-is-valid` — off because Next.js `<Link>` wraps `<a>` in patterns where the href lives on the parent component; the Next ESLint preset already lints `<Link>` misuse.
- Runtime audit: `pnpm test:a11y` runs `@axe-core/playwright` against every registered app's root route and fails on any `critical` violation. Mobile layout audit at 375 / 768 / 1440 px: `pnpm test:mobile`.
