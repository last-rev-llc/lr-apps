Here is the project context file:

---

## Architecture

- **Entry point:** `apps/web/` — Next.js 16 App Router app; each app lives under `apps/web/app/apps/<slug>/` with its own `layout.tsx`, `lib/queries.ts`, and `lib/types.ts`
- **Routing:** Wildcard subdomain (`<app>.adam-harris.alphaclaw.app`) resolved in middleware via `getAppBySubdomain()`; `routeGroup` in the registry maps subdomain to the filesystem path
- **Database:** Supabase (Postgres); schema in `supabase/migrations/`; query via `@repo/db` — `server.ts` in Server Components/API routes, `client.ts` in Client Components only
- **Auth:** `@auth0/nextjs-auth0` v4 + `requireAccess()` from `packages/auth/src/require-access.ts`; app-level access gated by `permission` field in registry
- **Shared packages:** `@repo/ui` (Radix+Tailwind components), `@repo/auth`, `@repo/db`, `@repo/theme`, `@repo/billing`; orchestrated by Turbo 2

## Conventions

- TypeScript strict, no `any`; kebab-case files, camelCase vars, PascalCase types; named exports everywhere except Next.js page/layout defaults
- Tests: Vitest (`vitest run`); co-located under `app/apps/<slug>/__tests__/` or `lib/__tests__/`; `@repo/test-utils` provides `renderWithProviders()`
- New app checklist: add entry to `apps/web/lib/app-registry.ts`, create `apps/web/app/apps/<slug>/` directory with `layout.tsx` calling `requireAccess()`, add `lib/queries.ts` + `lib/types.ts`
- Classnames: always `cn()` from `@repo/ui/lib/utils`; no hardcoded colors
- Server Components by default; `"use client"` only for interactive islands

## Critical Rules

- **`lib/app-registry.ts` is the single source of truth** — never hardcode subdomain/tier/route metadata elsewhere; routing, auth, and billing all read from it
- **Never expose Supabase service role key to client** — use `db/server.ts` server-side only
- **`requireAccess()` is mandatory** in every protected layout — do not roll custom auth checks
- **All shared UI via `@repo/ui`** — do not create app-local copies of shared components
- **Cross-package imports must use `workspace:*`** — never use relative `../../packages/` paths

## Active State

- **Test status:** (will be filled in by the loop)
- **Recent changes:** Auth0 v4, Next.js 16, Turbo 2 monorepo; 28+ apps registered; `tsconfig.tsbuildinfo` has uncommitted changes as of session start
