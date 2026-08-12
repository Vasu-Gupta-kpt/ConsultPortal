-- google_calendar_tokens' INSERT/UPDATE policies (from
-- 20260716162752_google_calendar.sql) were never actually taking effect in
-- production -- every save of a Calendar refresh token failed with
-- "new row violates row-level security policy" (42501), which
-- auth/callback/route.ts was silently swallowing until its own error
-- handling was fixed. Re-creating the policies idempotently here in case
-- the original migration was only partially applied.
drop policy if exists "Users can save their own calendar token" on public.google_calendar_tokens;
create policy "Users can save their own calendar token"
  on public.google_calendar_tokens for insert
  to authenticated
  with check (auth.uid() = profile_id);

drop policy if exists "Users can update their own calendar token" on public.google_calendar_tokens;
create policy "Users can update their own calendar token"
  on public.google_calendar_tokens for update
  to authenticated
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);

grant insert, update on public.google_calendar_tokens to authenticated;
