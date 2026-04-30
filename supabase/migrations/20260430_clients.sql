-- Reconstructive migration capturing the schema implicitly required by
-- apps/web/app/apps/accounts/. The Accounts app is read-only; rows are
-- seeded out of band (or via the e2e helpers proposed in
-- docs/superpowers/plans/2026-04-30-accounts-e2e-testing.md).
--
-- JSON-as-text (not jsonb) is intentional: queries.ts:27-33 calls
-- JSON.parse only when typeof === "string". Switching these blob
-- columns to jsonb would bypass that loop and silently break shapes
-- that are already shipped as encoded strings.
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text,
  health text,
  industry text,
  urls text,
  contacts text,
  github text,
  jira text,
  netlify text,
  contracts text,
  "contentfulSpaces" text,
  standup text,
  highlights text,
  challenges text,
  "upcomingFocus" text,
  "upcomingMeetings" text,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

-- Default-deny: app reads via service-role client; anon should not see
-- this table directly. Same pattern as public.ideas post-Auth0.
alter table public.clients enable row level security;

create index if not exists idx_clients_name on public.clients (name);
