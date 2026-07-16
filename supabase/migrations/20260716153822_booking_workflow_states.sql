-- Replace instant booking with a request -> accept/decline workflow.
-- booking_status widens from ('confirmed','cancelled') to
-- ('pending','confirmed','declined','cancelled'). Recreating the enum
-- (rather than ALTER TYPE ... ADD VALUE) follows the same safe pattern
-- already used for the `hostel` migration, since ADD VALUE is fragile
-- inside a single transactional migration.
--
-- The partial unique index must be dropped BEFORE the column type change --
-- its predicate (`status = 'confirmed'`) is bound to the old enum type, and
-- ALTER COLUMN TYPE fails trying to validate a still-enum-typed index
-- against the intermediate `text` column.
drop index if exists bookings_one_active_per_slot;

alter table public.bookings alter column status drop default;
alter table public.bookings alter column status type text using status::text;
drop type booking_status;
create type booking_status as enum ('pending', 'confirmed', 'declined', 'cancelled');
alter table public.bookings alter column status type booking_status using status::booking_status;
alter table public.bookings alter column status set default 'pending';

-- At most one *active* (unresolved) request per slot -- pending or
-- confirmed. A decline/cancel moves a row out of this set, freeing the slot
-- for a new request.
create unique index bookings_one_active_per_slot
  on public.bookings (slot_id)
  where (status in ('pending', 'confirmed'));

drop function if exists public.book_slot(uuid);

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

  insert into public.bookings (slot_id, booked_by, status)
  values (p_slot_id, auth.uid(), 'pending')
  returning * into v_booking;

  return v_booking;
exception
  when unique_violation then
    raise exception 'This slot already has a pending or confirmed request';
end;
$$;

revoke all on function public.request_booking(uuid) from public;
grant execute on function public.request_booking(uuid) to authenticated;

create or replace function public.accept_booking(p_booking_id uuid)
returns public.bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking public.bookings;
  v_owner uuid;
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
  returning * into v_booking;

  return v_booking;
end;
$$;

revoke all on function public.accept_booking(uuid) from public;
grant execute on function public.accept_booking(uuid) to authenticated;

create or replace function public.decline_booking(p_booking_id uuid)
returns public.bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking public.bookings;
  v_owner uuid;
begin
  select * into v_booking from public.bookings where id = p_booking_id for update;
  if v_booking.id is null then
    raise exception 'Booking not found';
  end if;

  select profile_id into v_owner from public.availability_slots where id = v_booking.slot_id;
  if v_owner <> auth.uid() then
    raise exception 'Only the slot owner can decline this request';
  end if;
  if v_booking.status <> 'pending' then
    raise exception 'Only pending requests can be declined';
  end if;

  update public.bookings set status = 'declined' where id = p_booking_id
  returning * into v_booking;

  return v_booking;
end;
$$;

revoke all on function public.decline_booking(uuid) from public;
grant execute on function public.decline_booking(uuid) to authenticated;

-- Broadened from "only the requester" to "requester OR slot owner", and from
-- pending-or-confirmed (was confirmed-only).
create or replace function public.cancel_booking(p_booking_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking public.bookings;
  v_owner uuid;
begin
  select * into v_booking from public.bookings where id = p_booking_id for update;
  if v_booking.id is null then
    raise exception 'Booking not found';
  end if;

  select profile_id into v_owner from public.availability_slots where id = v_booking.slot_id;
  if auth.uid() <> v_booking.booked_by and auth.uid() <> v_owner then
    raise exception 'Not a participant in this booking';
  end if;
  if v_booking.status not in ('pending', 'confirmed') then
    raise exception 'Only pending or confirmed bookings can be cancelled';
  end if;

  update public.bookings
  set status = 'cancelled', cancelled_at = now()
  where id = p_booking_id;
end;
$$;

revoke all on function public.cancel_booking(uuid) from public;
grant execute on function public.cancel_booking(uuid) to authenticated;

-- Slots with an active (pending or confirmed) request are not requestable
-- by anyone else. Still identity-blind (returns slot ids only, never the
-- requester) -- see the original definition's comment in
-- 20260710102818_peer_practice.sql for why this is a SECURITY DEFINER
-- function rather than exposed via a direct policy.
create or replace function public.booked_slot_ids()
returns table (slot_id uuid)
language sql
security definer
set search_path = public
stable
as $$
  select slot_id from public.bookings where status in ('pending', 'confirmed');
$$;

revoke all on function public.booked_slot_ids() from public;
grant execute on function public.booked_slot_ids() to authenticated;
