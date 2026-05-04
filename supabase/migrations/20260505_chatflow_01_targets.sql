-- chatflow_targets: per-user Flowise/chatflow connections used by both the
-- AI Eval and CSV Chatflow apps. The api_token is stored encrypted at rest
-- via pgsodium; decryption happens server-side in @repo/ai-eval/target-store
-- — nothing in SQL decrypts here.
create extension if not exists pgsodium;

create table if not exists public.chatflow_targets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,

  name text not null check (length(trim(name)) > 0),
  api_host text not null,
  chatflow_id text not null,
  api_token_encrypted text not null,
  api_token_key_id uuid not null,

  base_trace_url text,
  default_tag text,
  prompt_template text,
  streaming boolean not null default false,

  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

alter table public.chatflow_targets enable row level security;

drop policy if exists "chatflow_targets_select" on public.chatflow_targets;
create policy "chatflow_targets_select"
  on public.chatflow_targets for select
  using (auth.uid() = user_id);

drop policy if exists "chatflow_targets_insert" on public.chatflow_targets;
create policy "chatflow_targets_insert"
  on public.chatflow_targets for insert
  with check (auth.uid() = user_id);

drop policy if exists "chatflow_targets_update" on public.chatflow_targets;
create policy "chatflow_targets_update"
  on public.chatflow_targets for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "chatflow_targets_delete" on public.chatflow_targets;
create policy "chatflow_targets_delete"
  on public.chatflow_targets for delete
  using (auth.uid() = user_id);

create or replace function public.set_chatflow_targets_updated_at()
returns trigger
language plpgsql
as $$
begin
  new."updatedAt" = now();
  return new;
end;
$$;

drop trigger if exists trg_chatflow_targets_updated_at on public.chatflow_targets;
create trigger trg_chatflow_targets_updated_at
  before update on public.chatflow_targets
  for each row
  execute function public.set_chatflow_targets_updated_at();

create index if not exists idx_chatflow_targets_user
  on public.chatflow_targets (user_id);
