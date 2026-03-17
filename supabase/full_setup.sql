-- =========================================================
-- FULL SUPABASE SETUP (Schema + RLS + Storage + Demo Seed)
-- Run in Supabase SQL Editor on a fresh project.
-- =========================================================

create extension if not exists pgcrypto;
create extension if not exists citext;

-- ---------------------------------------------------------
-- Utility functions
-- ---------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.current_business_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select p.business_id
  from public.profiles p
  where p.id = auth.uid()
  limit 1;
$$;

-- ---------------------------------------------------------
-- Core tables
-- ---------------------------------------------------------
create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  address text,
  phone text,
  email text,
  logo_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  login_id citext not null unique,
  full_name text,
  email text,
  phone text,
  role text not null check (role in ('master', 'admin')),
  business_id uuid not null references public.businesses(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  quantity integer not null default 0 check (quantity >= 0),
  rate numeric(12,2) not null default 0 check (rate >= 0),
  image_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  phone text,
  alternate_phone text,
  address text,
  city text,
  pincode text,
  image_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,

  external_job_id text,
  title text,
  status text not null default 'Inbox' check (
    status in (
      'Inbox',
      'Not Reviewed',
      'Under Review',
      'Estimate Pending',
      'Estimate Approved',
      'On Workbench',
      'Ready to Deliver',
      'Delivered',
      'Completed',
      'Most Urgent'
    )
  ),
  job_date date default current_date,

  customer_name text,
  mobile_number text,
  alternate_mobile text,
  address text,
  city text,
  pincode text,

  product_category text,
  brand text,
  model_name text,
  serial_number text,
  warranty_status text default 'No' check (warranty_status in ('Yes', 'No')),
  purchase_date date,

  problem_reported text,
  initial_diagnosis text,
  technician_assigned text,
  priority_level text default 'Normal',
  service_type text default 'Repair',

  labor_charges numeric(12,2) not null default 0 check (labor_charges >= 0),
  estimate_approval_status text default 'Pending',

  workbench_start_date date,
  repair_completion_date date,
  ready_to_deliver_date date,

  payment_status text default 'Unpaid',
  payment_mode text default 'Cash',
  paid_amount numeric(12,2) not null default 0 check (paid_amount >= 0),

  internal_notes text,
  customer_remarks text,
  image_path text,

  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint jobs_external_job_id_unique_per_business unique (business_id, external_job_id)
);

create table if not exists public.job_parts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  part_name text not null,
  qty_used integer not null check (qty_used > 0),
  rate numeric(12,2) not null default 0 check (rate >= 0),
  total numeric(12,2) generated always as (qty_used * rate) stored,
  created_at timestamptz not null default now()
);

-- Helpful indexes
create index if not exists idx_profiles_business_id on public.profiles (business_id);
create index if not exists idx_products_business_id_created_at on public.products (business_id, created_at desc);
create index if not exists idx_customers_business_id_created_at on public.customers (business_id, created_at desc);
create index if not exists idx_jobs_business_id_created_at on public.jobs (business_id, created_at desc);
create index if not exists idx_jobs_business_status on public.jobs (business_id, status);
create index if not exists idx_job_parts_business_job on public.job_parts (business_id, job_id);

-- updated_at triggers

drop trigger if exists trg_businesses_updated_at on public.businesses;
create trigger trg_businesses_updated_at
before update on public.businesses
for each row execute function public.set_updated_at();

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists trg_products_updated_at on public.products;
create trigger trg_products_updated_at
before update on public.products
for each row execute function public.set_updated_at();

drop trigger if exists trg_customers_updated_at on public.customers;
create trigger trg_customers_updated_at
before update on public.customers
for each row execute function public.set_updated_at();

drop trigger if exists trg_jobs_updated_at on public.jobs;
create trigger trg_jobs_updated_at
before update on public.jobs
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------
-- RLS + policies
-- ---------------------------------------------------------
alter table public.businesses enable row level security;
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.customers enable row level security;
alter table public.jobs enable row level security;
alter table public.job_parts enable row level security;

-- businesses

drop policy if exists "Businesses read own" on public.businesses;
create policy "Businesses read own"
on public.businesses
for select
using (id = public.current_business_id());

drop policy if exists "Businesses update by master" on public.businesses;
create policy "Businesses update by master"
on public.businesses
for update
using (
  id = public.current_business_id()
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role = 'master'
      and p.business_id = businesses.id
  )
)
with check (
  id = public.current_business_id()
);

-- profiles

drop policy if exists "Profiles read own business" on public.profiles;
create policy "Profiles read own business"
on public.profiles
for select
using (business_id = public.current_business_id());

drop policy if exists "Profiles update own row" on public.profiles;
create policy "Profiles update own row"
on public.profiles
for update
using (id = auth.uid())
with check (business_id = public.current_business_id());

drop policy if exists "Profiles insert by master" on public.profiles;
create policy "Profiles insert by master"
on public.profiles
for insert
with check (
  business_id = public.current_business_id()
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role = 'master'
      and p.business_id = profiles.business_id
  )
);

-- products

drop policy if exists "Products read own business" on public.products;
create policy "Products read own business"
on public.products
for select
using (business_id = public.current_business_id());

drop policy if exists "Products insert own business" on public.products;
create policy "Products insert own business"
on public.products
for insert
with check (business_id = public.current_business_id());

drop policy if exists "Products update own business" on public.products;
create policy "Products update own business"
on public.products
for update
using (business_id = public.current_business_id())
with check (business_id = public.current_business_id());

drop policy if exists "Products delete own business" on public.products;
create policy "Products delete own business"
on public.products
for delete
using (business_id = public.current_business_id());

-- customers

drop policy if exists "Customers read own business" on public.customers;
create policy "Customers read own business"
on public.customers
for select
using (business_id = public.current_business_id());

drop policy if exists "Customers insert own business" on public.customers;
create policy "Customers insert own business"
on public.customers
for insert
with check (business_id = public.current_business_id());

drop policy if exists "Customers update own business" on public.customers;
create policy "Customers update own business"
on public.customers
for update
using (business_id = public.current_business_id())
with check (business_id = public.current_business_id());

drop policy if exists "Customers delete own business" on public.customers;
create policy "Customers delete own business"
on public.customers
for delete
using (business_id = public.current_business_id());

-- jobs

drop policy if exists "Jobs read own business" on public.jobs;
create policy "Jobs read own business"
on public.jobs
for select
using (business_id = public.current_business_id());

drop policy if exists "Jobs insert own business" on public.jobs;
create policy "Jobs insert own business"
on public.jobs
for insert
with check (business_id = public.current_business_id());

drop policy if exists "Jobs update own business" on public.jobs;
create policy "Jobs update own business"
on public.jobs
for update
using (business_id = public.current_business_id())
with check (business_id = public.current_business_id());

drop policy if exists "Jobs delete own business" on public.jobs;
create policy "Jobs delete own business"
on public.jobs
for delete
using (business_id = public.current_business_id());

-- job_parts

drop policy if exists "Job parts read own business" on public.job_parts;
create policy "Job parts read own business"
on public.job_parts
for select
using (business_id = public.current_business_id());

drop policy if exists "Job parts insert own business" on public.job_parts;
create policy "Job parts insert own business"
on public.job_parts
for insert
with check (business_id = public.current_business_id());

drop policy if exists "Job parts update own business" on public.job_parts;
create policy "Job parts update own business"
on public.job_parts
for update
using (business_id = public.current_business_id())
with check (business_id = public.current_business_id());

drop policy if exists "Job parts delete own business" on public.job_parts;
create policy "Job parts delete own business"
on public.job_parts
for delete
using (business_id = public.current_business_id());

-- ---------------------------------------------------------
-- Storage buckets + policies
-- ---------------------------------------------------------
insert into storage.buckets (id, name, public)
values
  ('admin-avatars', 'admin-avatars', false),
  ('product-images', 'product-images', false),
  ('job-images', 'job-images', false),
  ('customer-images', 'customer-images', false),
  ('business-logos', 'business-logos', false)
on conflict (id) do nothing;

-- Clean up old policies if script re-run

drop policy if exists "Business files read" on storage.objects;
drop policy if exists "Business files insert" on storage.objects;
drop policy if exists "Business files update" on storage.objects;
drop policy if exists "Business files delete" on storage.objects;

create policy "Business files read"
on storage.objects
for select
using (
  bucket_id in ('admin-avatars', 'product-images', 'job-images', 'customer-images', 'business-logos')
  and split_part(name, '/', 1) = public.current_business_id()::text
);

create policy "Business files insert"
on storage.objects
for insert
with check (
  bucket_id in ('admin-avatars', 'product-images', 'job-images', 'customer-images', 'business-logos')
  and split_part(name, '/', 1) = public.current_business_id()::text
);

create policy "Business files update"
on storage.objects
for update
using (
  bucket_id in ('admin-avatars', 'product-images', 'job-images', 'customer-images', 'business-logos')
  and split_part(name, '/', 1) = public.current_business_id()::text
)
with check (
  bucket_id in ('admin-avatars', 'product-images', 'job-images', 'customer-images', 'business-logos')
  and split_part(name, '/', 1) = public.current_business_id()::text
);

create policy "Business files delete"
on storage.objects
for delete
using (
  bucket_id in ('admin-avatars', 'product-images', 'job-images', 'customer-images', 'business-logos')
  and split_part(name, '/', 1) = public.current_business_id()::text
);

-- ---------------------------------------------------------
-- Demo seed (optional but included)
-- ---------------------------------------------------------
-- Creates two businesses and two master users used in your current app.

insert into public.businesses (name)
select 'Yash Electronics'
where not exists (
  select 1 from public.businesses b where b.name = 'Yash Electronics'
);

insert into public.businesses (name)
select 'Nihal Electronics'
where not exists (
  select 1 from public.businesses b where b.name = 'Nihal Electronics'
);

-- Reset old demo users if present

delete from public.profiles
where login_id in ('Yashelectronics', 'Nihalelectronics');

delete from auth.identities i
using auth.users u
where i.user_id = u.id
  and lower(u.email) in ('yashelectronics@admin.example.com', 'nihalelectronics@admin.example.com');

delete from auth.users
where lower(email) in ('yashelectronics@admin.example.com', 'nihalelectronics@admin.example.com');

-- Create auth users directly for demo only
insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  is_sso_user,
  is_anonymous
)
select
  gen_random_uuid(),
  coalesce((select id from auth.instances limit 1), '00000000-0000-0000-0000-000000000000'::uuid),
  'authenticated',
  'authenticated',
  'yashelectronics@admin.example.com',
  crypt('Yashelectronics@2026', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"login_id":"Yashelectronics"}'::jsonb,
  now(),
  now(),
  false,
  false;

insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  is_sso_user,
  is_anonymous
)
select
  gen_random_uuid(),
  coalesce((select id from auth.instances limit 1), '00000000-0000-0000-0000-000000000000'::uuid),
  'authenticated',
  'authenticated',
  'nihalelectronics@admin.example.com',
  crypt('Nihalelectronics@2026', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"login_id":"Nihalelectronics"}'::jsonb,
  now(),
  now(),
  false,
  false;

insert into auth.identities (
  id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
)
select
  gen_random_uuid(),
  u.id,
  jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
  'email',
  u.email,
  now(),
  now(),
  now()
from auth.users u
where lower(u.email) in ('yashelectronics@admin.example.com', 'nihalelectronics@admin.example.com');

insert into public.profiles (id, login_id, role, business_id)
select
  u.id,
  case when lower(u.email) = 'yashelectronics@admin.example.com' then 'Yashelectronics' else 'Nihalelectronics' end,
  'master',
  case
    when lower(u.email) = 'yashelectronics@admin.example.com'
      then (select b.id from public.businesses b where b.name = 'Yash Electronics' order by b.created_at asc limit 1)
    else (select b.id from public.businesses b where b.name = 'Nihal Electronics' order by b.created_at asc limit 1)
  end
from auth.users u
where lower(u.email) in ('yashelectronics@admin.example.com', 'nihalelectronics@admin.example.com')
on conflict (id) do nothing;

-- Done.
