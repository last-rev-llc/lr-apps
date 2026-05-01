drop policy if exists "Public read of slang catalog" on public.slang;
drop index if exists public.idx_slang_category;
drop index if exists public.idx_slang_vibe_score;
drop table if exists public.slang;
