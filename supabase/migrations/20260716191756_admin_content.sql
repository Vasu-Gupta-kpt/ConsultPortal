-- Lets designated admins (club officers) add Cases and Materials in-app
-- instead of only via Supabase Studio. Admin status is a plain boolean,
-- manually flipped for specific profiles (via Studio, or a one-off script)
-- -- there is no in-app "manage admins" UI in this pass.
alter table public.profiles add column is_admin boolean not null default false;

create policy "Admins can add cases"
  on public.cases for insert
  to authenticated
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

grant insert on public.cases to authenticated;

create policy "Admins can add materials"
  on public.materials for insert
  to authenticated
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

grant insert on public.materials to authenticated;

-- Lets an admin's browser upload a file directly to the private `materials`
-- bucket (see src/app/(app)/materials/new/NewMaterialForm.tsx) -- uploads
-- bypass the Server Action layer entirely to avoid Next.js's small default
-- request body size limit, which isn't meant for PDFs/videos.
create policy "Admins can upload material files"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'materials'
    and exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );
