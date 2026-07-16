-- Student profiles. One row per auth.users row (created by the trigger in
-- 20260710102918_auth_trigger.sql). `year IS NULL` means onboarding hasn't
-- been completed yet -- this is the signal the (app) route group layout
-- checks to redirect to /onboarding.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  full_name text,
  avatar_url text,
  year smallint check (year in (1, 2)),
  hostel text,
  specialization text,
  bio text,
  tags text[] not null default '{}',
  rating numeric(2, 1),
  review_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Shared updated_at trigger, reused by every table below that has the column.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

-- Everyone signed in can browse the peer directory, see comment authors, etc.
create policy "Profiles are viewable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

-- No client INSERT policy: rows are created only by the handle_new_user
-- trigger (SECURITY DEFINER, bypasses RLS).
create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Table-level grants: Supabase's Data API no longer auto-exposes new tables
-- to anon/authenticated (see supabase/config.toml [api] auto_expose_new_tables
-- comment) -- RLS alone is not sufficient, an explicit GRANT is required too.
grant select, update on public.profiles to authenticated;
