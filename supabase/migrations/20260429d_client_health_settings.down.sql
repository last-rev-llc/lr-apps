drop trigger if exists set_client_health_settings_updated_at on public.client_health_settings;
drop policy if exists "Users update own settings" on public.client_health_settings;
drop policy if exists "Users insert own settings" on public.client_health_settings;
drop policy if exists "Users read own settings" on public.client_health_settings;
drop table if exists public.client_health_settings;
