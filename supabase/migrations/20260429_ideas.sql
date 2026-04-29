-- Create the public.ideas table backing the Ideas mini-app.
-- Columns are quoted camelCase to match the existing Idea TypeScript type
-- so the application code in apps/web/app/apps/ideas/ does not need adapter logic.
create table if not exists public.ideas (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
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

create policy "ideas_select"
  on public.ideas for select
  using (auth.uid() = user_id);

create policy "ideas_insert"
  on public.ideas for insert
  with check (auth.uid() = user_id);

create policy "ideas_update"
  on public.ideas for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "ideas_delete"
  on public.ideas for delete
  using (auth.uid() = user_id);

create or replace function public.set_ideas_updated_at()
returns trigger
language plpgsql
as $$
begin
  new."updatedAt" = now();
  return new;
end;
$$;

create trigger trg_ideas_updated_at
  before update on public.ideas
  for each row
  execute function public.set_ideas_updated_at();

create index if not exists idx_ideas_user_status_created
  on public.ideas (user_id, status, "createdAt" desc);

create index if not exists idx_ideas_user_hidden_snoozed
  on public.ideas (user_id, hidden, "snoozedUntil");
