# Contributing to lr-apps

Thanks for contributing. This repo hosts 27+ micro-apps behind a single
Next.js 16 host (`apps/web/`) with shared packages under `packages/`.
Read the top-level [README](README.md), [CLAUDE.md](CLAUDE.md), and the
relevant docs under [docs/](docs/) before your first PR.

## Table of contents

1. [Local setup](#local-setup)
2. [Branch naming](#branch-naming)
3. [Pull request process](#pull-request-process)
4. [Code review expectations](#code-review-expectations)
5. [App registry conventions](#app-registry-conventions)
6. [Package boundaries](#package-boundaries)

## Local setup

Prerequisites: Node 22+, pnpm 9, and a Supabase dev project.

```bash
pnpm install
cp .env.example .env.local   # fill in real values
pnpm db:seed                 # admin perms + pro subscription for E2E_TEST_USER_ID
pnpm dev                     # apps/web + punchlist-qa
```

Common scripts:

- `pnpm lint` — turbo-wide ESLint plus `check-claude-md-lib-sync` and
  `check-migration-pairs`
- `pnpm typecheck` — `tsc --noEmit` across all workspaces
- `pnpm test` — vitest unit/integration tests (all workspaces)
- `pnpm --filter @repo/web test:e2e` — Playwright E2E
- `pnpm audit:tokens` — enforce `@repo/theme` tokens over hardcoded colors
- `pnpm create-app <slug>` — scaffold a new app (registry entry + routes +
  test stub)

Required env vars for `db:seed`: `E2E_TEST_USER_ID`, `E2E_TEST_USER_EMAIL`,
`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`. See
[docs/ops/environments.md](docs/ops/environments.md) for the full matrix.

Access apps locally via subdomain (`<subdomain>.apps.lastrev.localhost:3000`)
or the dev shortcut `http://localhost:3000/?app=<subdomain>`.

## Branch naming

- `agent/issue-<n>` — branches created by the automation agent
- `feat/<slug>` — new features
- `fix/<slug>` — bug fixes
- `chore/<slug>` — tooling, docs, refactors, non-functional changes

Keep branches single-purpose. Do not mix feature work with unrelated
refactors in the same branch.

## Pull request process

1. Follow [conventional commits](https://www.conventionalcommits.org/)
   (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`). One feature
   per PR.
2. Link the issue with `closes #<n>` (single issue) or `refs #<n>`
   (partial/batched work — do not close prematurely).
3. `pnpm lint`, `pnpm typecheck`, and `pnpm test` must pass locally.
4. Any new env var **must** be added to both `.env.example` and
   `turbo.json` `globalEnv` or it will not reach tasks at build/run time.
5. New Supabase migrations are append-only. Each `.sql` needs a matching
   `.down.sql` (enforced by `pnpm db:check-migration-pairs`). See
   [docs/guides/migrations.md](docs/guides/migrations.md).
6. Write or update tests for every change. UI changes need a render
   smoke test at minimum; auth/billing/routing changes need integration
   coverage.
7. For UI changes, verify behavior in the browser before marking ready
   for review — type-checks and unit tests verify code correctness, not
   feature correctness.

## Code review expectations

Reviewers check, at minimum:

- **Security** — no hardcoded secrets; `STRIPE_SECRET_KEY` /
  `SUPABASE_SERVICE_ROLE_KEY` / `AUTH0_CLIENT_SECRET` never reach client
  code. `@repo/db/service-role` is server-only. Return-to URLs reject
  protocol-relative (`//`) redirects.
- **Registry is source of truth** — every subdomain route resolves via
  `apps/web/lib/app-registry.ts`. Adding `apps/web/app/apps/<slug>/`
  without an `AppConfig` entry leaves it unreachable. Do not duplicate
  subdomain→slug mappings elsewhere.
- **Auth gating** — gated layouts call `requireAppLayoutAccess(slug)`
  from `apps/web/lib/require-app-layout-access.ts`. Public routes must
  be declared in the app's `publicRoutes` array, not hard-coded skips.
- **Middleware composition** — proxy logic that returns a response must
  use `mergeAuthMiddlewareResponse` from `@repo/auth/merge-auth-middleware`
  so Auth0 session cookies are preserved. Never return a bare
  `NextResponse` from `proxy.ts`.
- **Migrations** — append-only. Never edit or delete files in
  `supabase/migrations/`; add a new timestamped migration instead. Every
  `.sql` must ship with a `.down.sql`.
- **Env vars** — any new var listed in `.env.example`, `turbo.json`
  `globalEnv`, and (if user-facing) `docs/ops/environments.md`.
- **Theme tokens** — no hardcoded hex/rgb colors in `className` strings.
  Use tokens from `@repo/theme` (enforced by
  `@repo/config`'s `no-hardcoded-colors` ESLint rule and `pnpm
  audit:tokens`).
- **Tests pass, not just exist** — partial/skipped suites are worse than
  none. If an acceptance criterion is deliberately deferred, open a
  tracked follow-up issue rather than silently dropping it.

## App registry conventions

Every app is defined in `apps/web/lib/app-registry.ts` as an `AppConfig`
entry. Fields:

| Field              | Required | Notes                                                                   |
|--------------------|----------|-------------------------------------------------------------------------|
| `slug`             | yes      | kebab-case, matches `apps/web/app/apps/<slug>/`                         |
| `name`             | yes      | Human-readable display name                                             |
| `subdomain`        | yes      | Must be globally unique — index is built from this field                |
| `routeGroup`       | yes      | `apps/<slug>` for gated apps, `(auth)` for the auth hub                 |
| `auth`             | yes      | `true` gates every route through `requireAppLayoutAccess`               |
| `permission`       | yes      | `view` / `edit` / `admin` — checked against `app_permissions` table     |
| `template`         | yes      | `full` (styled shell) or `minimal` (bare)                               |
| `tier`             | yes      | `free` / `pro` / `enterprise` — checked against Stripe subscription     |
| `features`         | yes      | Per-feature tier overrides (e.g. `{ export: "pro" }`)                   |
| `publicRoutes`     | no       | Array of paths (`"/"`, `"/pricing"`, `"/api/webhooks/**"`) that bypass auth |
| `accessRequest`    | no       | CTA shown on `/unauthorized` (label + href)                             |
| `postEnrollPath`   | no       | Redirect subpath after self-enroll (hybrid public-landing apps)         |

Rules:

- Subdomains must be unique. The registry's `Map` index silently collides
  on duplicates — the `app-registry.test.ts` suite enforces uniqueness.
- Registry changes go with the app wiring in the same PR. A dangling
  `routeGroup` directory without an entry is unreachable; an entry
  without a matching directory throws at request time.
- `publicRoutes` patterns support exact matches and trailing `**` globs
  only — see `isPublicRoute()` in `apps/web/lib/app-registry.ts`.
- Do not duplicate subdomain→slug mappings in other files. Always import
  from `app-registry.ts`.

Use `pnpm create-app <slug>` to scaffold a new app entry and directory
together.

## Package boundaries

Shared code lives in `packages/`. Import from workspace packages using
`@repo/<pkg>` — never relative paths across the workspace boundary. App
code imports local files with `@/`.

| Package            | Purpose                                                                 |
|--------------------|-------------------------------------------------------------------------|
| `@repo/auth`       | Auth0 v4 wiring, `requireAccess`, `mergeAuthMiddlewareResponse`, permissions |
| `@repo/billing`    | Stripe client, subscription upsert, webhook handler, feature-access    |
| `@repo/db`         | Supabase clients (browser/SSR/service-role), typed queries, audit log  |
| `@repo/ui`         | Cross-app React components (buttons, cards, layouts)                    |
| `@repo/theme`      | Design tokens (colors, spacing, typography) — Tailwind token source     |
| `@repo/config`     | Shared ESLint / TS config, including `no-hardcoded-colors` rule         |
| `@repo/logger`     | Structured logger with request-context binding                          |
| `@repo/test-utils` | `renderWithProviders`, mock Supabase client, common Vitest helpers      |
| `@repo/storage`    | Supabase Storage wrappers                                               |
| `@repo/email`      | Transactional email senders (Resend)                                    |

Do not:

- **Import across app boundaries.** Code in `apps/web/app/apps/<app-a>/`
  must not import from `apps/web/app/apps/<app-b>/`. Share via
  `packages/ui` instead.
- **Import the service-role Supabase client from client components.**
  `@repo/db/service-role` is server-only. Use `@repo/db/server` for SSR,
  `@repo/db/client` for browser, `@repo/db/middleware` for edge.
- **Call Stripe directly from an app.** Go through `@repo/billing`
  (`getStripe()`, `upsertSubscription()`, `hasFeatureAccess()`) so
  secrets stay on the server.
- **Hardcode colors.** Use `@repo/theme` tokens. `pnpm audit:tokens`
  will fail CI otherwise.

## Questions

Open a discussion, ping on Slack, or file an issue. When in doubt, err
on the side of asking — it is cheaper than a revert.
