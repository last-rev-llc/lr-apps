drop policy if exists "Authenticated users can read templates" on public.meme_templates;
drop index if exists public.idx_meme_templates_active_order;
drop table if exists public.meme_templates;
