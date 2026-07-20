-- Lighter-weight "ask for a slot" request, distinct from booking an
-- already-listed slot (see request_booking/bookings). A student can ask
-- ANY other student (typically a senior with no listed availability) to
-- add a slot whenever suits them -- no slot_id involved.
create table public.slot_requests (
  id uuid primary key default gen_random_uuid(),
  requested_by uuid not null references public.profiles(id) on delete cascade,
  requested_of uuid not null references public.profiles(id) on delete cascade,
  message text,
  status text not null default 'pending' check (status in ('pending', 'dismissed')),
  created_at timestamptz not null default now()
);

alter table public.slot_requests enable row level security;

create policy "Participants can view their own slot requests"
  on public.slot_requests for select
  to authenticated
  using (requested_by = auth.uid() or requested_of = auth.uid());

create policy "Students can ask another student for a slot"
  on public.slot_requests for insert
  to authenticated
  with check (requested_by = auth.uid() and requested_of <> requested_by);

create policy "Recipients can dismiss a request"
  on public.slot_requests for update
  to authenticated
  using (requested_of = auth.uid())
  with check (requested_of = auth.uid());

grant select, insert, update on public.slot_requests to authenticated;

-- Mirrors bookings_one_pending_per_requester: stops a student from spamming
-- the same senior with repeated asks while one is still pending.
create unique index slot_requests_one_pending_per_pair
  on public.slot_requests (requested_by, requested_of)
  where (status = 'pending');
