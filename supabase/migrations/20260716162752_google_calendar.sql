-- Full Google Calendar sync: when a request is accepted, an event is
-- created on the slot owner's calendar with the requester invited as an
-- attendee (Google's own invite system notifies/adds it to the requester's
-- calendar -- they don't need to have connected anything themselves).

-- UI-visible flag only -- never the token itself.
alter table public.profiles
  add column google_calendar_connected boolean not null default false;

-- Set by the accept_booking Server Action (src/lib/actions/peer-practice.ts)
-- once it successfully creates the Calendar event; used to delete the event
-- again if the booking is later cancelled.
alter table public.bookings
  add column google_event_id text;

-- A Google refresh token is a real secret -- ongoing read/write access to
-- whoever it belongs to's calendar. This table is deliberately NEVER
-- readable through the public Data API by anyone, including its own owner:
-- no SELECT policy, and no GRANT to `authenticated` at all (compare to
-- every other table in this project, which grants at least SELECT). The
-- only way a token is ever read back out is via the service-role client
-- (src/lib/supabase/admin.ts) from server-side Server Actions, which
-- bypasses RLS and grants entirely.
create table public.google_calendar_tokens (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  refresh_token text not null,
  updated_at timestamptz not null default now()
);

alter table public.google_calendar_tokens enable row level security;

-- A user can save/refresh their OWN token right after consenting (via the
-- normal request-scoped client in src/app/auth/callback/route.ts) -- but
-- can never read it back, including their own row.
create policy "Users can save their own calendar token"
  on public.google_calendar_tokens for insert
  to authenticated
  with check (auth.uid() = profile_id);

create policy "Users can update their own calendar token"
  on public.google_calendar_tokens for update
  to authenticated
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);

grant insert, update on public.google_calendar_tokens to authenticated;
