-- Reset the public.ideas table for the Ideas mini-app.
--
-- Some environments have a legacy public.ideas table that predates this
-- repo, with a different shape (no user_id column, plus columns from an
-- older feature). The original 20260429_ideas.sql migration uses
-- "create table if not exists", so on those environments it was a no-op
-- and the per-user columns the mini-app needs were never added — leading
-- to PGRST204 ("Could not find the 'user_id' column of 'ideas'") on
-- ideas.createIdea.
--
-- Drop the legacy table and recreate it with the shape
-- apps/web/app/apps/ideas/ expects: user_id is text (Auth0 subject — see
-- 20260429_user_id_text.sql for context), no FK to auth.users, RLS
-- enabled with no policies. Per-user isolation flows through the
-- service-role client filtering by user_id at the app layer.

drop table if exists public.ideas cascade;

create table public.ideas (
  id uuid default gen_random_uuid() primary key,
  user_id text not null,
  title text not null,
  description text,
  category text,
  status text not null default 'new'
    check (status in ('new', 'backlog', 'in-progress', 'completed', 'archived')),
  source text not null default 'manual'
    check (source in ('generated', 'community', 'manual')),
  feasibility int check (feasibility between 0 and 10),
  impact int check (impact between 0 and 10),
  effort text check (effort in ('Low', 'Medium', 'High')),
  "compositeScore" numeric,
  rating int check (rating between 0 and 5),
  hidden boolean not null default false,
  "snoozedUntil" timestamptz,
  tags jsonb not null default '[]'::jsonb,
  author text,
  "sourceUrl" text,
  plan text,
  "planModel" text,
  "planGeneratedAt" timestamptz,
  "completedAt" timestamptz,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

alter table public.ideas enable row level security;

create or replace function public.set_ideas_updated_at()
returns trigger
language plpgsql
as $$
begin
  new."updatedAt" = now();
  return new;
end;
$$;

drop trigger if exists trg_ideas_updated_at on public.ideas;
create trigger trg_ideas_updated_at
  before update on public.ideas
  for each row
  execute function public.set_ideas_updated_at();

create index if not exists idx_ideas_user_status_created
  on public.ideas (user_id, status, "createdAt" desc);

create index if not exists idx_ideas_user_hidden_snoozed
  on public.ideas (user_id, hidden, "snoozedUntil");
