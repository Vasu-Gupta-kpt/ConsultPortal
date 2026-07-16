-- Widen the allowed sign-up domain check to also accept @email.iimcal.ac.in
-- alongside @iimcal.ac.in (some students' Google Workspace accounts are
-- provisioned under the email.* subdomain). The actual gate students see is
-- still src/app/auth/callback/route.ts's ALLOWED_DOMAINS check; this trigger
-- is defense-in-depth so a non-allowed account never gets a profiles row
-- even if it transiently lands in auth.users.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email is null or new.email !~* '^[^@]+@(email\.)?iimcal\.ac\.in$' then
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
