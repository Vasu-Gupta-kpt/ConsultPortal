-- Auto-create a profiles row whenever a new auth.users row appears (i.e.
-- right after Google OAuth sign-in, before src/app/auth/callback/route.ts
-- runs its own domain check and redirects).
--
-- This soft-skips (returns without inserting, does not raise) for anything
-- not @iimcal.ac.in, rather than hard-blocking the auth.users insert. That
-- keeps src/app/auth/callback/route.ts untouched: it already calls
-- exchangeCodeForSession() then signs out + redirects to /auth/error on a
-- domain mismatch, with no try/catch around the exchange call. A hard raise
-- here would turn that into an unhandled exception instead of the existing
-- graceful redirect. The practical effect is the same either way: a
-- non-iimcal account never ends up with a profiles row, so the onboarding
-- gate treats it as "no profile" and the callback route signs it out before
-- it can reach any gated page.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email is null or new.email !~* '^[^@]+@iimcal\.ac\.in$' then
    return new;
  end if;

  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
