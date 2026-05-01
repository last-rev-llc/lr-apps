-- CRM contacts. The table predates this repo on some environments; the
-- migration is idempotent and non-destructive so applying it to an
-- environment where contacts already exists is a no-op for column shape
-- and only adds RLS / trigger / indexes.
--
-- Access control: a single permissive policy gates `all` for any
-- authenticated user. Per-app permission gating happens at the app
-- layer via requireAppLayoutAccess("crm") (admin permission), so the
-- DB policy is intentionally org-shared rather than per-row ownership.

create table if not exists public.contacts (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  email               text,
  phone               text,
  title               text,
  company             text,
  type                text check (
    type in ('team','client','prospect','partner','vendor','contractor','personal','other')
  ),
  avatar              text,
  location            text,
  timezone            text,
  slack_id            text,
  slack_handle        text,
  github_handle       text,
  linkedin_url        text,
  twitter_handle      text,
  website             text,
  tags                jsonb not null default '[]'::jsonb,
  notes               text,
  insights            jsonb,
  last_researched_at  timestamptz,
  confidence          text,
  source              text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

alter table public.contacts enable row level security;

-- Policy creation must be idempotent; CREATE POLICY raises on duplicates,
-- so drop-then-create.
drop policy if exists "crm admins manage contacts" on public.contacts;
create policy "crm admins manage contacts"
  on public.contacts
  for all
  to authenticated
  using (true)
  with check (true);

create or replace function public.set_contacts_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_contacts_updated_at on public.contacts;
create trigger trg_contacts_updated_at
  before update on public.contacts
  for each row
  execute function public.set_contacts_updated_at();

create index if not exists idx_contacts_name             on public.contacts (name);
create index if not exists idx_contacts_company          on public.contacts (company);
create index if not exists idx_contacts_type             on public.contacts (type);
create index if not exists idx_contacts_last_researched  on public.contacts (last_researched_at desc nulls last);
