-- Defense in depth against clashing availability slots (the app already
-- checks for overlap client-side before submitting -- see
-- src/lib/utils.ts's slotsOverlap -- this is the DB-level backstop against
-- races or any future direct-insert path).
create extension if not exists "btree_gist" with schema extensions;

-- Combines slot_date + start_time/end_time into a timestamp range so GiST
-- can detect overlap; excludes any two rows for the same profile_id whose
-- ranges intersect. '[)' matches how the app treats a slot: start
-- inclusive, end exclusive, so a 18:00-19:00 slot and a 19:00-20:00 slot
-- (back-to-back, not overlapping) are still allowed.
alter table public.availability_slots
  add constraint availability_slots_no_time_overlap
  exclude using gist (
    profile_id with =,
    tsrange((slot_date + start_time), (slot_date + end_time), '[)') with &&
  );
