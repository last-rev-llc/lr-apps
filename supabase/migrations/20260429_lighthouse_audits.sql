-- Aligns the dev/staging migration trail with the production schema for
-- the Lighthouse mini-app. Production was provisioned outside this
-- migration system as a single denormalized table (`public.lighthouse_audits`)
-- where each row is one tracked site and the audit history lives in a
-- JSONB array. The earlier `20260409_lighthouse.sql` migration created a
-- normalized `lighthouse_sites` + `lighthouse_runs` pair that never made it
-- to prod, and the app code now reads `lighthouse_audits` directly.
--
-- This migration is idempotent so it's safe to run against:
--   - prod (table already exists; CREATE TABLE IF NOT EXISTS is a no-op),
--   - dev/staging that previously applied 20260409 (legacy tables get dropped),
--   - a fresh DB (creates lighthouse_audits cleanly).
--
-- Append-only per CLAUDE.md: the 20260409_lighthouse.sql files stay in place;
-- this migration supersedes them by dropping their tables and creating the
-- right one.

drop table if exists public.lighthouse_runs cascade;
drop table if exists public.lighthouse_sites cascade;

create table if not exists public.lighthouse_audits (
  id text primary key,
  site text not null,
  url text,
  audits jsonb not null default '[]'::jsonb,
  "createdAt" text,
  "updatedAt" text
);

alter table public.lighthouse_audits enable row level security;

-- Use a DO block so the create policy is conditional — production may
-- already have its own read policy and `CREATE POLICY` doesn't support
-- IF NOT EXISTS until Postgres 17.
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'lighthouse_audits'
      and policyname = 'lighthouse_audits_select'
  ) then
    create policy "lighthouse_audits_select"
      on public.lighthouse_audits for select
      using (auth.role() = 'authenticated');
  end if;
end
$$;
