-- Read-only catalog backing the public Travel Collection app
-- (auth=false). RLS enabled with a permissive public-read policy so
-- anonymous SSR (and any future browser direct-read) can render the
-- gallery without an Auth0 session. No in-app writes — rows arrive via
-- seed scripts / external admin tooling.
--
-- "researched/pending" is a single boolean (`researched`); "pending" is
-- derived as `!researched` in the UI. Don't add a status enum.
create table if not exists public.travel_properties (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location text not null default '',
  region text not null default '',
  category text not null default '',
  type text not null default '',
  description text,
  website text,
  pricing text,
  photos jsonb,
  amenities jsonb,
  highlights jsonb,
  tags jsonb,
  rating numeric check (rating is null or rating between 0 and 5),
  researched boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.travel_properties enable row level security;

create policy "travel_properties_public_read"
  on public.travel_properties for select
  using (true);

create or replace function public.set_travel_properties_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_travel_properties_updated_at
  before update on public.travel_properties
  for each row execute function public.set_travel_properties_updated_at();

create index if not exists idx_travel_properties_category
  on public.travel_properties (category);
create index if not exists idx_travel_properties_region
  on public.travel_properties (region);
create index if not exists idx_travel_properties_type
  on public.travel_properties (type);
create index if not exists idx_travel_properties_name
  on public.travel_properties (name);
