-- Quick fix for missing app tables in a fresh Supabase project
-- Run this in Supabase SQL Editor

create extension if not exists pgcrypto;
create extension if not exists citext;

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

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  customer_id uuid,
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
  warranty_status text default 'No',
  purchase_date date,
  problem_reported text,
  initial_diagnosis text,
  technician_assigned text,
  priority_level text default 'Normal',
  service_type text default 'Repair',
  labor_charges numeric(12,2) not null default 0,
  estimate_approval_status text default 'Pending',
  workbench_start_date date,
  repair_completion_date date,
  ready_to_deliver_date date,
  payment_status text default 'Unpaid',
  payment_mode text default 'Cash',
  paid_amount numeric(12,2) not null default 0,
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
  rate numeric(12,2) not null default 0,
  total numeric(12,2) generated always as (qty_used * rate) stored,
  created_at timestamptz not null default now()
);

create index if not exists idx_products_business_created on public.products (business_id, created_at desc);
create index if not exists idx_jobs_business_created on public.jobs (business_id, created_at desc);

alter table public.businesses enable row level security;
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.jobs enable row level security;
alter table public.job_parts enable row level security;

drop policy if exists "Businesses read own" on public.businesses;
create policy "Businesses read own" on public.businesses
for select using (id = public.current_business_id());

drop policy if exists "Profiles read own business" on public.profiles;
create policy "Profiles read own business" on public.profiles
for select using (business_id = public.current_business_id());

drop policy if exists "Products read own business" on public.products;
create policy "Products read own business" on public.products
for select using (business_id = public.current_business_id());

drop policy if exists "Products insert own business" on public.products;
create policy "Products insert own business" on public.products
for insert with check (business_id = public.current_business_id());

drop policy if exists "Products update own business" on public.products;
create policy "Products update own business" on public.products
for update using (business_id = public.current_business_id()) with check (business_id = public.current_business_id());

drop policy if exists "Products delete own business" on public.products;
create policy "Products delete own business" on public.products
for delete using (business_id = public.current_business_id());

drop policy if exists "Jobs read own business" on public.jobs;
create policy "Jobs read own business" on public.jobs
for select using (business_id = public.current_business_id());

drop policy if exists "Jobs insert own business" on public.jobs;
create policy "Jobs insert own business" on public.jobs
for insert with check (business_id = public.current_business_id());

drop policy if exists "Jobs update own business" on public.jobs;
create policy "Jobs update own business" on public.jobs
for update using (business_id = public.current_business_id()) with check (business_id = public.current_business_id());

drop policy if exists "Jobs delete own business" on public.jobs;
create policy "Jobs delete own business" on public.jobs
for delete using (business_id = public.current_business_id());

drop policy if exists "Job parts read own business" on public.job_parts;
create policy "Job parts read own business" on public.job_parts
for select using (business_id = public.current_business_id());

drop policy if exists "Job parts insert own business" on public.job_parts;
create policy "Job parts insert own business" on public.job_parts
for insert with check (business_id = public.current_business_id());

drop trigger if exists trg_businesses_updated_at on public.businesses;
create trigger trg_businesses_updated_at before update on public.businesses
for each row execute function public.set_updated_at();

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists trg_products_updated_at on public.products;
create trigger trg_products_updated_at before update on public.products
for each row execute function public.set_updated_at();

drop trigger if exists trg_jobs_updated_at on public.jobs;
create trigger trg_jobs_updated_at before update on public.jobs
for each row execute function public.set_updated_at();
