-- Atomic counter mutations for the Dad Jokes app. Replaces the prior
-- read-modify-write pattern in joke-viewer.tsx, where two concurrent
-- raters could each select the same `times_rated` and stomp each other's
-- increment. Both functions run in a single statement, so the row's
-- per-row lock serializes concurrent updates.
--
-- security invoker is fine because public.dad_jokes already grants
-- UPDATE to anon (RLS off — see 20260430_dad_jokes.sql for rationale).

create or replace function public.rate_dad_joke(
  p_joke_id bigint,
  p_numeric_rating integer
)
returns table (rating numeric, times_rated integer)
language plpgsql
security invoker
set search_path = public
as $$
begin
  if p_numeric_rating < 1 or p_numeric_rating > 4 then
    raise exception 'numeric_rating must be between 1 and 4, got %', p_numeric_rating;
  end if;

  return query
  update public.dad_jokes dj
  set times_rated = dj.times_rated + 1,
      rating = round(
        ((coalesce(dj.rating, 0) * dj.times_rated)::numeric + p_numeric_rating)
        / (dj.times_rated + 1),
        2
      ),
      updated_at = now()
  where dj.id = p_joke_id
  returning dj.rating, dj.times_rated;
end;
$$;

create or replace function public.increment_dad_joke_shown(p_joke_id bigint)
returns void
language sql
security invoker
set search_path = public
as $$
  update public.dad_jokes
  set times_shown = times_shown + 1,
      updated_at = now()
  where id = p_joke_id;
$$;

grant execute on function public.rate_dad_joke(bigint, integer) to anon, authenticated;
grant execute on function public.increment_dad_joke_shown(bigint) to anon, authenticated;
