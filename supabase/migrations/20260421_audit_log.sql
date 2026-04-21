-- Create audit_log table for security-relevant events (auth, billing, admin actions).
create table if not exists public.audit_log (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  resource text,
  metadata jsonb default '{}'::jsonb not null,
  ip_address inet,
  user_agent text,
  created_at timestamptz default now() not null
);

alter table public.audit_log enable row level security;

-- Users can read their own audit entries.
create policy "Users read own audit log"
  on public.audit_log for select
  using (auth.uid() = user_id);

-- Auth app admins can read all audit entries.
create policy "Auth admins read all audit log"
  on public.audit_log for select
  using (
    exists (
      select 1 from public.app_permissions
      where user_id = auth.uid()
      and app_slug = 'auth'
      and permission = 'admin'
    )
  );

-- No insert/update/delete policies: all writes go through the service-role client.

create index if not exists idx_audit_log_user_created
  on public.audit_log(user_id, created_at desc);

create index if not exists idx_audit_log_action_created
  on public.audit_log(action, created_at desc);
