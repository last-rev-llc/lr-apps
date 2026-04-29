-- Create client_sites table mapping clients to monitored URLs.
-- URLs are joined to status-pulse's `sites` table by URL match.
create table if not exists public.client_sites (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  "clientId" uuid not null references public.clients(id) on delete cascade,

  label text not null,
  url text not null,

  "isPrimary" boolean not null default false,
  "openTicketCount" integer not null default 0 check ("openTicketCount" >= 0),
  "ticketsLastUpdated" timestamptz,

  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),

  unique (user_id, "clientId", url)
);

alter table public.client_sites enable row level security;

create policy "Users read own client sites"
  on public.client_sites for select
  using (auth.uid() = user_id);

create policy "Users insert own client sites"
  on public.client_sites for insert
  with check (auth.uid() = user_id);

create policy "Users update own client sites"
  on public.client_sites for update
  using (auth.uid() = user_id);

create policy "Users delete own client sites"
  on public.client_sites for delete
  using (auth.uid() = user_id);

create index if not exists idx_client_sites_user_client
  on public.client_sites(user_id, "clientId");

create trigger set_client_sites_updated_at
  before update on public.client_sites
  for each row execute function public.set_updated_at();
