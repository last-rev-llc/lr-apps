drop index if exists public.idx_chatflow_run_rows_run;
drop index if exists public.idx_chatflow_runs_user_started;

drop policy if exists "chatflow_run_rows_delete" on public.chatflow_run_rows;
drop policy if exists "chatflow_run_rows_update" on public.chatflow_run_rows;
drop policy if exists "chatflow_run_rows_insert" on public.chatflow_run_rows;
drop policy if exists "chatflow_run_rows_select" on public.chatflow_run_rows;
drop table if exists public.chatflow_run_rows;

drop policy if exists "chatflow_runs_delete" on public.chatflow_runs;
drop policy if exists "chatflow_runs_update" on public.chatflow_runs;
drop policy if exists "chatflow_runs_insert" on public.chatflow_runs;
drop policy if exists "chatflow_runs_select" on public.chatflow_runs;
drop table if exists public.chatflow_runs;

drop type if exists public.chatflow_run_status;
drop type if exists public.chatflow_run_mode;
