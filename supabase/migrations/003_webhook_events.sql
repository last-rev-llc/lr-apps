-- Create table to track processed Stripe webhook events for idempotency
create table if not exists public.processed_webhook_events (
  event_id text primary key,
  processed_at timestamptz default now() not null
);

-- No RLS — only accessible via service role key (server-side only)
