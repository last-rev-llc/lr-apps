drop policy if exists "Auth admins read all audit log" on public.audit_log;
drop policy if exists "Users read own audit log" on public.audit_log;
drop index if exists public.idx_audit_log_action_created;
drop index if exists public.idx_audit_log_user_created;
drop table if exists public.audit_log;
