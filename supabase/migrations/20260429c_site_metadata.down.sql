drop trigger if exists set_site_metadata_updated_at on public.site_metadata;
drop policy if exists "Authenticated read site metadata" on public.site_metadata;
drop table if exists public.site_metadata;
