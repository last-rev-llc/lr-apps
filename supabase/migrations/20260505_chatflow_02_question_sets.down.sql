drop policy if exists "question_set_items_delete" on public.question_set_items;
drop policy if exists "question_set_items_update" on public.question_set_items;
drop policy if exists "question_set_items_insert" on public.question_set_items;
drop policy if exists "question_set_items_select" on public.question_set_items;
drop index if exists public.idx_question_set_items_set_position;
drop table if exists public.question_set_items;

drop trigger if exists trg_question_sets_updated_at on public.question_sets;
drop function if exists public.set_question_sets_updated_at();
drop policy if exists "question_sets_delete" on public.question_sets;
drop policy if exists "question_sets_update" on public.question_sets;
drop policy if exists "question_sets_insert" on public.question_sets;
drop policy if exists "question_sets_select" on public.question_sets;
drop index if exists public.idx_question_sets_user_target;
drop table if exists public.question_sets;
