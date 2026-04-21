-- Add service-role INSERT/UPDATE policies for subscriptions so the Stripe
-- webhook handler (upsertSubscription) can write rows. The original migration
-- (002_subscriptions.sql) only created a SELECT policy for users, leaving
-- writes blocked even for the service role under RLS.

create policy "Service role inserts subscriptions"
  on public.subscriptions for insert
  with check (auth.role() = 'service_role');

create policy "Service role updates subscriptions"
  on public.subscriptions for update
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Lookup index for webhook handler: stripe_subscription_id is referenced on
-- every event to find the existing row. Without this, each event scanned the
-- whole subscriptions table.
create index if not exists idx_subscriptions_stripe_subscription_id
  on public.subscriptions(stripe_subscription_id);

-- idx_subscriptions_user_id was already created in 002_subscriptions.sql:27.
-- Use IF NOT EXISTS to be safe if 002 is ever changed.
create index if not exists idx_subscriptions_user_id
  on public.subscriptions(user_id);
