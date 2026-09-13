-- Lets a senior fulfill an incoming slot_request directly: pick a
-- date/time/location and have that slot created AND immediately confirmed
-- with the specific student who asked, skipping the normal
-- request -> accept round trip.
alter table public.slot_requests drop constraint slot_requests_status_check;
alter table public.slot_requests add constraint slot_requests_status_check
  check (status in ('pending', 'dismissed', 'fulfilled'));

-- Direct table updates may only ever set 'dismissed' -- 'fulfilled' is only
-- reachable through fulfill_slot_request()'s SECURITY DEFINER path below, so
-- a request can never silently vanish from the inbox with no real booking
-- behind it.
drop policy "Recipients can dismiss a request" on public.slot_requests;
create policy "Recipients can dismiss a request"
  on public.slot_requests for update
  to authenticated
  using (requested_of = auth.uid())
  with check (requested_of = auth.uid() and status = 'dismissed');

create or replace function public.fulfill_slot_request(
  p_request_id uuid, p_slot_date date, p_start_time time, p_end_time time, p_location slot_location
) returns public.bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.slot_requests;
  v_slot public.availability_slots;
  v_booking public.bookings;
begin
  select * into v_request from public.slot_requests where id = p_request_id for update;
  if v_request.id is null then
    raise exception 'Request not found';
  end if;
  if v_request.requested_of <> auth.uid() then
    raise exception 'Only the requested student can fulfill this request';
  end if;
  if v_request.status <> 'pending' then
    raise exception 'This request is no longer pending';
  end if;
  if p_end_time <= p_start_time then
    raise exception 'End time must be after start time';
  end if;

  insert into public.availability_slots (profile_id, slot_date, start_time, end_time, location)
  values (auth.uid(), p_slot_date, p_start_time, p_end_time, p_location)
  returning * into v_slot;

  insert into public.bookings (slot_id, booked_by, status)
  values (v_slot.id, v_request.requested_by, 'confirmed')
  returning * into v_booking;

  update public.slot_requests set status = 'fulfilled' where id = p_request_id;

  return v_booking;
end;
$$;

revoke all on function public.fulfill_slot_request(uuid, date, time, time, slot_location) from public;
grant execute on function public.fulfill_slot_request(uuid, date, time, time, slot_location) to authenticated;
