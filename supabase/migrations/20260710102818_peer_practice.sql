-- Peer practice: recurring weekly availability slots and bookings against
-- them. There is deliberately no `is_booked` column on availability_slots --
-- booked status is always derived from the presence of a `confirmed`
-- booking, so there is only one source of truth.
create table public.availability_slots (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  day_of_week weekday not null,
  start_time time not null,
  end_time time not null,
  location slot_location not null,
  created_at timestamptz not null default now(),
  constraint availability_slots_time_order check (end_time > start_time)
);

create index availability_slots_profile_id_idx on public.availability_slots (profile_id);

alter table public.availability_slots enable row level security;

create policy "Slots are viewable by authenticated users"
  on public.availability_slots for select
  to authenticated
  using (true);

create policy "Users manage their own slots (insert)"
  on public.availability_slots for insert
  to authenticated
  with check (auth.uid() = profile_id);

create policy "Users manage their own slots (update)"
  on public.availability_slots for update
  to authenticated
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);

create policy "Users manage their own slots (delete)"
  on public.availability_slots for delete
  to authenticated
  using (auth.uid() = profile_id);

grant select, insert, update, delete on public.availability_slots to authenticated;

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid not null references public.availability_slots (id) on delete cascade,
  booked_by uuid not null references public.profiles (id) on delete cascade,
  status booking_status not null default 'confirmed',
  booked_at timestamptz not null default now(),
  cancelled_at timestamptz
);

-- At most one *active* booking per slot at any time. Combined with the
-- `for update` row lock in book_slot() below, this makes concurrent booking
-- attempts for the same slot resolve deterministically.
create unique index bookings_one_active_per_slot
  on public.bookings (slot_id)
  where (status = 'confirmed');

create index bookings_booked_by_idx on public.bookings (booked_by);

alter table public.bookings enable row level security;

-- Visible to the person who booked it and to the slot owner (they need to
-- know who's coming). No direct INSERT/UPDATE/DELETE policies at all --
-- every write goes through the SECURITY DEFINER RPCs below, which enforce
-- business rules (can't book your own slot, must own a booking to cancel it)
-- atomically inside a locked transaction and turn constraint violations into
-- friendly errors instead of raw Postgres error codes reaching the client.
create policy "Participants can view a booking"
  on public.bookings for select
  to authenticated
  using (
    auth.uid() = booked_by
    or auth.uid() = (select profile_id from public.availability_slots where id = slot_id)
  );

grant select on public.bookings to authenticated;

-- The Peer Practice browse page needs to know WHICH slots are taken
-- (to grey them out / hide them from "book a slot" filters) without
-- exposing WHO booked them -- the "Participants can view a booking" policy
-- above deliberately keeps booker identity private to the two participants.
-- This SECURITY DEFINER function returns only slot ids, never booker
-- identity, so it's safe to expose to every authenticated user.
create or replace function public.booked_slot_ids()
returns table (slot_id uuid)
language sql
security definer
set search_path = public
stable
as $$
  select slot_id from public.bookings where status = 'confirmed';
$$;

revoke all on function public.booked_slot_ids() from public;
grant execute on function public.booked_slot_ids() to authenticated;

create or replace function public.book_slot(p_slot_id uuid)
returns public.bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
  v_booking public.bookings;
begin
  select profile_id into v_owner
  from public.availability_slots
  where id = p_slot_id
  for update;

  if v_owner is null then
    raise exception 'Slot not found';
  end if;

  if v_owner = auth.uid() then
    raise exception 'You cannot book your own slot';
  end if;

  insert into public.bookings (slot_id, booked_by, status)
  values (p_slot_id, auth.uid(), 'confirmed')
  returning * into v_booking;

  return v_booking;
exception
  when unique_violation then
    raise exception 'This slot has already been booked';
end;
$$;

revoke all on function public.book_slot(uuid) from public;
grant execute on function public.book_slot(uuid) to authenticated;

create or replace function public.cancel_booking(p_booking_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking public.bookings;
begin
  select * into v_booking
  from public.bookings
  where id = p_booking_id
  for update;

  if v_booking is null then
    raise exception 'Booking not found';
  end if;

  if v_booking.booked_by <> auth.uid() then
    raise exception 'Not your booking';
  end if;

  update public.bookings
  set status = 'cancelled', cancelled_at = now()
  where id = p_booking_id;
end;
$$;

revoke all on function public.cancel_booking(uuid) from public;
grant execute on function public.cancel_booking(uuid) to authenticated;
