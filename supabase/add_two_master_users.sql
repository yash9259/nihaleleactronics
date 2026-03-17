-- Add both master users to an existing Supabase project
-- Run this in Supabase SQL Editor

create extension if not exists pgcrypto;
create extension if not exists citext;

-- 0) Ensure minimum tables exist (for fresh projects)
create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
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

-- 1) Ensure businesses exist
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

-- 2) Remove old demo users if they exist (safe re-run)
delete from public.profiles
where login_id in ('Yashelectronics', 'Nihalelectronics');

delete from auth.identities i
using auth.users u
where i.user_id = u.id
  and lower(u.email) in ('yashelectronics@admin.example.com', 'nihalelectronics@admin.example.com');

delete from auth.users
where lower(email) in ('yashelectronics@admin.example.com', 'nihalelectronics@admin.example.com');

-- 3) Create auth users
insert into auth.users (
  id,
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

-- 4) Create identity rows
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

-- 5) Create profiles linked to businesses
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
