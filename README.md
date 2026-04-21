# lr-apps

Monorepo for all Last Rev / AlphaClaw apps. Single Next.js 16 host
(`apps/web/`) routes 27+ micro-apps by subdomain via `proxy.ts`, with
shared packages under `packages/` (`@repo/auth`, `@repo/billing`,
`@repo/db`, `@repo/ui`, `@repo/theme`, `@repo/config`, `@repo/test-utils`).

## Architecture

- One Next.js deployment, many apps. The host header (or `?app=<slug>` in
  dev) selects an `AppConfig` from `apps/web/lib/app-registry.ts`, which
  drives the rewrite path, auth requirement, and tier gate.
- Production hosts: `<slug>.apps.lastrev.com`. Local mirror:
  `<slug>.apps.lastrev.localhost:3000`.
- Auth via Auth0; billing via Stripe; data via Supabase.

## Environments

Three environments, each fully isolated:

| Environment | Host                          | Supabase              | Auth0           | Stripe |
|-------------|-------------------------------|-----------------------|-----------------|--------|
| local       | `localhost:3000`              | dev project           | dev tenant      | test   |
| staging     | `staging.apps.lastrev.com` + previews | staging project | staging tenant  | test   |
| production  | `apps.lastrev.com`            | prod project          | prod tenant     | live   |

See [docs/ops/environments.md](docs/ops/environments.md) for the full
env-var matrix. Copy [.env.example](.env.example) to `.env.local` for
local dev, or [.env.staging.example](.env.staging.example) when seeding a
new Vercel staging environment.

## Adding an app

1. Add an `AppConfig` entry to `apps/web/lib/app-registry.ts`.
2. Create `apps/web/app/apps/<slug>/` matching the entry's `routeGroup`.
3. Gate pages with `requireAppLayoutAccess` from `apps/web/lib/`.

## Ops

- [Environment matrix](docs/ops/environments.md) — every var, every env.
- [Vercel promotion flow](docs/ops/vercel-promotion.md) — staging → prod
  without downtime.
- [Preview deployments](docs/ops/preview-deployments.md) — subdomain
  routing on Vercel preview URLs and Auth0 callback wildcard setup.
- [Secrets rotation runbook](docs/ops/secrets-rotation.md) — rotation
  order, verification steps, rollback path.
- [Disaster recovery](docs/ops/disaster-recovery.md) — RTO/RPO targets,
  Supabase PITR, Stripe event replay.
- [Migrations guide](docs/guides/migrations.md) — paired `.down.sql`
  rollback convention and the CI pair-check.
- [Zero-downtime deploy](docs/ops/zero-downtime-deploy.md) — pre-deploy
  checklist, expand-contract schema changes, canary rollout.
