# Conventions

Decisions that recur across the monorepo. Captured here so future work
doesn't have to re-derive them by reading existing migrations and apps.

## Supabase migrations

### Auth0, not Supabase Auth

User identity comes from Auth0; the Supabase service-role client drives
all server-side reads/writes. Two consequences for new tables:

- **Never** rely on `auth.uid()` in RLS policies or `default auth.uid()`
  defaults — the value is `null` for every Auth0 session.
- **Use `user_id text`** (not `uuid`) on per-user columns. Auth0 emits
  string subjects like `google-oauth2|...` that don't fit `uuid`.
  Don't add a foreign key to `auth.users` (Auth0 doesn't populate it).

The 2026-04-29 `user_id_text` migration converted every prior
per-user table to this convention; it's the baseline for everything
that follows.

### Row-Level Security posture

| Table type | RLS | Policies | Why |
|---|---|---|---|
| Server-only reads (e.g. `clients`, `sites`, `days`, archives) | enabled | none | default-deny; service-role bypasses; anon can't reach the table directly |
| Browser-writable, anonymous community (`dad_jokes`, `wine_pours`, `pour_wall`, `dance_submissions`) | disabled | n/a | the browser anon key needs writes; per-user policies would grant nothing under Auth0 anyway |
| Public-read (auth=false apps, e.g. `travel_properties`) | enabled | `using (true)` for SELECT only | explicit "anyone can read"; future writes still require service-role |
| Per-user (legacy `ideas`) | enabled (after `user_id_text`) | none | service-role only; the old `auth.uid() = user_id` policies were dropped because they grant nothing under Auth0 |

### Column casing

- **Quoted camelCase** (`"createdAt"`, `"responseTimeMs"`) when the app's
  TS type uses camelCase and `select("*")` casts the row directly to
  that type with no adapter. Used by `ideas`, `clients`, `sites`,
  `days`. The migration's leading comment should call this out so a
  future contributor doesn't "fix" the quoting.
- **snake_case** otherwise. Used by `area_52_experiments`, the Sprint
  Planning archives, the Summaries source tables, daily-updates,
  dad_jokes, wine_pours, pour_wall, travel_properties,
  dance_submissions.

Mixing the two within a single repo is intentional — it's a per-table
contract with the consuming TS type.

### Primary key type

- `id uuid primary key default gen_random_uuid()` is the default.
- **`id text primary key`** when the client generates string IDs (e.g.
  `pour-${Date.now()}`, `sub-${Date.now()}`, `e2e-foo-...`) or when E2E
  tests need an id-prefix-scoped cleanup pattern (`days`,
  `daily_updates`, `daily_update_profiles`). A `uuid` column would
  reject those payloads.
- `bigserial` for catalogs the app reads by integer id (`dad_jokes`).

### Migration pairing

Every `supabase/migrations/<name>.sql` ships with a paired
`<name>.down.sql`. Enforced by `scripts/check-migration-pairs.ts` in
`pnpm lint`. Use `drop ... if exists` in down files so they're idempotent.

### Idempotent up files

New tables use `create table if not exists`. This makes the migration
safe to re-apply in environments where the table was already created
out-of-band via the Supabase SQL editor. Pair with `create index if not
exists` and `create or replace function` for the same reason.

## Apps

### Read paths

`@repo/db/server` (service role) for SSR. `@repo/db/client` (anon key)
only for client components that need direct browser writes (the
counter-bump pattern in `dad_jokes`, the community-write pattern in
`wine_pours` / `pour_wall` / `dance_submissions`). Don't mix them in a
single file.

### Fail-soft missing-table reads

A few apps swallow "table does not exist" errors and return `[]`
(`getWinePours`, `getDanceSubmissions`). This is a deliberate pattern
for community apps that ship before their migration: the page renders
empty rather than 500-ing. Once the migration is committed, the
fail-soft path is dead code but harmless to keep — leave it unless
you're explicitly tightening the contract.

### Permissions model

The registry's `permission` field is the *minimum*. `requireAppLayoutAccess`
treats a higher seeded permission (e.g. `admin`) as satisfying a `view`
gate. Tests should `seedPermission` at the registry-declared minimum, not
above it, so the suite catches drift if the registry value changes.

## Test plans

Plans live in `docs/superpowers/plans/YYYY-MM-DD-<slug>-e2e-testing.md`.
Structure follows the Ideas exemplar: Setup, Test data strategy,
Use-case catalog (Groups A–H), Spec organization, Selector strategy,
Running, Out of scope, Execution order.

Per-app E2E helpers go at `apps/web/tests/e2e/helpers/<slug>.ts`. They
are service-role only; never write tests that depend on a user being
able to mutate DB state directly through the anon key (with the
exception of the documented browser-writable tables above).
