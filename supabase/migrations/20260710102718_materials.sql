-- Learning materials (PDFs/videos/articles) and per-download logging.
-- file_path points at an object in the private `materials` Storage bucket
-- (created in 20260710103118_materials_storage_bucket.sql); uploading is out
-- of scope for this pass (club uploads via Supabase Studio).
create table public.materials (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  category material_category not null,
  file_type file_type not null,
  file_path text,
  uploaded_by_label text,
  created_by uuid references public.profiles (id) on delete set null,
  tags text[] not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.materials enable row level security;

create policy "Materials are viewable by authenticated users"
  on public.materials for select
  to authenticated
  using (true);

grant select on public.materials to authenticated;

-- Every download is logged (no uniqueness constraint) -- repeat downloads by
-- the same user should still increment the count, matching the large
-- aggregate counts in the old mock data.
create table public.material_downloads (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references public.materials (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  downloaded_at timestamptz not null default now()
);

create index material_downloads_material_id_idx on public.material_downloads (material_id);

alter table public.material_downloads enable row level security;

create policy "Download counts are viewable by authenticated users"
  on public.material_downloads for select
  to authenticated
  using (true);

create policy "Users can log their own downloads"
  on public.material_downloads for insert
  to authenticated
  with check (auth.uid() = user_id);

grant select, insert on public.material_downloads to authenticated;
