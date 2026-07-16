-- Private bucket for material files (PDFs/videos). Uploading is out of
-- scope for this pass -- the club uploads content via Supabase Studio
-- (which uses the service role and bypasses these policies); students only
-- ever read, via a short-lived signed URL minted by the downloadMaterial
-- Server Action.
insert into storage.buckets (id, name, public)
values ('materials', 'materials', false)
on conflict (id) do nothing;

create policy "Authenticated users can read material files"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'materials');
