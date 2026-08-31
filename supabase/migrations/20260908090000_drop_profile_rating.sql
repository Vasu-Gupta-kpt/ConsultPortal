-- Removes the Peer Practice star-rating display. Never a functioning
-- feature -- there was no action/trigger anywhere that let a student
-- actually give a rating, so `rating`/`review_count` were only ever
-- populated by the dev seed script; every real profile just showed a
-- meaningless "0.0 (0)" (rating NULL -> coalesced to 0 client-side,
-- review_count defaulting to 0). Dropping outright rather than leaving
-- dead, misleading columns around.
alter table public.profiles
  drop column rating,
  drop column review_count;
