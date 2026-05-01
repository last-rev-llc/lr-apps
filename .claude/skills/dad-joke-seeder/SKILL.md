---
name: dad-joke-seeder
description: Add more dad jokes to the Dad Joke of the Day app via the seed_source data-migration pattern. Use whenever the user says "add more dad jokes", "seed N more jokes", "new dad joke batch", "extend the dad jokes catalog", or anything that means inserting rows into public.dad_jokes — even if they don't say the word "migration".
allowed-tools: Bash, Read, Write, Edit
---

# Dad Joke Seeder

Author a new `dad_jokes_v<N>` batch as a paired up/down data migration. Every batch is its own seed_source label so it can be rolled back independently without touching user-created jokes. Canonical pattern: `docs/guides/migrations.md` (Data migrations section).

## Workflow

1. **Pick the next batch label.** Find the highest existing version, then add 1.
   ```bash
   grep -hE "seed_source = 'dad_jokes_v[0-9]+'" /Users/adamharris/Documents/repos/lr-apps/supabase/migrations/*.sql \
     | grep -oE "dad_jokes_v[0-9]+" | sort -V | tail -1
   ```
   If the highest is `dad_jokes_v3`, the new batch is `dad_jokes_v4`.

2. **Create the up migration** at `supabase/migrations/<YYYYMMDD>_dad_jokes_v<N>.sql`. The schema bits (the `seed_source` column, its index, and the `unique (setup, punchline)` constraint) were already added by `20260430_dad_jokes_data.sql` and are idempotent infrastructure — do NOT redeclare them. The new file is INSERTs only:

   ```sql
   -- New dad jokes batch (v<N>). Idempotent via the unique (setup, punchline)
   -- constraint added in 20260430_dad_jokes_data.sql.
   insert into public.dad_jokes (setup, punchline, category, seed_source) values
     ('Setup goes here?', 'Punchline goes here.', 'Animals', 'dad_jokes_v<N>'),
     -- ... more rows ...
   on conflict (setup, punchline) do update set
     category = excluded.category,
     seed_source = excluded.seed_source;
   ```

3. **Create the paired down migration** at the same path with `.down.sql`:
   ```sql
   delete from public.dad_jokes where seed_source = 'dad_jokes_v<N>';
   ```
   The migration-pair lint (`scripts/check-migration-pairs.ts`) will fail CI if this is missing.

## SQL escaping rules

- Single quotes inside strings must be **doubled**: `don''t`, not `don\'t`. Postgres rejects backslash escapes in standard string literals.
- Em dashes / smart quotes are fine — UTF-8 source files are accepted.
- Each row must be one of the existing 15 categories (case-sensitive — the UI filter pills auto-populate from distinct values, so casing inconsistency creates duplicate pills):

  `Animals, Food, Wordplay, Tech, Music, Science, Sports, Math, Work, School, Body, Travel, Weather, Holidays, Family`

  If a new category genuinely belongs, add it — but warn the user that it'll appear as a new filter pill, and double-check no existing category fits.

## Verification

The local Supabase Postgres URL defaults to `postgresql://postgres:postgres@127.0.0.1:54322/postgres`. If `supabase status -o env` shows something different, use that.

```bash
cd /Users/adamharris/Documents/repos/lr-apps
DB="postgresql://postgres:postgres@127.0.0.1:54322/postgres"
MIG="supabase/migrations/<YYYYMMDD>_dad_jokes_v<N>.sql"
DOWN="supabase/migrations/<YYYYMMDD>_dad_jokes_v<N>.down.sql"

# 1. Apply
psql "$DB" -v ON_ERROR_STOP=1 -f "$MIG"

# 2. Count must equal N (the number of rows in the batch)
psql "$DB" -tAc "select count(*) from public.dad_jokes where seed_source = 'dad_jokes_v<N>';"

# 3. Idempotency: re-apply, count must NOT change
psql "$DB" -v ON_ERROR_STOP=1 -f "$MIG"
psql "$DB" -tAc "select count(*) from public.dad_jokes where seed_source = 'dad_jokes_v<N>';"

# 4. Down works in a rollback (doesn't actually mutate)
psql "$DB" -v ON_ERROR_STOP=1 <<SQL
begin;
\i $DOWN
select count(*) from public.dad_jokes where seed_source = 'dad_jokes_v<N>';  -- should be 0
rollback;
SQL

# 5. Pair lint
node --experimental-strip-types scripts/check-migration-pairs.ts

# 6. App tests stay green
pnpm --filter web vitest run app/apps/dad-joke-of-the-day
```

All six steps must pass before considering the batch shipped.

## Reference template

`supabase/migrations/20260430_dad_jokes_data.sql` is the v1 batch (250 jokes). Read it once when in doubt about the exact SQL shape, INSERT formatting, or the `on conflict` clause — then mimic its style for new batches (minus the schema-setup block at the top).

## Why this pattern

- **`seed_source` is the rollback handle.** Deleting `where seed_source = 'dad_jokes_v<N>'` removes only this batch's rows, never user-created jokes or rows from other batches.
- **`on conflict ... do update set seed_source = excluded.seed_source`** lets the migration "claim" pre-existing identical rows (e.g. ones inserted via the local-only `seed.sql`), so re-applying never duplicates and never leaves orphaned untracked rows.
- **Schema additions stay in v1.** The column, index, and unique constraint are reusable scaffolding — every subsequent batch just INSERTs.
