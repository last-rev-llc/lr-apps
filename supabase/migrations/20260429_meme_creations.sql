-- Per-user meme creations. Each row references a row in
-- public.meme_templates (added in 20260429_meme_templates.sql) and is
-- locked to the owning user via RLS.
create table if not exists public.meme_creations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (length(btrim(title)) > 0),
  "templateId" text not null references public.meme_templates(id) on delete restrict,
  "textZones" jsonb not null,
  "fontSize" int not null check ("fontSize" between 12 and 200),
  "storagePath" text not null,
  "widthPx" int not null,
  "heightPx" int not null,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

alter table public.meme_creations enable row level security;

create policy "Users read own meme creations"
  on public.meme_creations for select
  using (auth.uid() = user_id);

create policy "Users insert own meme creations"
  on public.meme_creations for insert
  with check (auth.uid() = user_id);

create policy "Users update own meme creations"
  on public.meme_creations for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users delete own meme creations"
  on public.meme_creations for delete
  using (auth.uid() = user_id);

create or replace function public.set_meme_creations_updated_at()
returns trigger
language plpgsql
as $$
begin
  new."updatedAt" = now();
  return new;
end;
$$;

create trigger set_meme_creations_updated_at
  before update on public.meme_creations
  for each row execute function public.set_meme_creations_updated_at();

create index if not exists idx_meme_creations_user_created
  on public.meme_creations (user_id, "createdAt" desc);
