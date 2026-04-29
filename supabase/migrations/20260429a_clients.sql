-- Create clients table for the client-health mini-app.
-- Side-effect: partially unblocks the accounts app, which queries a
-- previously-missing public.clients table. See
-- docs/guides/promote-client-health-to-app.md for the full plan.

-- Standard updatedAt trigger function. Defined here as the first user;
-- subsequent migrations reuse it via:
--   create trigger ... before update on <table>
--     for each row execute function public.set_updated_at();
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new."updatedAt" = now();
  return new;
end;
$$;

create table if not exists public.clients (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,

  name text not null check (length(trim(name)) > 0),
  industry text,
  status text not null default 'active'
    check (status in ('active', 'paused', 'churned', 'prospect')),

  "contractStatus" text check ("contractStatus" in ('active', 'expiring-soon', 'expired', 'none')),
  "contractEndDate" date,

  "primaryContactName" text,
  "primaryContactEmail" text,
  notes text,

  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

alter table public.clients enable row level security;

create policy "Users read own clients"
  on public.clients for select
  using (auth.uid() = user_id);

create policy "Users insert own clients"
  on public.clients for insert
  with check (auth.uid() = user_id);

create policy "Users update own clients"
  on public.clients for update
  using (auth.uid() = user_id);

create policy "Users delete own clients"
  on public.clients for delete
  using (auth.uid() = user_id);

create index if not exists idx_clients_user_status
  on public.clients(user_id, status);

create trigger set_clients_updated_at
  before update on public.clients
  for each row execute function public.set_updated_at();
