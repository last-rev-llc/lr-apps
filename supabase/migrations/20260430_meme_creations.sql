-- User-saved memes. Storage path points into the private `memes` bucket;
-- access happens through signed URLs returned by the meme-generator server
-- actions. Quoted camelCase columns mirror the TypeScript MemeCreation type
-- so `apps/web/app/apps/meme-generator/actions.ts` doesn't need an adapter.
create table if not exists public.meme_creations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,

  title text not null check (length(trim(title)) > 0),
  "templateId" text not null references public.meme_templates(id) on delete restrict,
  "textZones" jsonb not null default '{}'::jsonb,
  "fontSize" integer not null default 48 check ("fontSize" between 12 and 200),

  "storagePath" text not null,
  "widthPx" integer not null default 600,
  "heightPx" integer not null default 450,

  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

alter table public.meme_creations enable row level security;

create policy "meme_creations_select"
  on public.meme_creations for select
  using (auth.uid() = user_id);

create policy "meme_creations_insert"
  on public.meme_creations for insert
  with check (auth.uid() = user_id);

create policy "meme_creations_update"
  on public.meme_creations for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "meme_creations_delete"
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

create trigger trg_meme_creations_updated_at
  before update on public.meme_creations
  for each row
  execute function public.set_meme_creations_updated_at();

create index if not exists idx_meme_creations_user_created
  on public.meme_creations (user_id, "createdAt" desc);
