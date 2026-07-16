-- Dashboard support: batch leaderboard (rank + total students) and the
-- caller's own solve streak.

-- Returns one row per profile with year set (i.e. onboarding complete).
-- SECURITY DEFINER because it aggregates across every user's case_solves,
-- which is deliberately locked down to own-row-only SELECT (see
-- 20260710102618_cases.sql) -- a plain view would run under the caller's
-- RLS and only ever see their own row, making the window functions useless.
-- Returns the full small roster (club-scale: hundreds of rows) rather than
-- filtering server-side; callers pick out their own row by id client-side.
create or replace function public.leaderboard()
returns table (user_id uuid, total_solved bigint, rank bigint, total_students bigint)
language sql
security definer
set search_path = public
stable
as $$
  select
    p.id as user_id,
    coalesce(count(cs.id), 0) as total_solved,
    rank() over (order by count(cs.id) desc) as rank,
    count(*) over () as total_students
  from public.profiles p
  left join public.case_solves cs on cs.user_id = p.id
  where p.year is not null
  group by p.id;
$$;

revoke all on function public.leaderboard() from public;
grant execute on function public.leaderboard() to authenticated;

-- Consecutive-day solve streak ending today, for the caller only. Plain
-- (invoker-rights) function is safe here: case_solves' own-row-only RLS
-- policy still applies underneath this query, so even if p_user_id were
-- passed as someone else's id, the query returns no rows for them and the
-- streak comes back as 0 rather than leaking another student's activity.
create or replace function public.calculate_streak(p_user_id uuid default auth.uid())
returns integer
language plpgsql
stable
as $$
declare
  v_streak integer := 0;
  v_day date := current_date;
begin
  while exists (
    select 1
    from public.case_solves
    where user_id = p_user_id and solved_at::date = v_day
  ) loop
    v_streak := v_streak + 1;
    v_day := v_day - 1;
  end loop;

  return v_streak;
end;
$$;

grant execute on function public.calculate_streak(uuid) to authenticated;
