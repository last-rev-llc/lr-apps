-- Create leads table for Sales pipeline dashboard
-- Also used by Command Center leads module
create table if not exists public.leads (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  domain text not null,
  industry text,
  size text,
  location text,
  description text,
  "fitScore" integer,
  "fitReasons" jsonb default '[]'::jsonb,
  "talkingPoints" jsonb default '[]'::jsonb,
  "techStack" jsonb default '{}'::jsonb,
  people jsonb default '[]'::jsonb,
  news jsonb default '[]'::jsonb,
  "socialLinks" jsonb default '{}'::jsonb,
  source text,
  "researchedAt" timestamptz,
  stage text check (stage in ('prospect', 'outreach', 'qualified', 'proposal', 'closed')),
  "createdAt" timestamptz default now() not null
);

-- Enable RLS
alter table public.leads enable row level security;

-- Authenticated users can read leads
create policy "Authenticated users can read leads"
  on public.leads for select
  using (auth.role() = 'authenticated');

-- Index for pipeline view ordering
create index if not exists idx_leads_stage_score
  on public.leads(stage, "fitScore" desc);
