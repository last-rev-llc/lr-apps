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

## Related

- [Secrets rotation runbook](../ops/secrets-rotation.md)
- [Disaster recovery](../ops/disaster-recovery.md)
- [Vercel promotion](../ops/vercel-promotion.md)
