-- Question sets and items used by the AI Eval chatflow app. Each set is
-- scoped to a single chatflow_target so the eval runner can replay a fixed
-- battery of prompts against a specific Flowise endpoint.
create table if not exists public.question_sets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  target_id uuid not null references public.chatflow_targets(id) on delete cascade,

  name text not null check (length(trim(name)) > 0),
  tag text,

  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

alter table public.question_sets enable row level security;

drop policy if exists "question_sets_select" on public.question_sets;
create policy "question_sets_select"
  on public.question_sets for select
  using (auth.uid() = user_id);

drop policy if exists "question_sets_insert" on public.question_sets;
create policy "question_sets_insert"
  on public.question_sets for insert
  with check (auth.uid() = user_id);

drop policy if exists "question_sets_update" on public.question_sets;
create policy "question_sets_update"
  on public.question_sets for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "question_sets_delete" on public.question_sets;
create policy "question_sets_delete"
  on public.question_sets for delete
  using (auth.uid() = user_id);

create or replace function public.set_question_sets_updated_at()
returns trigger
language plpgsql
as $$
begin
  new."updatedAt" = now();
  return new;
end;
$$;

drop trigger if exists trg_question_sets_updated_at on public.question_sets;
create trigger trg_question_sets_updated_at
  before update on public.question_sets
  for each row
  execute function public.set_question_sets_updated_at();

create index if not exists idx_question_sets_user_target
  on public.question_sets (user_id, target_id);

create table if not exists public.question_set_items (
  id uuid default gen_random_uuid() primary key,
  set_id uuid not null references public.question_sets(id) on delete cascade,

  uid text not null,
  question text not null check (length(trim(question)) > 0),
  position integer not null default 0,

  unique (set_id, uid)
);

alter table public.question_set_items enable row level security;

-- Items inherit per-user access from the parent set. We can't add a direct
-- user_id check here because items intentionally don't denormalize ownership.
drop policy if exists "question_set_items_select" on public.question_set_items;
create policy "question_set_items_select"
  on public.question_set_items for select
  using (
    exists (
      select 1 from public.question_sets s
      where s.id = question_set_items.set_id
        and s.user_id = auth.uid()
    )
  );

drop policy if exists "question_set_items_insert" on public.question_set_items;
create policy "question_set_items_insert"
  on public.question_set_items for insert
  with check (
    exists (
      select 1 from public.question_sets s
      where s.id = question_set_items.set_id
        and s.user_id = auth.uid()
    )
  );

drop policy if exists "question_set_items_update" on public.question_set_items;
create policy "question_set_items_update"
  on public.question_set_items for update
  using (
    exists (
      select 1 from public.question_sets s
      where s.id = question_set_items.set_id
        and s.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.question_sets s
      where s.id = question_set_items.set_id
        and s.user_id = auth.uid()
    )
  );

drop policy if exists "question_set_items_delete" on public.question_set_items;
create policy "question_set_items_delete"
  on public.question_set_items for delete
  using (
    exists (
      select 1 from public.question_sets s
      where s.id = question_set_items.set_id
        and s.user_id = auth.uid()
    )
  );

create index if not exists idx_question_set_items_set_position
  on public.question_set_items (set_id, position);
