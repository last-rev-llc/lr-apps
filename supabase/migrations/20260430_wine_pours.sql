-- Tables backing the Proper Wine Pour app. Both are anonymous community
-- tables — id columns are TEXT (the client generates `pour-${Date.now()}`
-- and `wall-${Date.now()}` literals; uuid would reject those payloads).
--
-- RLS left disabled so the browser anon key can insert/upvote without
-- per-user policy machinery. Matches the app's existing read/write
-- contract: writes go through the browser supabase client (cast to any
-- because generated types don't include these tables today).

create table if not exists public.wine_pours (
  id text primary key,
  restaurant_name text not null default '',
  wine_name text not null default '',
  pour_rating text not null default 'standard'
    check (pour_rating in ('generous', 'standard', 'stingy', 'criminal')),
  price_paid numeric,
  notes text,
  user_name text not null default 'Anonymous',
  created_at timestamptz not null default now()
);
create index if not exists idx_wine_pours_created_at
  on public.wine_pours (created_at desc);

create table if not exists public.pour_wall (
  id text primary key,
  user_name text not null default 'Anonymous',
  pour_type text not null default 'glory'
    check (pour_type in ('glory', 'shame')),
  content text not null default '',
  upvotes integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_pour_wall_created_at
  on public.pour_wall (created_at desc);
