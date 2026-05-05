## Architecture
- Single Next.js 16 app at `apps/web/` hosts 27+ micro-apps; `proxy.ts` routes by subdomain (host header or `?app=<slug>`) using `lib/app-registry.ts` + `lib/proxy-utils.ts` to rewrite into `app/apps/<slug>/`.
- API routes under `app/api/` (`checkout`, `cron`, `daily-updates`, `health`, `vitals`, `webhooks`); auth callbacks under `app/(auth)/`.
- Database: Supabase (Postgres). Migrations in `supabase/migrations/` as paired `NNN_*.sql` + `NNN_*.down.sql`; access via `@repo/db` package.
- Shared workspace packages: `@repo/auth` (Auth0), `@repo/billing` (Stripe), `@repo/db`, `@repo/ui`, `@repo/theme`, `@repo/config`, `@repo/analytics`, `@repo/email`, `@repo/logger`, `@repo/storage`, `@repo/test-utils`.
- Turborepo + pnpm workspaces; `vitest.workspace.ts` aggregates test projects; `apps/web/proxy.ts` (not middleware) handles request interception.

## Conventions
- TypeScript everywhere; React 19 + Next 16 App Router with Turbopack; Tailwind v4; Zod v4 for validation; AI SDK v6 with `@ai-sdk/anthropic`.
- Tests: Vitest unit tests in `__tests__/` co-located + `apps/web/__tests__/`; Playwright e2e in `apps/web/tests/` (`test:e2e`, `test:mobile`, `test:a11y`); coverage via `@vitest/coverage-v8`.
- New app: add `AppConfig` to `apps/web/lib/app-registry.ts`, create `apps/web/app/apps/<slug>/`, gate pages with `requireAppLayoutAccess` from `apps/web/lib/`.
- New migration: always commit a `.down.sql` pair; CI runs `scripts/check-migration-pairs.ts` via `pnpm lint`.
- OTEL via `instrumentation.ts` / `lib/otel-sdk.ts`; Sentry via `sentry.{client,edge,server}.config.ts`.

## Critical Rules
- Don't delete the `<!-- managed by alpha-loop -->` marker on line 1 of `CLAUDE.md`, or the `lib-listing` markers — `scripts/check-claude-md-lib-sync.ts` enforces sync against the 19 files in `apps/web/lib/`.
- Every forward migration in `supabase/migrations/` must ship with a matching `.down.sql`; the lint pair-check fails the build otherwise.
- `proxy.ts` side-effect-imports `./lib/app-registry` to register the tier resolver — don't tree-shake or reorder; `/auth/callback` self-enroll depends on it.
- Three isolated environments (local/staging/prod) with separate Supabase, Auth0, Stripe — never mix env vars; consult `docs/ops/environments.md`.
- Use Vercel Fluid Compute defaults; don't reach for Edge runtime. Default function timeout is 300s.

## Active State
- Test status: (will be filled in by the loop)
- Recent changes: (will be filled in by the loop)
