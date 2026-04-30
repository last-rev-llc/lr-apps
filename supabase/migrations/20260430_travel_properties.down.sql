drop index if exists public.idx_travel_properties_name;
drop index if exists public.idx_travel_properties_type;
drop index if exists public.idx_travel_properties_region;
drop index if exists public.idx_travel_properties_category;
drop trigger if exists trg_travel_properties_updated_at on public.travel_properties;
drop function if exists public.set_travel_properties_updated_at();
drop policy if exists "travel_properties_public_read" on public.travel_properties;
drop table if exists public.travel_properties;
