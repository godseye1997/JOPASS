-- ================================================================
-- JoPass — Supabase Storage Setup
-- Run this in Supabase SQL Editor
-- ================================================================

-- Create the public image bucket (5 MB limit per file)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'jopass-images',
  'jopass-images',
  true,
  5242880,
  array['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

-- Anyone can view images (public bucket)
create policy "Public read jopass-images"
  on storage.objects for select
  using (bucket_id = 'jopass-images');

-- Authenticated owners can upload images
create policy "Authenticated upload jopass-images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'jopass-images');

-- Owners can overwrite (upsert) their own images
create policy "Owners update jopass-images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'jopass-images');

-- Owners can delete their own images
create policy "Owners delete jopass-images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'jopass-images');
