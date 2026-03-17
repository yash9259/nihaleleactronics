-- Storage buckets
insert into storage.buckets (id, name, public)
values
  ('admin-avatars', 'admin-avatars', false),
  ('product-images', 'product-images', false),
  ('job-images', 'job-images', false),
  ('customer-images', 'customer-images', false)
on conflict do nothing;

-- Enforce business isolation by folder prefix: business_id/filename
create policy "Admin avatars read" on storage.objects
  for select using (
    bucket_id = 'admin-avatars'
    and split_part(name, '/', 1) = (select business_id::text from profiles where id = auth.uid())
  );

create policy "Admin avatars write" on storage.objects
  for insert with check (
    bucket_id = 'admin-avatars'
    and split_part(name, '/', 1) = (select business_id::text from profiles where id = auth.uid())
  );

create policy "Product images read" on storage.objects
  for select using (
    bucket_id = 'product-images'
    and split_part(name, '/', 1) = (select business_id::text from profiles where id = auth.uid())
  );

create policy "Product images write" on storage.objects
  for insert with check (
    bucket_id = 'product-images'
    and split_part(name, '/', 1) = (select business_id::text from profiles where id = auth.uid())
  );

create policy "Job images read" on storage.objects
  for select using (
    bucket_id = 'job-images'
    and split_part(name, '/', 1) = (select business_id::text from profiles where id = auth.uid())
  );

create policy "Job images write" on storage.objects
  for insert with check (
    bucket_id = 'job-images'
    and split_part(name, '/', 1) = (select business_id::text from profiles where id = auth.uid())
  );

create policy "Customer images read" on storage.objects
  for select using (
    bucket_id = 'customer-images'
    and split_part(name, '/', 1) = (select business_id::text from profiles where id = auth.uid())
  );

create policy "Customer images write" on storage.objects
  for insert with check (
    bucket_id = 'customer-images'
    and split_part(name, '/', 1) = (select business_id::text from profiles where id = auth.uid())
  );
