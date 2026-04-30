-- Reconstructive migrations for the Summaries app's three external-source
-- tables: summaries_zoom, summaries_slack, summaries_jira. All three are
-- read-only over rows ingested by external Zoom/Slack/Jira webhooks.
--
-- tone/priority/status are intentionally plain text (no CHECK
-- constraint): the upstream pipeline may emit values the in-app pill
-- maps fall back on, and a check would reject legitimate ingested rows.
-- jsonb everywhere for list columns matches the parseJsonField path,
-- which tolerates either real arrays or JSON-encoded strings.

create table if not exists public.summaries_zoom (
  id uuid primary key default gen_random_uuid(),
  meeting_id text not null,
  meeting_topic text not null,
  short_summary text,
  long_summary text,
  action_items jsonb not null default '[]'::jsonb,
  key_decisions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.summaries_zoom enable row level security;
create index if not exists idx_summaries_zoom_created_at
  on public.summaries_zoom (created_at desc);

create table if not exists public.summaries_slack (
  id uuid primary key default gen_random_uuid(),
  thread_ts text not null,
  channel_id text not null,
  participants jsonb not null default '[]'::jsonb,
  short_summary text,
  long_summary text,
  tone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.summaries_slack enable row level security;
create index if not exists idx_summaries_slack_created_at
  on public.summaries_slack (created_at desc);
create index if not exists idx_summaries_slack_channel_id
  on public.summaries_slack (channel_id);

create table if not exists public.summaries_jira (
  id uuid primary key default gen_random_uuid(),
  ticket_key text not null,
  short_summary text,
  long_summary text,
  priority text,
  status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.summaries_jira enable row level security;
create index if not exists idx_summaries_jira_created_at
  on public.summaries_jira (created_at desc);
