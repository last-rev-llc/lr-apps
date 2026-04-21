-- Rollback for 005_audit_log.sql
drop index if exists public.idx_audit_log_action;
drop index if exists public.idx_audit_log_user_created;

drop policy if exists "Service role full access" on public.audit_log;
drop policy if exists "Users insert own audit log" on public.audit_log;

drop table if exists public.audit_log;
