-- Create audit_log table for M11 audit middleware writes
create table if not exists public.audit_log (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  action text not null,
  resource text not null,
  metadata jsonb,
  created_at timestamptz default now() not null
);

-- Enable RLS (default-deny)
alter table public.audit_log enable row level security;

-- Authenticated users may only INSERT rows where they are the user_id.
-- No SELECT/UPDATE/DELETE policy is created for the authenticated role,
-- so RLS will deny those operations by default.
create policy "Users insert own audit log"
  on public.audit_log for insert
  with check (auth.uid() = user_id);

-- Service role bypass: full access for server-side writes.
create policy "Service role full access"
  on public.audit_log for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Indexes for Command Center admin queries.
create index idx_audit_log_user_created
  on public.audit_log(user_id, created_at desc);

create index idx_audit_log_action
  on public.audit_log(action);
