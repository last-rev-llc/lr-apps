-- Seed data applied after migrations during local Supabase setup.
-- All inserts are idempotent.
--
-- For seed data that needs to ship to every environment (preview / staging /
-- prod), add it as a *data migration* under supabase/migrations/ instead.
-- See docs/guides/migrations.md "Data migrations" for the pattern (e.g.
-- 20260430_dad_jokes_data.sql, 20260430_slang_data.sql). This file is for
-- local-dev-only fixtures.

-- M8 tier enforcement is gated; default off so rollout is opt-in.
-- (Also seeded by 006_feature_flags.sql; kept here so a fresh local DB
-- without migrations applied still gets the row.)
insert into public.feature_flags (key, enabled)
values ('tier_enforcement_enabled', false)
on conflict do nothing;
