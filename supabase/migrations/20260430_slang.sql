-- Catalog of Gen Alpha slang for the Slang Translator app. Read-only
-- reference data; the app merges these rows with a local JSON file of
-- Gen X slang at request time (see apps/web/app/apps/slang-translator/lib/queries.ts).
--
-- RLS is enabled with a public-read policy. There are no write paths
-- in the app, so anon needs SELECT only.
create table if not exists public.slang (
  id text primary key,
  term text not null,
  definition text not null,
  example text not null default '',
  category text not null,
  vibe_score integer not null default 0,
  origin text not null default '',
  era text not null default '',
  aliases text[] not null default '{}',
  equivalents jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_slang_vibe_score
  on public.slang (vibe_score desc);
create index if not exists idx_slang_category
  on public.slang (category);

alter table public.slang enable row level security;

drop policy if exists "Public read of slang catalog" on public.slang;
create policy "Public read of slang catalog"
  on public.slang for select
  using (true);
