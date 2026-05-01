-- Reverse of 20260501_crm_contacts.sql.
-- Drops trigger, function, policy, and indexes — but NOT the table,
-- since the contacts data predates this repo on some environments.

drop trigger if exists trg_contacts_updated_at on public.contacts;
drop function if exists public.set_contacts_updated_at();
drop policy if exists "crm admins manage contacts" on public.contacts;
drop index if exists public.idx_contacts_last_researched;
drop index if exists public.idx_contacts_type;
drop index if exists public.idx_contacts_company;
drop index if exists public.idx_contacts_name;
