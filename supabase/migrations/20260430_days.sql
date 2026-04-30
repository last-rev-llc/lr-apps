-- Reconstructive migration for the Standup app. Columns match the
-- StandupDay TypeScript type so .select("*") -> StandupDay[] needs no
-- adapter. Rows come from an external aggregation pipeline; the app is
-- read-only.
--
-- id is text (not uuid) so e2e helpers can prefix-scope cleanup
-- (`e2e-standup-${Date.now()}-...`) — the table has no user_id, so
-- per-row deletion has to key on id, not user.
create table if not exists public.days (
  id text primary key,
  date date not null,
  "dayOfWeek" text not null,
  activities jsonb not null default '[]'::jsonb,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

alter table public.days enable row level security;

create or replace function public.set_days_updated_at()
returns trigger
language plpgsql
as $$
begin
  new."updatedAt" = now();
  return new;
end;
$$;

create trigger trg_days_updated_at
  before update on public.days
  for each row execute function public.set_days_updated_at();

create index if not exists idx_days_date_desc on public.days (date desc);
