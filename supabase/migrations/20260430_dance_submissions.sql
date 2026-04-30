-- Backs the Roblox Dances submission flow. id is text (the client emits
-- `sub-${Date.now()}`). Submissions are anonymous (`submitted_by`
-- defaults to 'anonymous'); RLS left disabled so the browser anon key
-- can upsert without per-user policy machinery — matches the app's
-- existing path at dance-app.tsx:498-513.
create table if not exists public.dance_submissions (
  id text primary key,
  name text not null,
  emoji text not null default '🎵',
  description text not null,
  difficulty text not null default 'intermediate'
    check (difficulty in ('beginner', 'intermediate', 'advanced', 'expert')),
  tags jsonb not null default '[]'::jsonb,
  submitted_by text not null default 'anonymous',
  status text not null default 'pending'
    check (status in ('pending', 'approved')),
  created_at timestamptz not null default now()
);

create index if not exists idx_dance_submissions_status_created
  on public.dance_submissions (status, created_at desc);
