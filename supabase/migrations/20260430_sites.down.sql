drop trigger if exists trg_sites_updated_at on public.sites;
drop function if exists public.set_sites_updated_at();
drop index if exists public.idx_sites_status;
drop index if exists public.idx_sites_name;
drop table if exists public.sites;
