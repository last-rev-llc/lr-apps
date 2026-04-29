drop trigger if exists set_clients_updated_at on public.clients;
drop policy if exists "Users delete own clients" on public.clients;
drop policy if exists "Users update own clients" on public.clients;
drop policy if exists "Users insert own clients" on public.clients;
drop policy if exists "Users read own clients" on public.clients;
drop index if exists public.idx_clients_user_status;
drop table if exists public.clients;
drop function if exists public.set_updated_at();
