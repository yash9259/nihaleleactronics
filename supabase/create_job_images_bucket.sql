-- Create missing storage bucket for job attachments/images
-- Run this once in Supabase SQL Editor

insert into storage.buckets (id, name, public)
values ('job-images', 'job-images', false)
on conflict (id) do nothing;

drop policy if exists "Job images read" on storage.objects;
create policy "Job images read" on storage.objects
for select using (
  bucket_id = 'job-images'
  and split_part(name, '/', 1) = (
    select business_id::text from public.profiles where id = auth.uid()
  )
);

drop policy if exists "Job images write" on storage.objects;
create policy "Job images write" on storage.objects
for insert with check (
  bucket_id = 'job-images'
  and split_part(name, '/', 1) = (
    select business_id::text from public.profiles where id = auth.uid()
  )
);

drop policy if exists "Job images update" on storage.objects;
create policy "Job images update" on storage.objects
for update using (
  bucket_id = 'job-images'
  and split_part(name, '/', 1) = (
    select business_id::text from public.profiles where id = auth.uid()
  )
)
with check (
  bucket_id = 'job-images'
  and split_part(name, '/', 1) = (
    select business_id::text from public.profiles where id = auth.uid()
  )
);

drop policy if exists "Job images delete" on storage.objects;
create policy "Job images delete" on storage.objects
for delete using (
  bucket_id = 'job-images'
  and split_part(name, '/', 1) = (
    select business_id::text from public.profiles where id = auth.uid()
  )
);