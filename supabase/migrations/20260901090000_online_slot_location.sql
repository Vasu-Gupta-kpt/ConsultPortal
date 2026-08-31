-- Adds "Online" to slot_location, for Peer Practice sessions that don't
-- happen at a physical campus location. Recreating the enum (rather than
-- ALTER TYPE ... ADD VALUE) follows the same safe pattern used for the
-- hostel and booking_status widenings, since ADD VALUE is fragile inside a
-- single transactional migration. availability_slots.location has no
-- default and no index/constraint bound to it, so this is a plain
-- text-roundtrip cast with nothing else to drop/restore first.
alter table public.availability_slots
  alter column location type text using location::text;

drop type slot_location;
create type slot_location as enum ('NH', 'OH', 'Annexe', 'Library', 'LVH', 'Tagore', 'Online');

alter table public.availability_slots
  alter column location type slot_location using location::slot_location;
