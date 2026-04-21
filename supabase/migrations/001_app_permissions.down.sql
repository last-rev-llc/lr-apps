-- Reverse 001_app_permissions.sql
drop index if exists idx_app_permissions_user_app;
drop policy if exists "Auth admins manage all permissions" on public.app_permissions;
drop policy if exists "Users read own permissions" on public.app_permissions;
drop table if exists public.app_permissions;
