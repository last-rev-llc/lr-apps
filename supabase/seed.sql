-- Seed data applied after migrations during local Supabase setup.
-- All inserts are idempotent.

-- M8 tier enforcement is gated; default off so rollout is opt-in.
insert into public.feature_flags (key, enabled)
values ('tier_enforcement_enabled', false)
on conflict do nothing;
