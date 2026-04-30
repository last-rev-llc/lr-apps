-- Reverts the user_id text conversion back to uuid. Only safe on empty
-- tables — Auth0 string IDs (e.g. "google-oauth2|...") cannot cast back
-- to uuid. Clear rows manually before applying if needed.
--
-- Note: the original RLS policies and FKs to auth.users are NOT restored
-- here, since they were the bug being removed.

alter table public.app_permissions
  alter column user_id type uuid using user_id::uuid;

alter table public.ideas
  alter column user_id type uuid using user_id::uuid;

alter table public.subscriptions
  alter column user_id type uuid using user_id::uuid;

alter table public.feature_flags
  alter column user_id type uuid using user_id::uuid;

alter table public.audit_log
  alter column user_id type uuid using user_id::uuid;
