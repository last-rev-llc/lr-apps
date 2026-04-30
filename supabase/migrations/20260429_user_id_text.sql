-- Auth0 emits string user IDs (e.g. "google-oauth2|...") that don't fit
-- in `user_id uuid` columns. Switch every user-keyed table to text, drop
-- the FKs to auth.users (Auth0 doesn't populate that table), and drop the
-- RLS policies that reference user_id — auth.uid() is null under Auth0,
-- so the policies grant nothing today; access flows through the
-- service-role client.

-- 1. Drop ANY policy on the target tables, plus any policy on other
--    tables whose qual/with_check joins to one of them (e.g. feature_flags
--    and audit_log "Auth admins ..." policies that select from
--    app_permissions). They'd otherwise block the column-type alters in
--    step 4 and grant nothing under Auth0 anyway.
do $$
declare pol record;
begin
  for pol in
    select schemaname, tablename, policyname
    from pg_policies
    where (schemaname = 'public'
           and tablename in ('app_permissions', 'ideas', 'subscriptions',
                             'feature_flags', 'audit_log'))
       or coalesce(qual, '') || ' ' || coalesce(with_check, '')
          ~ '\m(app_permissions|ideas|subscriptions|feature_flags|audit_log)\M'
  loop
    execute format('drop policy %I on %I.%I',
                   pol.policyname, pol.schemaname, pol.tablename);
  end loop;
end $$;

-- 2. Drop foreign keys from these tables to auth.users (constraint names
--    may vary across envs).
do $$
declare c record;
begin
  for c in
    select con.conname, rel.relname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname in ('app_permissions', 'ideas', 'subscriptions',
                          'feature_flags', 'audit_log')
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

-- 3. Drop stale per-user rows so we can change the column type without
--    conversion surprises. Users re-create on normal signup; Stripe
--    webhooks rebuild subscriptions on the next subscription event.
--    feature_flags keeps null-user_id rows (global defaults like the
--    'tier_enforcement_enabled' seed); audit_log keeps history (uuid::text
--    converts cleanly and the rows are still useful for forensics).
delete from public.app_permissions;
delete from public.ideas;
delete from public.subscriptions;
delete from public.feature_flags where user_id is not null;

-- 4. Switch user_id to text on each table.
alter table public.app_permissions
  alter column user_id type text using user_id::text;

alter table public.ideas
  alter column user_id type text using user_id::text;

alter table public.subscriptions
  alter column user_id type text using user_id::text;

alter table public.feature_flags
  alter column user_id type text using user_id::text;

alter table public.audit_log
  alter column user_id type text using user_id::text;
