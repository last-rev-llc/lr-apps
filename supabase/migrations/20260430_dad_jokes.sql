-- Catalog of dad jokes shown by the Dad Joke of the Day app. Read by
-- both server and browser; counter columns (rating, times_rated,
-- times_shown) are incremented from the browser via @repo/db/client.
--
-- RLS is left disabled on purpose: the app's existing contract is that
-- any authenticated user can bump the public counters, and Auth0 issues
-- the browser an anon-keyed Supabase client (auth.role() returns 'anon'
-- under the Auth0 setup, so a 'authenticated'-gated policy would reject
-- legit writes). Default Supabase grants on public schema let anon
-- INSERT/UPDATE here without a policy.
create table if not exists public.dad_jokes (
  id bigserial primary key,
  setup text not null,
  punchline text not null,
  category text not null,
  rating numeric(3, 2),
  times_rated integer not null default 0,
  times_shown integer not null default 0,
  featured_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_dad_jokes_featured_date
  on public.dad_jokes (featured_date desc nulls last);
create index if not exists idx_dad_jokes_category
  on public.dad_jokes (category);
