-- Create feature_flags table for runtime gating per-user, per-tier, or globally.
create table if not exists public.feature_flags (
  id uuid default gen_random_uuid() primary key,
  key text not null,
  user_id uuid references auth.users(id) on delete cascade,
  tier text check (tier in ('free', 'pro', 'enterprise')),
  enabled boolean not null default false,
  created_at timestamptz default now() not null,
  -- A given user has at most one row per key
  unique (key, user_id)
);

-- Exactly one global default row per key (where user_id and tier are both null)
create unique index if not exists idx_feature_flags_global_unique
  on public.feature_flags (key)
  where user_id is null and tier is null;

-- Lookup index for getFeatureFlagValue resolution
create index if not exists idx_feature_flags_key
  on public.feature_flags (key);

-- Enable RLS
alter table public.feature_flags enable row level security;

-- Auth admins can manage all flags (mirrors app_permissions pattern)
create policy "Auth admins manage all flags"
  on public.feature_flags for all
  using (
    exists (
      select 1 from public.app_permissions
      where user_id = auth.uid()
      and app_slug = 'command-center'
      and permission = 'admin'
    )
  );

-- Authenticated users can read flags that apply to them (for client-side checks)
create policy "Users read own flags"
  on public.feature_flags for select
  using (
    user_id = auth.uid()
    or user_id is null
  );

-- Seed: tier_enforcement_enabled disabled by default (gates M8 enforcement).
insert into public.feature_flags (key, enabled)
values ('tier_enforcement_enabled', false)
on conflict do nothing;
