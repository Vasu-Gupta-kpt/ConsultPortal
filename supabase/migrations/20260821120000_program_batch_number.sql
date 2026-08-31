-- Replaces profiles.year (hardcoded to 1 or 2, PGP-only) with an
-- open-ended program + batch_number pair, so every future batch (64th,
-- 65th, ...) works with zero code changes, and students from other
-- programs (e.g. MBA-EX) can be represented too. "Other" is a permanent
-- catch-all -- an unlisted program is never a hard blocker; more named
-- programs can be added later by re-creating this enum (see the pattern in
-- 20260716153822_booking_workflow_states.sql).
create type program as enum ('PGP', 'MBA-EX', 'Other');

-- Both stay nullable -- NULL continues to mean "onboarding not complete",
-- same semantics as the old `year IS NULL`. The lockstep CHECK guarantees
-- no call site ever sees one set without the other.
alter table public.profiles
  add column program program,
  add column batch_number smallint check (batch_number > 0),
  add constraint profiles_program_batch_number_together
    check ((program is null) = (batch_number is null));

update public.profiles set program = 'PGP', batch_number = 63 where year = 1;
update public.profiles set program = 'PGP', batch_number = 62 where year = 2;

-- case_comments: same treatment for the denormalized author snapshot.
alter table public.case_comments
  add column author_program program,
  add column author_batch_number smallint;

update public.case_comments
set author_program = 'PGP',
    author_batch_number = case author_year when 1 then 63 when 2 then 62 end
where author_year is not null;

-- Point the snapshot trigger at the new columns instead of year.
create or replace function public.set_case_comment_author_snapshot()
returns trigger
language plpgsql
as $$
begin
  if new.author_id is not null then
    select full_name, program, batch_number
    into new.author_name, new.author_program, new.author_batch_number
    from public.profiles
    where id = new.author_id;
  end if;
  return new;
end;
$$;

-- leaderboard(): "onboarding complete" filter moves from year to
-- batch_number (this was always a pure not-null check, never used the
-- value itself).
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
  where p.batch_number is not null
  group by p.id;
$$;

-- Drop the old columns now that nothing references them. Their inline
-- CHECK constraints are column-level and drop automatically with the
-- column -- no CASCADE needed.
alter table public.profiles drop column year;
alter table public.case_comments drop column author_year;
