-- A case can have multiple structure/framework diagrams (not just one), and
-- each one can be either a typed indented-text tree or an uploaded picture
-- of the actual diagram. Replaces the single `framework_tree` column with
-- an array `structures`, preserving any existing tree data in the process.
alter table public.cases add column structures jsonb not null default '[]'::jsonb;

update public.cases
set structures = jsonb_build_array(jsonb_build_object('tree', framework_tree))
where framework_tree is not null;

alter table public.cases drop column framework_tree;

-- Public bucket (unlike the private `materials` bucket) -- these are
-- illustrative diagrams, not access-tracked downloads, so a plain public
-- URL is simpler than the signed-URL flow in src/lib/actions/materials.ts.
-- No SELECT policy needed: public buckets bypass RLS for reads on the
-- public URL route.
insert into storage.buckets (id, name, public)
values ('case-structures', 'case-structures', true)
on conflict (id) do nothing;

create policy "Admins can upload case structure images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'case-structures'
    and exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );
