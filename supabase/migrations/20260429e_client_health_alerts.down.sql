drop policy if exists "Users delete own alerts" on public.client_health_alerts;
drop policy if exists "Users update own alerts" on public.client_health_alerts;
drop policy if exists "Users insert own alerts" on public.client_health_alerts;
drop policy if exists "Users read own alerts" on public.client_health_alerts;
drop index if exists public.idx_client_health_alerts_user_created;
drop table if exists public.client_health_alerts;
