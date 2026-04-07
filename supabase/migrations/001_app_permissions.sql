-- Create app_permissions table
create table if not exists public.app_permissions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  app_slug text not null,
  permission text not null
    check (permission in ('view', 'edit', 'admin')),
  created_at timestamptz default now() not null,
  unique(user_id, app_slug)
);

-- Enable RLS
alter table public.app_permissions enable row level security;

-- Users can read their own permissions
create policy "Users read own permissions"
  on public.app_permissions for select
  using (auth.uid() = user_id);

-- Admins of the auth app can manage all permissions
create policy "Auth admins manage all permissions"
  on public.app_permissions for all
  using (
    exists (
      select 1 from public.app_permissions
      where user_id = auth.uid()
      and app_slug = 'auth'
      and permission = 'admin'
    )
  );

-- Create index for fast permission lookups
create index idx_app_permissions_user_app
  on public.app_permissions(user_id, app_slug);

-- BOOTSTRAP: After running this migration and creating your first user account,
-- run the following to grant yourself admin access (replace the UUID):
--
-- insert into public.app_permissions (user_id, app_slug, permission)
-- values ('<your-user-id>', 'auth', 'admin');
