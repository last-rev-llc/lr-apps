-- Reconstructive migration for the Uptime dashboard. Columns match the
-- Site TypeScript type so apps/web/app/apps/uptime/page.tsx can cast
-- .select("*") directly with no adapter (mirrors the public.ideas
-- quoted-camelCase convention). Rows arrive from the external
-- status-pulse repo; no in-app writes.
create table if not exists public.sites (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  url text not null,
  description text,
  status text not null default 'up'
    check (status in ('up', 'down', 'degraded')),
  "responseTimeMs" integer,
  "uptimePercent" numeric,
  "lastChecked" timestamptz,
  history jsonb not null default '[]'::jsonb,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

alter table public.sites enable row level security;

create or replace function public.set_sites_updated_at()
returns trigger
language plpgsql
as $$
begin
  new."updatedAt" = now();
  return new;
end;
$$;

create trigger trg_sites_updated_at
  before update on public.sites
  for each row execute function public.set_sites_updated_at();

create index if not exists idx_sites_name on public.sites (name);
create index if not exists idx_sites_status on public.sites (status);
