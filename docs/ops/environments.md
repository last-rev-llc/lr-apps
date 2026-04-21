# Environments and env-var matrix

This is the authoritative list of every env var the platform needs and where
each one comes from per environment. Keep it in sync with
`apps/web/lib/env.ts` (the runtime validator) and `turbo.json` `globalEnv`
(the build-time exposure list). If you add a new env var, you must touch all
three.

## Environment overview

| Environment | DEPLOYMENT_ENV | Hosted on              | Supabase project   | Auth0 tenant       | Stripe mode |
|-------------|----------------|------------------------|--------------------|--------------------|-------------|
| local       | `local`        | `localhost:3000`       | dev project (shared) | dev tenant         | test        |
| staging     | `staging`      | Vercel `staging.apps.lastrev.com` (+ all preview URLs) | dedicated staging project | dedicated staging tenant | test        |
| production  | `production`   | Vercel `apps.lastrev.com` | dedicated production project | production tenant | live        |

## Variable matrix

| Variable                              | local                              | staging                                  | production                                | Source / how to obtain                           |
|---------------------------------------|------------------------------------|------------------------------------------|-------------------------------------------|--------------------------------------------------|
| `DEPLOYMENT_ENV`                      | `local`                            | `staging`                                | `production`                              | Literal — used by `apps/web/lib/env.ts`          |
| `NEXT_PUBLIC_SUPABASE_URL`            | dev project URL                    | staging project URL                      | prod project URL                          | Supabase dashboard → Project Settings → API     |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`       | dev anon key                       | staging anon key                         | prod anon key                             | Supabase dashboard → Project Settings → API     |
| `SUPABASE_SERVICE_ROLE_KEY`           | dev service role                   | staging service role                     | prod service role                         | Supabase dashboard → Project Settings → API. Server-only. |
| `SUPABASE_PROJECT_ID`                 | dev project ref                    | staging project ref                      | prod project ref                          | Supabase dashboard → Project Settings → General  |
| `SUPABASE_PUBLISHABLE_KEY` / `SUPABASE_SECRET_KEY` | optional new-style API keys (when migrating off legacy anon/service-role) | same | same | Supabase dashboard → Project Settings → API |
| `AUTH0_DOMAIN`                        | dev tenant `*.us.auth0.com`        | staging tenant `*.us.auth0.com`          | prod tenant `*.us.auth0.com`              | Auth0 dashboard → Applications → Settings        |
| `AUTH0_CLIENT_ID`                     | dev application client ID          | staging application client ID            | prod application client ID                | Auth0 dashboard → Applications                   |
| `AUTH0_CLIENT_SECRET`                 | dev secret                         | staging secret                           | prod secret                               | Auth0 dashboard → Applications. Rotate per `secrets-rotation.md`. |
| `AUTH0_SECRET`                        | random 32+ char (dev only)         | random 32+ char (staging only)           | random 32+ char (prod only)               | `openssl rand -hex 32`. **Must differ per env** so cookies do not cross-decrypt. |
| `AUTH0_PRODUCTS_JSON`                 | optional per-host map              | per-product staging client IDs           | per-product prod client IDs               | Hand-built JSON; see `packages/auth/src/auth0-factory.ts` |
| `AUTH0_ALLOWED_BASE_URLS`             | `http://localhost:3000,http://lastrev.localhost:3000` | `https://staging.apps.lastrev.com` (+ preview wildcard via Vercel-injected `VERCEL_URL` if needed) | `https://apps.lastrev.com` | Comma-separated list passed to Auth0Client `appBaseUrl` |
| `APP_BASE_URL`                        | `http://localhost:3000`            | `https://staging.apps.lastrev.com`       | `https://apps.lastrev.com`                | Single canonical base URL                        |
| `NEXT_PUBLIC_AUTH_URL`                | `http://localhost:3000`            | `https://staging-auth.lastrev.com`       | `https://auth.lastrev.com`                | Auth hub URL exposed to the browser              |
| `APP_SELF_ENROLL_SLUGS`               | comma list (dev: all)              | restricted comma list                    | restricted comma list                     | App slugs that auto-enroll a user on first login |
| `STRIPE_SECRET_KEY`                   | `sk_test_…` (shared with staging)  | `sk_test_…` (shared with local)          | `sk_live_…`                               | Stripe dashboard → Developers → API keys         |
| `STRIPE_WEBHOOK_SECRET`               | `whsec_…` test                     | `whsec_…` test                           | `whsec_…` live                            | Stripe dashboard → Developers → Webhooks         |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`  | `pk_test_…`                        | `pk_test_…`                              | `pk_live_…`                               | Stripe dashboard                                 |
| `STRIPE_PRICE_ID_PRO`                 | test-mode price ID                 | test-mode price ID                       | live-mode price ID                        | Stripe dashboard → Products                      |
| `STRIPE_PRICE_ID_ENTERPRISE`          | test-mode price ID                 | test-mode price ID                       | live-mode price ID                        | Stripe dashboard → Products                      |
| `CRON_SECRET`                         | random 32+ char                    | random 32+ char (distinct)               | random 32+ char (distinct)                | `openssl rand -hex 32`. Used by Vercel cron auth header. |

## Per-service notes

### Supabase

Each environment is a **separate Supabase project**. Migrations in
`supabase/migrations/` are append-only; apply them in order with
`supabase db push --db-url $SUPABASE_DB_URL` against each project. Service
role keys are server-only — never import `packages/db/src/service-role.ts`
from a client component.

### Auth0

Each environment is a **separate Auth0 tenant** so that user records, RBAC
roles, social-login client IDs, and session cookies cannot cross
environments. The staging tenant must include the Vercel preview wildcard
in its Allowed Callback URLs (see `preview-deployments.md`).

### Stripe

Stripe has no separate "staging" account concept — local and staging both
use the **test mode** of the production Stripe account. Test-mode keys
(`sk_test_…`, `pk_test_…`, `whsec_…` for the test webhook endpoint) cannot
charge real cards. Production must use live-mode keys (`sk_live_…`).

## Validation

`apps/web/lib/env.ts` parses `process.env` with a Zod schema at process
startup. Any missing required var or invalid `DEPLOYMENT_ENV` value throws
synchronously, surfacing as a Vercel build/runtime failure rather than a
silent misconfiguration.
