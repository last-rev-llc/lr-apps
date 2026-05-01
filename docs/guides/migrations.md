# Database migrations

Supabase migrations live in `supabase/migrations/` and are append-only.
Every migration ships in a **pair**:

```
supabase/migrations/
  001_app_permissions.sql        ← the up migration
  001_app_permissions.down.sql   ← its rollback
```

This page covers naming, the rollback convention, the local
`db:rollback` helper, the CI pair-check, and the manual procedure for
reverting a migration that has already been applied to production.

## Naming convention

- Sequential prefix for logically ordered changes:
  `001_app_permissions.sql`, `002_subscriptions.sql`.
- Date prefix for additive feature tables that can land in any order:
  `20260409_lighthouse.sql`. Use `YYYYMMDD` so files sort correctly.
- The down file is always `<basename>.down.sql` — same prefix, same
  identifier, just the extra `.down.` segment.

## Writing safe rollbacks

A `.down.sql` should:

- Reverse the up file's CREATE statements in **reverse order** (drop
  policies before dropping tables that own them; drop indexes before
  the tables they live on).
- Use `IF EXISTS` guards on every drop. A rollback may run against a
  database where the up migration partially applied (or never applied),
  and an unguarded drop fails the whole script.
- Drop everything the up file created, but do **not** touch shared or
  pre-existing objects (e.g. `auth.users`).
- For RLS-only or grant-only migrations, the down file should drop the
  policies / revoke the grants and nothing else.

Example pair:

```sql
-- 002_subscriptions.sql
create table public.subscriptions (...);
alter table public.subscriptions enable row level security;
create policy "Users read own subscription" on public.subscriptions ...;
create index idx_subscriptions_user_id on public.subscriptions(user_id);
```

```sql
-- 002_subscriptions.down.sql
drop index if exists idx_subscriptions_user_id;
drop policy if exists "Users read own subscription" on public.subscriptions;
drop table if exists public.subscriptions;
```

## Running rollbacks locally

```sh
# roll back the most recent migration
pnpm db:rollback

# roll back a specific migration by base name
pnpm db:rollback 002_subscriptions
```

The script reads `$SUPABASE_DB_URL` (or `$DATABASE_URL`) and pipes the
matching `.down.sql` through `psql`. After rolling back you may want to
reset Supabase's local migration tracking:

```sh
supabase db reset    # nukes the local DB and re-applies all up migrations
```

## CI pair-check

`scripts/check-migration-pairs.ts` enforces the pairing rule. CI runs it
as a dedicated **Migration pair lint** step (before the regular lint
step) so a missing `.down.sql` fails fast with a clear signal. It also
runs as part of `pnpm lint` locally so you'll catch it on commit.

The check fails if any `<name>.sql` lacks a `<name>.down.sql`, or if any
`.down.sql` is orphaned (no matching up file).

Run it manually:

```sh
pnpm db:check-migration-pairs
```

## Manual revert in production

`pnpm db:rollback` targets local development only. To revert a migration
that has already been applied to the production Supabase project:

1. **Triage.** Confirm the migration is the actual cause of the
   incident. Capture the data loss / behavior delta — once dropped, the
   schema is gone.
2. **Snapshot.** From the Supabase dashboard, take a manual backup of
   the affected tables (Database → Backups → Backup now), and a logical
   dump of any data you do not want to lose:
   ```sh
   pg_dump --schema-only --table=public.<table> "$PROD_DB_URL" > schema-snapshot.sql
   pg_dump --data-only   --table=public.<table> "$PROD_DB_URL" > data-snapshot.sql
   ```
3. **Apply the down SQL.** In the Supabase dashboard SQL editor, paste
   the contents of the matching `.down.sql` file. Run it inside a
   transaction:
   ```sql
   begin;
   -- paste contents of 002_subscriptions.down.sql here
   -- verify expected schema state, then:
   commit;
   ```
4. **Update Supabase migration tracking.** Supabase records applied
   migrations in `supabase_migrations.schema_migrations`. Delete the
   row corresponding to the reverted migration so a future
   `supabase db push` does not skip the up file:
   ```sql
   delete from supabase_migrations.schema_migrations
   where version = '<migration-version>';
   ```
5. **Verify RLS, grants, and consumers.** Confirm no live code path
   still references the dropped objects (search the repo for the table
   name; redeploy if needed).
6. **Log the revert.** Append a row to
   `docs/ops/ROTATION_HISTORY.md` (or a similar incident log) with the
   date, operator, ticket link, and reason.
7. **Author a fix-forward migration.** A reverted migration should
   normally be followed by a corrected forward migration — never edit
   the original up file in place.

## Data migrations

`supabase/seed.sql` is **local-dev only** — `supabase db push` does not run it.
For seed data that must reach preview / staging / prod, ship it as a
**data migration** under `supabase/migrations/`.

### Convention

- **Filename:** `<date>_<topic>_data.sql` (paired `.down.sql` is required).
  Examples: `20260430_dad_jokes_data.sql`, `20260430_slang_data.sql`.
- **Tag every row with `seed_source`.** Add a nullable `seed_source text`
  column to the target table (idempotent `add column if not exists`) and
  stamp every inserted row with a unique batch label such as
  `'dad_jokes_v1'` or `'gen_alpha_v1'`. The label is the rollback handle —
  the down migration deletes by `seed_source = '<batch>'` so user-created
  rows are preserved.
- **Make the up idempotent.** Use `on conflict (...) do update set ... = excluded.<col>`
  (preferred — also "claims" any pre-existing rows seeded from the legacy
  `seed.sql`) or wrap in a `do $$ if not exists (...) then ... end $$;`
  guard. Re-running the migration must never duplicate rows.
- **Prefer a natural unique key for `on conflict`.** If the table doesn't
  have one, add a unique constraint inside the data migration via a
  `do $$` guard (see `20260430_dad_jokes_data.sql` for the pattern that
  guards `add constraint` against re-applies).
- **Down migrations only delete data.** Leave the `seed_source` column,
  its index, and any added unique constraint in place — they're reusable
  scaffolding for future batches. To fully reverse the schema additions,
  ship a separate cleanup migration.

### Adding more rows later

Don't edit the original up file. Author a new migration with a new
`seed_source` label (e.g. `dad_jokes_v2`) that contains only the additions.
Each batch is independently rollback-able.

### Removing seeded rows

Either run the original migration's `.down.sql` (rolls back the whole
batch), or ship a focused removal migration:

```sql
-- 20260601_dad_jokes_remove_offensive.sql
delete from public.dad_jokes
where seed_source = 'dad_jokes_v1'
  and id in (...);
```

## Related

- [Secrets rotation runbook](../ops/secrets-rotation.md)
- [Disaster recovery](../ops/disaster-recovery.md)
- [Vercel promotion](../ops/vercel-promotion.md)
