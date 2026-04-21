-- Reverse 002_subscriptions.sql
drop index if exists idx_subscriptions_stripe_customer_id;
drop index if exists idx_subscriptions_user_id;
drop policy if exists "Users read own subscription" on public.subscriptions;
drop table if exists public.subscriptions;
