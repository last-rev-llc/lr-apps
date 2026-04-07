-- Create subscriptions table for billing
create table if not exists public.subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  stripe_customer_id text,
  stripe_subscription_id text unique,
  tier text not null default 'free'
    check (tier in ('free', 'pro', 'enterprise')),
  status text not null default 'active'
    check (status in ('active', 'canceled', 'past_due', 'trialing', 'incomplete')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique(user_id)
);

-- Enable RLS
alter table public.subscriptions enable row level security;

-- Users can read their own subscription
create policy "Users read own subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- Create indexes for fast lookups
create index idx_subscriptions_user_id
  on public.subscriptions(user_id);

create index idx_subscriptions_stripe_customer_id
  on public.subscriptions(stripe_customer_id);
