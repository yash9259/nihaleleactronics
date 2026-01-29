-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- REPAIRS TABLE
create table repairs (
  id text primary key, -- Keeping text to match current app's ID generation (or switch to uuid)
  firm_id text not null,
  customer_name text,
  contact_number text,
  address text,
  product text,
  issue text,
  status text check (status in ('quoted', 'approved', 'working', 'completed')),
  estimated_cost numeric,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- STOCK ITEMS TABLE
create table stock_items (
  id text primary key,
  firm_id text not null,
  name text not null,
  quantity integer default 0,
  price numeric default 0,
  category text,
  last_updated timestamp with time zone default timezone('utc'::text, now())
);

-- USED PARTS TABLE
create table used_parts (
  id text primary key,
  firm_id text not null, -- Denormalized for easier RLS/Querying
  repair_id text references repairs(id),
  stock_item_id text references stock_items(id),
  name text,
  quantity integer,
  cost numeric,
  date_used timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS (Optional for now, but good practice)
alter table repairs enable row level security;
alter table stock_items enable row level security;
alter table used_parts enable row level security;

-- POLICY: Allow public access for now (since we use custom Firm ID logic)
-- In a real production app, we would map Firm ID to Supabase Auth User ID
create policy "Public access" on repairs for all using (true);
create policy "Public access" on stock_items for all using (true);
create policy "Public access" on used_parts for all using (true);
