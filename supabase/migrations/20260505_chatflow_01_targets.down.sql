drop trigger if exists trg_chatflow_targets_updated_at on public.chatflow_targets;
drop function if exists public.set_chatflow_targets_updated_at();
drop policy if exists "chatflow_targets_delete" on public.chatflow_targets;
drop policy if exists "chatflow_targets_update" on public.chatflow_targets;
drop policy if exists "chatflow_targets_insert" on public.chatflow_targets;
drop policy if exists "chatflow_targets_select" on public.chatflow_targets;
drop index if exists public.idx_chatflow_targets_user;
drop table if exists public.chatflow_targets;
-- Intentionally do not drop the pgsodium extension; other migrations may depend on it.
