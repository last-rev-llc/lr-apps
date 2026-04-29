# Session Summary: session/019-client-health-app-foundation-schema

## Overview
Foundation session for the new `client-health` app: scaffolded the app entry, landed four paired up/down migrations (`clients`, `client_sites`, `site_metadata`, plus the settings/events tables), built server actions with RLS-simulating tests, a pure scoring helper, and a schema-drift canary. All 11 issues passed first-try with zero test-fix retries; review caught a recurring sidebar-dead-link bug and `process.env` drift but nothing blocking.

## Recurring Patterns
- **Shared trigger function reused across migrations**: `public.set_updated_at()` defined in the first migration that needs it, attached (not redefined) by later migrations in the same chain — kept DRY across `clients` → `client_sites` → `site_metadata` → settings/events.
- **Atomic registry/count bumps**: when adding/removing an app, bump the `>=N` assertion in `app-registry.test.ts`, the prose count in `CLAUDE.md`, and the directory-tree comment in lockstep — prevents follow-up lint/test breaks.
- **In-memory Supabase mock that simulates RLS**: scope every `from(table)` query through a `currentUserId` filter so tests can toggle users to verify cross-user reads return zero rows; mirror DB defaults and return `{ error: { code: "23505" } }` for unique-violation paths.
- **Pure scoring helpers with exported weight tables**: `WEIGHTS as const` + `Record<keyof typeof WEIGHTS, number>` breakdown enables table-driven tests (one row per axis × {perfect, mid, broken, missing-data}) and gives the UI tooltip a single source of truth.
- **Quoted camelCase column names** used consistently across schema, check constraints, and indexes — avoids Postgres lowercasing surprises and matches Supabase client expectations without snake_case mapping.

## Recurring Anti-Patterns
- **Sidebar/MODULES dead links left behind on route moves**: tile removal touches only `page.tsx` while sibling `layout.tsx` MODULES, breadcrumb maps, and layout test assertions still point at deleted routes — surfaced in #270, #271, #272, #274.
- **`process.env.X` read directly inside server actions** instead of routing through `lib/env.ts` (CLAUDE.md canonical pattern) — already drifting in cringe-rizzler / cc-analytics, repeated in this session's actions.
- **Down-migrations dropping shared helpers** (`public.set_updated_at()`) that sibling tables still depend on — safe under reverse-order rollback, broken under partial/isolated rollback. No cross-table dependency comment in any of the four down files.
- **Plans citing precedents that don't exist** ("same pattern as ideas" — no `ideas` migration in repo) — misleads future authors copying the cited template.
- **Re-export-only shim files** (`lib/queries.ts` → one-line re-export from `actions.ts`) created just to satisfy a spec's file list, adding indirection without value.

## Recommendations
- **Add a "route-removal sweep" check to the implement prompt or `code-review` skill**: when a diff deletes/moves a route, grep the slug across `layout.tsx` MODULES arrays, sidebar configs, breadcrumb maps, `app-registry.ts`, and matching `layout.test.tsx` assertions before declaring done. This single class of bug appeared in 4 of 11 issues.
- **Add a `lib/env.ts` lint rule or implement-prompt check**: flag direct `process.env.<NAME>` reads in `apps/*/app/**/actions.ts` when the var is already declared in `lib/env.ts`. Catches the canonical-pattern drift surfaced in #270, #271, #272, #274.
- **Codify shared-trigger-function ownership**: either move `public.set_updated_at()` into a dedicated bootstrap migration (so no single-table down-migration drops it) or require a header comment in the down file naming the cross-table dependency. Add to migration-pair-lint or a new `migrations` skill note.
- **Verify cited precedents in plans**: update `implementation-planning` skill to require that "same pattern as X" references resolve to a real file path before the plan is approved — would have caught the missing-`ideas`-migration citation that recurred across 5 plans.
- **Fold thin re-export files back to source**: when a spec's file list includes a `queries.ts` that ends up as a one-line re-export, either inline the spec into the real call site or move the query logic into the file — don't ship the shim.
- **Audit implicit field reads when narrowing `select('*')`**: when switching to a pinned column list (the schema-drift canary pattern), grep every renderer for accessors that may have read the unpinned fields (the `uptime` page's `site.history` regression in #275).

## Metrics
| Metric | Value |
|--------|-------|
| Issues processed | 11 |
| Success rate | 100% |
| Avg duration | 334s |
| Total duration | 61 min |
