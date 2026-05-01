-- Catalog of meme templates rendered by the meme-generator app.
-- The six abstract color schemes seeded here preserve the legacy
-- in-component template list so the renderer keeps working after the
-- refactor that moves templates from code to the database.
create table if not exists public.meme_templates (
  id text primary key,
  name text not null,
  description text,
  category text not null,
  "imagePath" text,
  "imageWidth" int not null,
  "imageHeight" int not null,
  "backgroundColor" text not null,
  "defaultTextColor" text not null,
  "textZones" jsonb not null,
  "isActive" boolean not null default true,
  "displayOrder" int not null default 0,
  "createdAt" timestamptz not null default now()
);

alter table public.meme_templates enable row level security;

create policy "Authenticated users can read templates"
  on public.meme_templates for select
  using (auth.role() = 'authenticated');

create index if not exists idx_meme_templates_active_order
  on public.meme_templates ("isActive", "displayOrder");

-- Seed: six abstract color schemes carried over from the legacy
-- TEMPLATES array. textZones encodes a top zone (anchored 20px from
-- top) and a bottom zone (anchored 20px from bottom) — both centered
-- and stretched to canvas width — matching the existing canvas
-- renderer's drawText behavior.
insert into public.meme_templates (
  id, name, description, category, "imagePath",
  "imageWidth", "imageHeight",
  "backgroundColor", "defaultTextColor",
  "textZones", "isActive", "displayOrder"
) values
  (
    'classic', 'Classic', 'White background, black text — the og meme look',
    'classic', null, 600, 450, '#ffffff', '#000000',
    '[
      {"id":"top","x":20,"y":20,"width":560,"height":120,"align":"center","verticalAlign":"top","fontSize":48,"strokeColor":"#000000"},
      {"id":"bottom","x":20,"y":310,"width":560,"height":120,"align":"center","verticalAlign":"bottom","fontSize":48,"strokeColor":"#000000"}
    ]'::jsonb,
    true, 1
  ),
  (
    'dark-mode', 'Dark Mode', 'Pitch-black background with bright white text',
    'classic', null, 600, 450, '#0d0d0d', '#ffffff',
    '[
      {"id":"top","x":20,"y":20,"width":560,"height":120,"align":"center","verticalAlign":"top","fontSize":48,"strokeColor":"#000000"},
      {"id":"bottom","x":20,"y":310,"width":560,"height":120,"align":"center","verticalAlign":"bottom","fontSize":48,"strokeColor":"#000000"}
    ]'::jsonb,
    true, 2
  ),
  (
    'matrix', 'Matrix', 'Green-on-black terminal aesthetic',
    'classic', null, 600, 450, '#001a00', '#00ff41',
    '[
      {"id":"top","x":20,"y":20,"width":560,"height":120,"align":"center","verticalAlign":"top","fontSize":48,"strokeColor":"#000000"},
      {"id":"bottom","x":20,"y":310,"width":560,"height":120,"align":"center","verticalAlign":"bottom","fontSize":48,"strokeColor":"#000000"}
    ]'::jsonb,
    true, 3
  ),
  (
    'vaporwave', 'Vaporwave', 'Deep purple background with hot pink text',
    'classic', null, 600, 450, '#1a0533', '#ff71ce',
    '[
      {"id":"top","x":20,"y":20,"width":560,"height":120,"align":"center","verticalAlign":"top","fontSize":48,"strokeColor":"#000000"},
      {"id":"bottom","x":20,"y":310,"width":560,"height":120,"align":"center","verticalAlign":"bottom","fontSize":48,"strokeColor":"#000000"}
    ]'::jsonb,
    true, 4
  ),
  (
    'fire', 'Fire', 'Charred background with hot-orange text',
    'classic', null, 600, 450, '#1a0a00', '#ff6b35',
    '[
      {"id":"top","x":20,"y":20,"width":560,"height":120,"align":"center","verticalAlign":"top","fontSize":48,"strokeColor":"#000000"},
      {"id":"bottom","x":20,"y":310,"width":560,"height":120,"align":"center","verticalAlign":"bottom","fontSize":48,"strokeColor":"#000000"}
    ]'::jsonb,
    true, 5
  ),
  (
    'ice-cold', 'Ice Cold', 'Deep navy background with icy blue text',
    'classic', null, 600, 450, '#001a2e', '#7dd8ff',
    '[
      {"id":"top","x":20,"y":20,"width":560,"height":120,"align":"center","verticalAlign":"top","fontSize":48,"strokeColor":"#000000"},
      {"id":"bottom","x":20,"y":310,"width":560,"height":120,"align":"center","verticalAlign":"bottom","fontSize":48,"strokeColor":"#000000"}
    ]'::jsonb,
    true, 6
  )
on conflict (id) do nothing;
