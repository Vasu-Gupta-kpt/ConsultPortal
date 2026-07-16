-- A slot should stay open to multiple simultaneous requests and only lock
-- once the owner actually accepts one -- not the moment a single request
-- comes in. Replaces the "one active (pending or confirmed) booking per
-- slot" constraint with two narrower ones.
drop index if exists bookings_one_active_per_slot;

-- At most one CONFIRMED booking per slot, ever.
create unique index bookings_one_confirmed_per_slot
  on public.bookings (slot_id)
  where (status = 'confirmed');

-- A given student can't spam duplicate pending requests on the same slot;
-- different students can each have their own pending request on it at once.
create unique index bookings_one_pending_per_requester
  on public.bookings (slot_id, booked_by)
  where (status = 'pending');

create or replace function public.request_booking(p_slot_id uuid)
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

  if exists (
    select 1 from public.bookings where slot_id = p_slot_id and status = 'confirmed'
  ) then
    raise exception 'This slot has already been confirmed with another student';
  end if;

  insert into public.bookings (slot_id, booked_by, status)
  values (p_slot_id, auth.uid(), 'pending')
  returning * into v_booking;

  return v_booking;
exception
  when unique_violation then
    raise exception 'You have already requested this slot';
end;
$$;

-- Now returns the confirmed row PLUS every sibling pending request that got
-- auto-declined as a side effect, so the caller (Server Action layer) knows
-- who else to notify that the slot went to someone else. Return type is
-- widening from a single row to SETOF, which `create or replace` cannot do
-- -- must drop first.
drop function if exists public.accept_booking(uuid);

create function public.accept_booking(p_booking_id uuid)
returns setof public.bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking public.bookings;
  v_owner uuid;
  v_confirmed public.bookings;
begin
  select * into v_booking from public.bookings where id = p_booking_id for update;
  if v_booking.id is null then
    raise exception 'Booking not found';
  end if;

  select profile_id into v_owner from public.availability_slots where id = v_booking.slot_id;
  if v_owner <> auth.uid() then
    raise exception 'Only the slot owner can accept this request';
  end if;
  if v_booking.status <> 'pending' then
    raise exception 'Only pending requests can be accepted';
  end if;

  update public.bookings set status = 'confirmed' where id = p_booking_id
  returning * into v_confirmed;

  return next v_confirmed;

  return query
    update public.bookings
    set status = 'declined'
    where slot_id = v_booking.slot_id
      and id <> p_booking_id
      and status = 'pending'
    returning *;

  return;
exception
  when unique_violation then
    raise exception 'This slot was already confirmed';
end;
$$;

-- Only a CONFIRMED booking makes a slot unavailable to other students now --
-- pending requests no longer hide it, since multiple people can request the
-- same slot until one is accepted.
create or replace function public.booked_slot_ids()
returns table (slot_id uuid)
language sql
security definer
set search_path = public
stable
as $$
  select slot_id from public.bookings where status = 'confirmed';
$$;
