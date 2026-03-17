-- Core tables
create table if not exists businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  login_id text unique not null,
  role text not null check (role in ('master', 'admin')),
  business_id uuid not null references businesses(id),
  created_at timestamptz default now()
);

alter table profiles enable row level security;

create policy "Profiles read own" on profiles
  for select using (auth.uid() = id);

create policy "Profiles update own" on profiles
  for update using (auth.uid() = id);

-- Example business-scoped tables
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id),
  name text not null,
  quantity integer not null default 0,
  rate numeric not null default 0,
  image_path text,
  created_at timestamptz default now()
);

create table if not exists jobs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id),
  title text,
  status text,
  image_path text,
  created_at timestamptz default now()
);

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id),
  name text,
  phone text,
  image_path text,
  created_at timestamptz default now()
);

alter table products enable row level security;
alter table jobs enable row level security;
alter table customers enable row level security;

-- Business isolation policies
create policy "Products business read" on products
  for select using (business_id = (select business_id from profiles where id = auth.uid()));
create policy "Products business write" on products
  for insert with check (business_id = (select business_id from profiles where id = auth.uid()));
create policy "Products business update" on products
  for update using (business_id = (select business_id from profiles where id = auth.uid()));
create policy "Products business delete" on products
  for delete using (business_id = (select business_id from profiles where id = auth.uid()));

create policy "Jobs business read" on jobs
  for select using (business_id = (select business_id from profiles where id = auth.uid()));
create policy "Jobs business write" on jobs
  for insert with check (business_id = (select business_id from profiles where id = auth.uid()));
create policy "Jobs business update" on jobs
  for update using (business_id = (select business_id from profiles where id = auth.uid()));
create policy "Jobs business delete" on jobs
  for delete using (business_id = (select business_id from profiles where id = auth.uid()));

create policy "Customers business read" on customers
  for select using (business_id = (select business_id from profiles where id = auth.uid()));
create policy "Customers business write" on customers
  for insert with check (business_id = (select business_id from profiles where id = auth.uid()));
create policy "Customers business update" on customers
  for update using (business_id = (select business_id from profiles where id = auth.uid()));
create policy "Customers business delete" on customers
  for delete using (business_id = (select business_id from profiles where id = auth.uid()));
