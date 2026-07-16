-- Case library: cases, per-user solve tracking, and the "Approaches" comment
-- thread with upvotes.
create table public.cases (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  difficulty difficulty not null,
  type case_type not null,
  industry industry not null,
  company text not null,
  framework text[] not null default '{}',
  casebook text,
  description text not null,
  estimated_time integer not null,
  tags text[] not null default '{}',
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.cases enable row level security;

create policy "Cases are viewable by authenticated users"
  on public.cases for select
  to authenticated
  using (true);

-- No client write policies: case content is curated via Supabase Studio for
-- now (see plan notes -- there's no "submit a case" UI in this pass).

grant select on public.cases to authenticated;

-- Which cases the signed-in user has personally solved. Deliberately
-- own-row-only SELECT: classmates should not be able to see who solved what.
create table public.case_solves (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  case_id uuid not null references public.cases (id) on delete cascade,
  solved_at timestamptz not null default now(),
  unique (user_id, case_id)
);

create index case_solves_case_id_idx on public.case_solves (case_id);
create index case_solves_user_id_solved_at_idx on public.case_solves (user_id, solved_at desc);

alter table public.case_solves enable row level security;

create policy "Users can view their own solves"
  on public.case_solves for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can mark cases solved"
  on public.case_solves for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can mark cases unsolved"
  on public.case_solves for delete
  to authenticated
  using (auth.uid() = user_id);

grant select, insert, delete on public.case_solves to authenticated;

-- Aggregate solved counts per case, exposed via a SECURITY DEFINER function
-- rather than a plain view: case_solves' SELECT policy is own-row-only, so a
-- normal view (which runs with the querying user's RLS) could not safely
-- return other users' counts. This function runs with the owner's
-- privileges and only ever returns an aggregate, never raw rows.
create or replace function public.case_solved_counts()
returns table (case_id uuid, solved_count bigint)
language sql
security definer
set search_path = public
stable
as $$
  select case_id, count(*) as solved_count
  from public.case_solves
  group by case_id;
$$;

revoke all on function public.case_solved_counts() from public;
grant execute on function public.case_solved_counts() to authenticated;

-- "Approaches": a comment thread per case. author_name/author_year are
-- denormalized snapshots (mirrors the old mock CaseComment shape and lets
-- seed rows exist with no real author_id -- see seed_content.sql). When a
-- real Server Action posts a comment with author_id set, this trigger fills
-- the snapshot from the profile so the client can never spoof a display name.
create table public.case_comments (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases (id) on delete cascade,
  author_id uuid references public.profiles (id) on delete set null,
  author_name text not null,
  author_year smallint,
  approach_title text not null,
  content text not null,
  created_at timestamptz not null default now()
);

create index case_comments_case_id_created_at_idx on public.case_comments (case_id, created_at desc);

create or replace function public.set_case_comment_author_snapshot()
returns trigger
language plpgsql
as $$
begin
  if new.author_id is not null then
    select full_name, year
    into new.author_name, new.author_year
    from public.profiles
    where id = new.author_id;
  end if;
  return new;
end;
$$;

create trigger set_case_comment_author_snapshot
  before insert on public.case_comments
  for each row execute function public.set_case_comment_author_snapshot();

alter table public.case_comments enable row level security;

create policy "Approaches are viewable by authenticated users"
  on public.case_comments for select
  to authenticated
  using (true);

create policy "Users can post their own approaches"
  on public.case_comments for insert
  to authenticated
  with check (auth.uid() = author_id);

create policy "Users can edit their own approaches"
  on public.case_comments for update
  to authenticated
  using (auth.uid() = author_id)
  with check (auth.uid() = author_id);

create policy "Users can delete their own approaches"
  on public.case_comments for delete
  to authenticated
  using (auth.uid() = author_id);

grant select, insert, update, delete on public.case_comments to authenticated;

create table public.case_comment_upvotes (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.case_comments (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (comment_id, user_id)
);

alter table public.case_comment_upvotes enable row level security;

create policy "Upvotes are viewable by authenticated users"
  on public.case_comment_upvotes for select
  to authenticated
  using (true);

create policy "Users can upvote as themselves"
  on public.case_comment_upvotes for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can remove their own upvote"
  on public.case_comment_upvotes for delete
  to authenticated
  using (auth.uid() = user_id);

grant select, insert, delete on public.case_comment_upvotes to authenticated;
