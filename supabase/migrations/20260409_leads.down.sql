-- Reverse 20260409_leads.sql
drop index if exists idx_leads_stage_score;
drop policy if exists "Authenticated users can read leads" on public.leads;
drop table if exists public.leads;
