drop trigger if exists trg_ideas_updated_at on public.ideas;
drop function if exists public.set_ideas_updated_at();
drop index if exists public.idx_ideas_user_hidden_snoozed;
drop index if exists public.idx_ideas_user_status_created;
drop table if exists public.ideas;
