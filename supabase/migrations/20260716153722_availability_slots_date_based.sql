-- Replace recurring weekly availability (day_of_week) with concrete calendar
-- dates, so slots can be shown on and picked from an actual calendar and
-- naturally expire once the date passes.
alter table public.availability_slots add column slot_date date;

-- Backfill: map each existing row's day_of_week to the next occurrence of
-- that weekday on or after today (date + integer days = date in Postgres).
update public.availability_slots
set slot_date = current_date + (
  (
    (case day_of_week
      when 'Sunday' then 0
      when 'Monday' then 1
      when 'Tuesday' then 2
      when 'Wednesday' then 3
      when 'Thursday' then 4
      when 'Friday' then 5
      when 'Saturday' then 6
    end)
    - extract(dow from current_date)::int + 7
  ) % 7
);

alter table public.availability_slots alter column slot_date set not null;
alter table public.availability_slots drop column day_of_week;
-- The `weekday` enum type is left in place (now unused) rather than dropped
-- -- harmless, and cheap to keep around if recurring availability returns.

alter table public.availability_slots
  add constraint slot_date_not_past check (slot_date >= current_date);
