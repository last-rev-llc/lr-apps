drop trigger if exists trg_days_updated_at on public.days;
drop function if exists public.set_days_updated_at();
drop index if exists public.idx_days_date_desc;
drop table if exists public.days;
