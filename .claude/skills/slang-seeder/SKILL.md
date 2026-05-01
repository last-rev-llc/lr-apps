---
name: slang-seeder
description: Add new Gen Alpha slang terms to the Slang Translator app. Use this whenever the user asks to "add slang", "seed more slang", "add Gen Alpha terms", "expand the slang quiz", "add more rizz/cap/etc", or otherwise grow the slang catalog at apps/web/app/apps/slang-translator. Covers the paired DB seed migration AND the GEN_X_MAP update that is required for new terms to actually appear in the quiz — easy to forget, breaks the quiz silently if skipped.
allowed-tools: Bash, Read, Write, Edit
---

# slang-seeder

Add Gen Alpha terms to the Slang Translator. The catch: a term is only quiz-eligible if it has a `GEN_X_MAP[id]` entry, so every seed batch is **two coupled changes** — a SQL migration and a TypeScript map patch.

For the general data-migration pattern (`seed_source` tagging, idempotency, paired down-migration), see `docs/guides/migrations.md` "Data migrations". This skill is the slang-specific application of it.

## What you're touching

| File | Role |
|---|---|
| `supabase/migrations/20260430_slang.sql` | Schema (do not modify — already shipped). |
| `supabase/migrations/20260430_slang_data.sql` | The v1 batch — copy its INSERT shape. Already added the `seed_source` column. |
| `apps/web/app/apps/slang-translator/lib/gen-x-map.ts` | `GEN_X_MAP` — quiz eligibility lives here. |
| `apps/web/app/apps/slang-translator/components/slang-app.tsx` | `buildQuiz` filters `s.generation === "gen-alpha" && GEN_X_MAP[s.id]`. |

Categories already in use: `Status`, `Reaction`, `Identity`, `Action`, `Approval`, `Disapproval`, `Affirmation`, `Modifier`. Prefer one of these unless the new term truly doesn't fit.

## Out of scope

- **Gen X slang.** Lives in `apps/web/app/apps/slang-translator/data/gen-x-slang.json` (local JSON, not the DB). Different add path — don't conflate.
- **Quiz size cap.** `buildQuiz` currently picks 8 per direction (15 total max). That's app code, not a seed change.

## Workflow

### 1. Pick the next batch label

Find the highest existing `gen_alpha_v<N>` and add 1:

```bash
grep -RhoE "gen_alpha_v[0-9]+" supabase/migrations/ | sort -u
```

Use `gen_alpha_v<N+1>` as the batch label and the migration filename suffix.

### 2. Write the up migration

Path: `supabase/migrations/<YYYYMMDD>_slang_gen_alpha_v<N>.sql`
(Use today's date in `YYYYMMDD` form; if a file with that name already exists, bump to a unique stem.)

The migration is **only** an upsert — the v1 batch already added the `seed_source` column and its index, so don't re-add them.

```sql
-- Slang Translator: Gen Alpha batch v<N>.
-- Idempotent upsert; rolled back by the matching .down.sql.

insert into public.slang
  (id, term, definition, example, category, vibe_score, origin, era, aliases, equivalents, seed_source)
values
  ('term-slug', 'Term Display', 'Definition.', 'Example sentence.', 'Category', 8, 'Origin', '2020s', array['alias1','alias2']::text[], '{"genX": "Gen X equivalent"}'::jsonb, 'gen_alpha_v<N>'),
  -- ...more rows...
on conflict (id) do update set
  term         = excluded.term,
  definition   = excluded.definition,
  example      = excluded.example,
  category     = excluded.category,
  vibe_score   = excluded.vibe_score,
  origin       = excluded.origin,
  era          = excluded.era,
  aliases      = excluded.aliases,
  equivalents  = excluded.equivalents,
  seed_source  = excluded.seed_source;
```

SQL gotchas:

- `aliases` is `text[]` — use `array['a','b']::text[]`, or `array[]::text[]` for empty (not `'{}'`).
- `equivalents` is `jsonb` — wrap with `::jsonb`.
- Apostrophes inside strings double up: `'He''s got rizz.'`.
- `id` is the slug (`no-cap`, `fanum-tax`); `term` is the display form (`No Cap`, `Fanum Tax`).
- `era` values seen so far: `'2020s'`. Stay consistent unless the term genuinely predates that.

### 3. Write the down migration

Path: `supabase/migrations/<YYYYMMDD>_slang_gen_alpha_v<N>.down.sql`

```sql
-- Reverses the v<N> Gen Alpha seed batch. Schema additions (seed_source
-- column + index) were introduced in v1 and stay in place.
delete from public.slang where seed_source = 'gen_alpha_v<N>';
```

The lint script (`scripts/check-migration-pairs.ts`) requires every `*.sql` to have a `*.down.sql` sibling — skipping this breaks `pnpm lint`.

### 4. Update GEN_X_MAP — the easy step to forget

Edit `apps/web/app/apps/slang-translator/lib/gen-x-map.ts`. Add an entry for **every new id** in this batch:

```ts
"term-slug": "Gen X Equivalent String",
```

Two rules that matter:

- **Key must equal the migration's `id`.** No entry = term silently disappears from the quiz (still shows in Browse).
- **Values should be unique across the map.** `buildQuiz` builds wrong-answer choices by sampling other map values; duplicates create ambiguous questions where multiple choices look correct. Before committing, scan for collisions:

  ```bash
  node -e "const m=require('./apps/web/app/apps/slang-translator/lib/gen-x-map.ts');" 2>/dev/null \
    || grep -E '^\s*"?[\w-]+"?:' apps/web/app/apps/slang-translator/lib/gen-x-map.ts \
       | sed -E 's/.*: *"([^"]+)".*/\1/' | sort | uniq -d
  ```

  If `uniq -d` prints anything, rephrase one of the duplicate values (e.g. "Da Bomb" vs "Da Bomb / Phat"). It's fine for a value to overlap conceptually, but the exact strings should differ.

### 5. Apply locally and verify

```bash
# Apply
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -v ON_ERROR_STOP=1 \
  -f supabase/migrations/<YYYYMMDD>_slang_gen_alpha_v<N>.sql

# Count grew?
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -tAc \
  "select count(*) from public.slang where seed_source = 'gen_alpha_v<N>';"

# Idempotent? Re-apply — count should be unchanged.
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -v ON_ERROR_STOP=1 \
  -f supabase/migrations/<YYYYMMDD>_slang_gen_alpha_v<N>.sql

# Down works? Run inside a rollback so prod-like state is preserved.
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -v ON_ERROR_STOP=1 <<'SQL'
begin;
\i supabase/migrations/<YYYYMMDD>_slang_gen_alpha_v<N>.down.sql
select count(*) from public.slang where seed_source = 'gen_alpha_v<N>';  -- expect 0
rollback;
SQL
```

### 6. Lint and test

From repo root:

```bash
node --experimental-strip-types scripts/check-migration-pairs.ts
```

From `apps/web`:

```bash
pnpm vitest run app/apps/slang-translator
```

### 7. Sanity check: every new id has a map entry

Cheap, prevents the silent quiz-omission bug:

```bash
# IDs in the new migration
grep -oE "^\s*\('([a-z0-9-]+)'" supabase/migrations/<YYYYMMDD>_slang_gen_alpha_v<N>.sql \
  | sed -E "s/.*'([^']+)'/\1/" | sort -u > /tmp/new-ids.txt

# IDs covered by GEN_X_MAP
grep -oE '^\s*"?[a-z0-9-]+"?\s*:' apps/web/app/apps/slang-translator/lib/gen-x-map.ts \
  | sed -E 's/[^a-z0-9-]//g' | sort -u > /tmp/map-ids.txt

# Any new ids missing from the map?
comm -23 /tmp/new-ids.txt /tmp/map-ids.txt
```

Empty output = good. Any line printed = a term that won't appear in the quiz.

## Reference: shape of a single row

From the v1 batch (`supabase/migrations/20260430_slang_data.sql`):

```sql
('rizz', 'Rizz',
 'Charisma; the skill of charming or attracting a romantic partner.',
 'He''s got mad rizz, she said yes in two minutes.',
 'Status', 10,
 'Streamer Kai Cenat / shortened from "charisma"', '2020s',
 array['rizzler','rizzed up'],
 '{"genX": "Smooth / Charm / Game"}'::jsonb,
 'gen_alpha_v1')
```

The `equivalents` JSON and the `GEN_X_MAP` value can differ in tone — `equivalents` is shown in the Browse/Translator UI, `GEN_X_MAP` drives quiz answers. Keep them coherent, but don't feel obligated to make them byte-identical.
