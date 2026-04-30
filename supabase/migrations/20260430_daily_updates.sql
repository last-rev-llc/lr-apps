-- Tables backing the Daily Updates feed app. Posts are authored by other
-- apps in the suite (source_app) and consumed read-only by this feed.
-- Both tables are global (no user_id); access flows through the server
-- API route at apps/web/app/api/daily-updates/route.ts, which gates on
-- the daily-updates:view permission.
--
-- id is text (not uuid) so e2e helpers can prefix-scope cleanup with
-- `e2e-` ids per the merged plan §2.

create table if not exists public.daily_updates (
  id text primary key,
  title text not null,
  body text not null default '',
  source_app text not null,
  source_name text not null,
  source_icon text not null,
  category text,
  priority text,
  links jsonb not null default '[]'::jsonb,
  reactions jsonb not null default '{}'::jsonb,
  tags jsonb not null default '[]'::jsonb,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz default now()
);
alter table public.daily_updates enable row level security;

create index if not exists idx_daily_updates_created_at
  on public.daily_updates (created_at desc);
create index if not exists idx_daily_updates_source_app_created_at
  on public.daily_updates (source_app, created_at desc);
create index if not exists idx_daily_updates_category
  on public.daily_updates (category);

create table if not exists public.daily_update_profiles (
  id text primary key,
  name text not null,
  icon text not null,
  personality text,
  post_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz default now()
);
alter table public.daily_update_profiles enable row level security;

create index if not exists idx_daily_update_profiles_name
  on public.daily_update_profiles (name);
