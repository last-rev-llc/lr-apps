-- Reconstructive migrations for the read-only Sprint Planning Archives
-- tab: daily_digests, daily_overviews, weekly_summaries. All three are
-- populated by an external ingestion pipeline; no in-app writes.
--
-- Snake_case throughout matches what the app's queries.ts/types.ts read
-- directly. Lists (highlights/blockers/action_items/themes/items) are
-- jsonb so the UI's defensive `typeof item === "string" ? item :
-- JSON.stringify(item)` path keeps working if upstream emits objects.

create table if not exists public.daily_digests (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  service text,
  summary text,
  item_count integer,
  items jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.daily_digests enable row level security;
create index if not exists idx_daily_digests_date
  on public.daily_digests (date desc);

create table if not exists public.daily_overviews (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  summary text,
  highlights jsonb not null default '[]'::jsonb,
  blockers jsonb not null default '[]'::jsonb,
  action_items jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.daily_overviews enable row level security;
create index if not exists idx_daily_overviews_date
  on public.daily_overviews (date desc);

create table if not exists public.weekly_summaries (
  id uuid primary key default gen_random_uuid(),
  start_date date not null,
  end_date date,
  summary text,
  themes jsonb not null default '[]'::jsonb,
  highlights jsonb not null default '[]'::jsonb,
  blockers jsonb not null default '[]'::jsonb,
  action_items jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.weekly_summaries enable row level security;
create index if not exists idx_weekly_summaries_start_date
  on public.weekly_summaries (start_date desc);
