-- Catalog of meme templates. Read-only for authenticated users; writes happen
-- via service role from `scripts/seed-meme-templates.ts` and the migration
-- seed below for the abstract color schemes.
create table if not exists public.meme_templates (
  id text primary key,
  name text not null,
  description text,
  category text not null,

  "imagePath" text,
  "imageWidth" integer not null,
  "imageHeight" integer not null,
  "backgroundColor" text,
  "defaultTextColor" text not null default '#ffffff',

  "textZones" jsonb not null,
  "isActive" boolean not null default true,
  "displayOrder" integer not null default 0,

  "createdAt" timestamptz not null default now()
);

alter table public.meme_templates enable row level security;

create policy "meme_templates_select_authenticated"
  on public.meme_templates for select
  using (auth.role() = 'authenticated');

create index if not exists idx_meme_templates_active_order
  on public.meme_templates ("isActive", "displayOrder");

-- Seed the six abstract color-scheme templates that ship without an image.
-- Re-runnable: ON CONFLICT DO NOTHING on the primary key.
insert into public.meme_templates
  (id, name, category, "imageWidth", "imageHeight", "backgroundColor",
   "defaultTextColor", "textZones", "displayOrder")
values
  ('classic', 'Classic', 'classic', 600, 450, '#ffffff', '#000000',
   '[
     {"id":"top","label":"Top text","x":20,"y":20,"width":560,"height":90,"align":"center","uppercase":true,"defaultText":"WHEN YOU FINALLY"},
     {"id":"bottom","label":"Bottom text","x":20,"y":340,"width":560,"height":90,"align":"center","uppercase":true,"defaultText":"SHIP THE FEATURE"}
   ]'::jsonb, 1),
  ('dark-mode', 'Dark Mode', 'classic', 600, 450, '#0d0d0d', '#ffffff',
   '[
     {"id":"top","label":"Top text","x":20,"y":20,"width":560,"height":90,"align":"center","uppercase":true,"defaultText":"WHEN YOU FINALLY"},
     {"id":"bottom","label":"Bottom text","x":20,"y":340,"width":560,"height":90,"align":"center","uppercase":true,"defaultText":"SHIP THE FEATURE"}
   ]'::jsonb, 2),
  ('matrix', 'Matrix', 'classic', 600, 450, '#001a00', '#00ff41',
   '[
     {"id":"top","label":"Top text","x":20,"y":20,"width":560,"height":90,"align":"center","uppercase":true,"defaultText":"WHEN YOU FINALLY"},
     {"id":"bottom","label":"Bottom text","x":20,"y":340,"width":560,"height":90,"align":"center","uppercase":true,"defaultText":"SHIP THE FEATURE"}
   ]'::jsonb, 3),
  ('vaporwave', 'Vaporwave', 'classic', 600, 450, '#1a0533', '#ff71ce',
   '[
     {"id":"top","label":"Top text","x":20,"y":20,"width":560,"height":90,"align":"center","uppercase":true,"defaultText":"WHEN YOU FINALLY"},
     {"id":"bottom","label":"Bottom text","x":20,"y":340,"width":560,"height":90,"align":"center","uppercase":true,"defaultText":"SHIP THE FEATURE"}
   ]'::jsonb, 4),
  ('fire', 'Fire', 'classic', 600, 450, '#1a0a00', '#ff6b35',
   '[
     {"id":"top","label":"Top text","x":20,"y":20,"width":560,"height":90,"align":"center","uppercase":true,"defaultText":"WHEN YOU FINALLY"},
     {"id":"bottom","label":"Bottom text","x":20,"y":340,"width":560,"height":90,"align":"center","uppercase":true,"defaultText":"SHIP THE FEATURE"}
   ]'::jsonb, 5),
  ('ice-cold', 'Ice Cold', 'classic', 600, 450, '#001a2e', '#7dd8ff',
   '[
     {"id":"top","label":"Top text","x":20,"y":20,"width":560,"height":90,"align":"center","uppercase":true,"defaultText":"WHEN YOU FINALLY"},
     {"id":"bottom","label":"Bottom text","x":20,"y":340,"width":560,"height":90,"align":"center","uppercase":true,"defaultText":"SHIP THE FEATURE"}
   ]'::jsonb, 6)
on conflict (id) do nothing;
