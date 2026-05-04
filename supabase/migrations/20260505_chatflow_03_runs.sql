-- Run history shared by both chatflow apps. `mode` distinguishes eval (drives
-- a question_set against a target) vs csv (executes a per-row prompt template
-- over an uploaded CSV). target_id uses on delete restrict so a user can't
-- silently orphan run rows by deleting the target — they have to clear
-- history first.
do $$ begin
  if not exists (select 1 from pg_type where typname = 'chatflow_run_mode') then
    create type public.chatflow_run_mode as enum ('eval', 'csv');
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type where typname = 'chatflow_run_status') then
    create type public.chatflow_run_status as enum (
      'queued', 'running', 'completed', 'cancelled', 'errored'
    );
  end if;
end $$;

create table if not exists public.chatflow_runs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  target_id uuid not null references public.chatflow_targets(id) on delete restrict,

  mode public.chatflow_run_mode not null,
  status public.chatflow_run_status not null default 'queued',

  question_set_id uuid references public.question_sets(id) on delete set null,
  upload_storage_path text,

  prompt_template text,
  tag text,
  concurrency integer not null default 3 check (concurrency between 1 and 100),

  total_rows integer not null default 0,
  completed_rows integer not null default 0,
  errored_rows integer not null default 0,

  results_storage_path text,

  "startedAt" timestamptz,
  "finishedAt" timestamptz,
  error text,

  "createdAt" timestamptz not null default now()
);

alter table public.chatflow_runs enable row level security;

drop policy if exists "chatflow_runs_select" on public.chatflow_runs;
create policy "chatflow_runs_select"
  on public.chatflow_runs for select
  using (auth.uid() = user_id);

drop policy if exists "chatflow_runs_insert" on public.chatflow_runs;
create policy "chatflow_runs_insert"
  on public.chatflow_runs for insert
  with check (auth.uid() = user_id);

drop policy if exists "chatflow_runs_update" on public.chatflow_runs;
create policy "chatflow_runs_update"
  on public.chatflow_runs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "chatflow_runs_delete" on public.chatflow_runs;
create policy "chatflow_runs_delete"
  on public.chatflow_runs for delete
  using (auth.uid() = user_id);

create table if not exists public.chatflow_run_rows (
  id uuid default gen_random_uuid() primary key,
  run_id uuid not null references public.chatflow_runs(id) on delete cascade,

  position integer not null,
  uid text not null,
  input jsonb not null default '{}'::jsonb,
  status public.chatflow_run_status not null default 'queued',
  response_text text,
  response_json jsonb,
  langfuse_link text,
  error text,
  "startedAt" timestamptz,
  "finishedAt" timestamptz,

  unique (run_id, uid)
);

alter table public.chatflow_run_rows enable row level security;

drop policy if exists "chatflow_run_rows_select" on public.chatflow_run_rows;
create policy "chatflow_run_rows_select"
  on public.chatflow_run_rows for select
  using (
    exists (
      select 1 from public.chatflow_runs r
      where r.id = chatflow_run_rows.run_id
        and r.user_id = auth.uid()
    )
  );

drop policy if exists "chatflow_run_rows_insert" on public.chatflow_run_rows;
create policy "chatflow_run_rows_insert"
  on public.chatflow_run_rows for insert
  with check (
    exists (
      select 1 from public.chatflow_runs r
      where r.id = chatflow_run_rows.run_id
        and r.user_id = auth.uid()
    )
  );

drop policy if exists "chatflow_run_rows_update" on public.chatflow_run_rows;
create policy "chatflow_run_rows_update"
  on public.chatflow_run_rows for update
  using (
    exists (
      select 1 from public.chatflow_runs r
      where r.id = chatflow_run_rows.run_id
        and r.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.chatflow_runs r
      where r.id = chatflow_run_rows.run_id
        and r.user_id = auth.uid()
    )
  );

drop policy if exists "chatflow_run_rows_delete" on public.chatflow_run_rows;
create policy "chatflow_run_rows_delete"
  on public.chatflow_run_rows for delete
  using (
    exists (
      select 1 from public.chatflow_runs r
      where r.id = chatflow_run_rows.run_id
        and r.user_id = auth.uid()
    )
  );

create index if not exists idx_chatflow_runs_user_started
  on public.chatflow_runs (user_id, "startedAt" desc);

create index if not exists idx_chatflow_run_rows_run
  on public.chatflow_run_rows (run_id, position);
