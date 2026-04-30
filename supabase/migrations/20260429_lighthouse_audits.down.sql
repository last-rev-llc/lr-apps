-- Reverses 20260429_lighthouse_audits.sql. Drops only what this migration
-- created — it does NOT recreate the legacy lighthouse_sites /
-- lighthouse_runs tables. Re-running 20260409_lighthouse.sql restores
-- those if needed.

drop policy if exists "lighthouse_audits_select" on public.lighthouse_audits;
drop table if exists public.lighthouse_audits;
