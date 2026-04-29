-- site_metadata is keyed by URL (not user_id) because SSL/cert data is
-- intrinsically site-level. Multiple users may monitor the same URL;
-- storing a single row per URL avoids duplicate TLS handshakes from
-- the SSL cron. Writes go through the service-role client
-- (@repo/db/service-role) and bypass RLS; reads are open to any
-- authenticated user.
create table if not exists public.site_metadata (
  url text primary key,

  "sslExpiry" timestamptz,
  "sslIssuer" text,
  "sslLastChecked" timestamptz,
  "sslLastError" text,

  notes text,

  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

alter table public.site_metadata enable row level security;

create policy "Authenticated read site metadata"
  on public.site_metadata for select
  using (auth.role() = 'authenticated');

-- No insert/update/delete policies: writes go through the service-role
-- client (which bypasses RLS).

create trigger set_site_metadata_updated_at
  before update on public.site_metadata
  for each row execute function public.set_updated_at();
