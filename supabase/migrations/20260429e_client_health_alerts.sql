-- Stored pro-tier alerts for the client-health app.
-- Drives in-UI alert history and de-dupe (don't email twice for the same
-- SSL warning, ticket spike, etc.).
create table if not exists public.client_health_alerts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  -- Nullable: not every alert is scoped to a single client (e.g. a global
  -- health-score-drop summary). Cascades when the parent client is deleted.
  "clientId" uuid references public.clients(id) on delete cascade,

  type text not null check (
    type in ('site-down', 'ssl-expiring', 'ssl-expired', 'ticket-spike', 'health-score-drop')
  ),
  severity text not null check (severity in ('info', 'warning', 'critical')),

  title text,
  message text,

  "deliveredAt" timestamptz,
  "acknowledgedAt" timestamptz,
  "createdAt" timestamptz not null default now()
);

alter table public.client_health_alerts enable row level security;

create policy "Users read own alerts"
  on public.client_health_alerts for select
  using (auth.uid() = user_id);

create policy "Users insert own alerts"
  on public.client_health_alerts for insert
  with check (auth.uid() = user_id);

create policy "Users update own alerts"
  on public.client_health_alerts for update
  using (auth.uid() = user_id);

create policy "Users delete own alerts"
  on public.client_health_alerts for delete
  using (auth.uid() = user_id);

create index if not exists idx_client_health_alerts_user_created
  on public.client_health_alerts(user_id, "createdAt" desc);
