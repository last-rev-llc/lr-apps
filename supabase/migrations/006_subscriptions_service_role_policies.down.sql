-- Rollback for 006_subscriptions_service_role_policies.sql

drop index if exists public.idx_subscriptions_stripe_subscription_id;

drop policy if exists "Service role updates subscriptions" on public.subscriptions;
drop policy if exists "Service role inserts subscriptions" on public.subscriptions;

-- idx_subscriptions_user_id is owned by 002_subscriptions.sql; leave it in place.
