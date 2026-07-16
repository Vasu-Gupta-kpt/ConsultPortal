-- Constrain profiles.hostel to the actual campus hostel list instead of
-- free text. Existing rows carry old placeholder codes (H-1, LH-2, ...)
-- from the mock-data seed -- remap those to real hostel names as part of
-- the type change; any other pre-existing free-text value (e.g. a real
-- student who onboarded before this migration) doesn't match and becomes
-- NULL, since it can't be safely guessed -- that student will need to
-- re-pick their hostel once from /profile.
create type hostel as enum (
  'New Hostel',
  'Tagore',
  'Ramanujan Hostel(OH)',
  'Lake View Hostel',
  'Annexe',
  'Tata Hall',
  'Others'
);

alter table public.profiles
  alter column hostel type hostel
  using (
    case hostel
      when 'H-1' then 'New Hostel'
      when 'LH-2' then 'Lake View Hostel'
      when 'H-3' then 'Ramanujan Hostel(OH)'
      when 'LH-1' then 'Tagore'
      when 'H-5' then 'Tata Hall'
      when 'LH-3' then 'Annexe'
      else null
    end
  )::hostel;
