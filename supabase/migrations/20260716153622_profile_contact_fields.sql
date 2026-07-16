-- Contact info so matched Peer Practice partners can actually reach each
-- other. Nullable at the DB level -- required by the onboarding/profile
-- forms going forward, but not added to the (app) layout's completeness
-- gate (which still only checks `year`), so existing users aren't forced
-- back through onboarding or locked out.
alter table public.profiles
  add column contact_number text,
  add column room_number text;
