drop trigger if exists trg_meme_creations_updated_at on public.meme_creations;
drop function if exists public.set_meme_creations_updated_at();
drop policy if exists "meme_creations_delete" on public.meme_creations;
drop policy if exists "meme_creations_update" on public.meme_creations;
drop policy if exists "meme_creations_insert" on public.meme_creations;
drop policy if exists "meme_creations_select" on public.meme_creations;
drop index if exists public.idx_meme_creations_user_created;
drop table if exists public.meme_creations;
