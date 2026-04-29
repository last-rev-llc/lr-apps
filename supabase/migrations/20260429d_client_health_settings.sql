-- Per-user alert preferences for the client-health app.
-- One row per user_id (PK on user_id; no separate id column).
create table if not exists public.client_health_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,

  "emailEnabled" boolean not null default true,
  "alertEmail" text,
  "sslWarnDays" integer not null default 30 check ("sslWarnDays" between 1 and 365),
  "healthDropThreshold" integer not null default 20 check ("healthDropThreshold" between 1 and 100),

  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

alter table public.client_health_settings enable row level security;

create policy "Users read own settings"
  on public.client_health_settings for select
  using (auth.uid() = user_id);

create policy "Users insert own settings"
  on public.client_health_settings for insert
  with check (auth.uid() = user_id);

create policy "Users update own settings"
  on public.client_health_settings for update
  using (auth.uid() = user_id);

create trigger set_client_health_settings_updated_at
  before update on public.client_health_settings
  for each row execute function public.set_updated_at();
