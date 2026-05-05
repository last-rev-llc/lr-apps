-- Reverse 20260502_ai_eval_chatflow_targets.sql.
-- pgsodium extension is left in place because other features may depend on it.

drop function if exists public.chatflow_targets_decrypt_token(uuid, uuid);
drop function if exists public.chatflow_targets_update(uuid, uuid, text, text, text, text, uuid);
drop function if exists public.chatflow_targets_create(uuid, text, text, text, text, uuid);

drop view if exists public.chatflow_targets;

drop trigger if exists trg_chatflow_targets_updated_at on ai_eval.chatflow_targets;
drop function if exists ai_eval.set_chatflow_targets_updated_at();

drop policy if exists "users read own chatflow targets" on ai_eval.chatflow_targets;

drop index if exists ai_eval.idx_chatflow_targets_user_id;
drop table if exists ai_eval.chatflow_targets;

drop schema if exists ai_eval;
