    -- Use this AFTER creating users from Supabase Dashboard -> Authentication -> Users
    -- Required users/emails:
    --   yashelectronics@gmail.com (password: Yashelectronics@2026)
    --   nihalelectronics@gmail.com (password: Nihalelectronics@2026)

    create extension if not exists citext;

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

    insert into public.businesses (name)
    select 'Yash Electronics'
    where not exists (select 1 from public.businesses where name = 'Yash Electronics');

    insert into public.businesses (name)
    select 'Nihal Electronics'
    where not exists (select 1 from public.businesses where name = 'Nihal Electronics');

    -- remove old rows by login_id if any
    delete from public.profiles where login_id in ('Yashelectronics', 'Nihalelectronics');

    -- link auth users to profiles
    insert into public.profiles (id, login_id, role, business_id)
    select
    u.id,
    case
        when lower(u.email) = 'yashelectronics@gmail.com' then 'Yashelectronics'
        when lower(u.email) = 'nihalelectronics@gmail.com' then 'Nihalelectronics'
    end as login_id,
    'master' as role,
    case
        when lower(u.email) = 'yashelectronics@gmail.com'
        then (select b.id from public.businesses b where b.name = 'Yash Electronics' limit 1)
        when lower(u.email) = 'nihalelectronics@gmail.com'
        then (select b.id from public.businesses b where b.name = 'Nihal Electronics' limit 1)
    end as business_id
    from auth.users u
    where lower(u.email) in ('yashelectronics@gmail.com', 'nihalelectronics@gmail.com')
    on conflict (id) do update
    set login_id = excluded.login_id,
        role = excluded.role,
        business_id = excluded.business_id;
