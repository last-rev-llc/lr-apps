-- Auth0 emits string user IDs (e.g. "google-oauth2|...") that don't fit
-- in `user_id uuid` columns. Switch the three user-keyed tables to text,
-- drop the FKs to auth.users (Auth0 doesn't populate that table), and drop
-- the RLS policies that reference auth.uid() = user_id (auth.uid() is null
-- under Auth0, so they grant nothing today; access flows through the
-- service-role client).
--
-- Existing rows are stale UUIDs from a Supabase-Auth-era setup and are not
-- linked to any current Auth0 user — drop them. Users will be re-created on
-- normal signup; Stripe webhooks will rebuild app_subscriptions on the next
-- subscription event.

-- 1. Drop policies that reference auth.uid() on these tables.
do $$
declare pol record;
begin
  for pol in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('app_permissions', 'app_subscriptions', 'app_profiles')
      and (qual like '%auth.uid()%' or with_check like '%auth.uid()%')
  loop
    execute format('drop policy %I on %I.%I',
                   pol.policyname, pol.schemaname, pol.tablename);
  end loop;
end $$;

-- 2. Drop foreign keys to auth.users (constraint names may vary across envs).
do $$
declare c record;
begin
  for c in
    select con.conname, rel.relname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname in ('app_permissions', 'app_subscriptions', 'app_profiles')
      and con.contype = 'f'
      and exists (
        select 1 from pg_class r2
        join pg_namespace n2 on n2.oid = r2.relnamespace
        where r2.oid = con.confrelid
          and n2.nspname = 'auth'
          and r2.relname = 'users'
      )
  loop
    execute format('alter table public.%I drop constraint %I',
                   c.relname, c.conname);
  end loop;
end $$;

-- 3. Drop stale rows so we can change the column type without conversion
--    surprises. Users re-create on normal signup.
delete from public.app_permissions;
delete from public.app_subscriptions;
delete from public.app_profiles;

-- 4. Switch user_id to text on each table.
alter table public.app_permissions
  alter column user_id type text using user_id::text;

alter table public.app_subscriptions
  alter column user_id type text using user_id::text;

alter table public.app_profiles
  alter column user_id type text using user_id::text;
