-- Lets admins delete Cases and Materials, mirroring the existing
-- admin-only INSERT policies (20260716191756_admin_content.sql). Dependent
-- rows (case_comments, case_solves, case_comment_upvotes,
-- material_downloads) already cascade-delete via existing FKs, so no
-- further migration work is needed for those.
create policy "Admins can delete cases"
  on public.cases for delete
  to authenticated
  using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

grant delete on public.cases to authenticated;

create policy "Admins can delete materials"
  on public.materials for delete
  to authenticated
  using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

grant delete on public.materials to authenticated;

-- Lets admins clean up the underlying Storage objects when deleting a
-- material or case structure image, rather than leaving orphaned files
-- behind (relevant given Free-tier storage is capped).
create policy "Admins can delete material files"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'materials'
    and exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

create policy "Admins can delete case structure images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'case-structures'
    and exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );
