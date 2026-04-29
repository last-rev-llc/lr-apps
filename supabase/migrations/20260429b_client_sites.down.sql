drop trigger if exists set_client_sites_updated_at on public.client_sites;
drop policy if exists "Users delete own client sites" on public.client_sites;
drop policy if exists "Users update own client sites" on public.client_sites;
drop policy if exists "Users insert own client sites" on public.client_sites;
drop policy if exists "Users read own client sites" on public.client_sites;
drop index if exists public.idx_client_sites_user_client;
drop table if exists public.client_sites;
