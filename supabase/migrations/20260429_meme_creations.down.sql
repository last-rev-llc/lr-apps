drop trigger if exists set_meme_creations_updated_at on public.meme_creations;
drop function if exists public.set_meme_creations_updated_at();
drop policy if exists "Users delete own meme creations" on public.meme_creations;
drop policy if exists "Users update own meme creations" on public.meme_creations;
drop policy if exists "Users insert own meme creations" on public.meme_creations;
drop policy if exists "Users read own meme creations" on public.meme_creations;
drop index if exists public.idx_meme_creations_user_created;
drop table if exists public.meme_creations;
