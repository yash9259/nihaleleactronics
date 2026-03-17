-- Run once in Supabase SQL editor (creates businesses + auth users + profiles)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) Create businesses first
INSERT INTO businesses (name)
SELECT 'Yash Electronics'
WHERE NOT EXISTS (
  SELECT 1 FROM businesses b WHERE b.name = 'Yash Electronics'
);

INSERT INTO businesses (name)
SELECT 'Nihal Electronics'
WHERE NOT EXISTS (
  SELECT 1 FROM businesses b WHERE b.name = 'Nihal Electronics'
);

-- 2) Create auth users
DELETE FROM profiles
WHERE login_id IN ('Yashelectronics', 'Nihalelectronics');

DELETE FROM auth.identities i
USING auth.users u
WHERE i.user_id = u.id
  AND lower(u.email) IN ('yashelectronics@admin.local', 'nihalelectronics@admin.local');

DELETE FROM auth.users
WHERE lower(email) IN ('yashelectronics@admin.local', 'nihalelectronics@admin.local');

INSERT INTO auth.users (
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
SELECT
  gen_random_uuid(),
  COALESCE((SELECT id FROM auth.instances LIMIT 1), '00000000-0000-0000-0000-000000000000'::uuid),
  'authenticated',
  'authenticated',
  'yashelectronics@admin.local',
  crypt('Yashelectronics@2026', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"login_id":"Yashelectronics"}'::jsonb,
  now(),
  now(),
  false,
  false;

INSERT INTO auth.users (
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
SELECT
  gen_random_uuid(),
  COALESCE((SELECT id FROM auth.instances LIMIT 1), '00000000-0000-0000-0000-000000000000'::uuid),
  'authenticated',
  'authenticated',
  'nihalelectronics@admin.local',
  crypt('Nihalelectronics@2026', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"login_id":"Nihalelectronics"}'::jsonb,
  now(),
  now(),
  false,
  false;

-- 3) Create identities for the users
INSERT INTO auth.identities (
  id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
)
SELECT
  gen_random_uuid(),
  u.id,
  jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
  'email',
  u.email,
  now(),
  now(),
  now()
FROM auth.users u
WHERE lower(u.email) IN ('yashelectronics@admin.local', 'nihalelectronics@admin.local')
;

-- 4) Create profiles linked to businesses
INSERT INTO profiles (id, login_id, role, business_id)
SELECT
  u.id,
  CASE WHEN lower(u.email) = 'yashelectronics@admin.local' THEN 'Yashelectronics' ELSE 'Nihalelectronics' END,
  'master',
  CASE WHEN lower(u.email) = 'yashelectronics@admin.local'
    THEN (SELECT b.id FROM businesses b WHERE b.name = 'Yash Electronics' ORDER BY b.created_at ASC LIMIT 1)
    ELSE (SELECT b.id FROM businesses b WHERE b.name = 'Nihal Electronics' ORDER BY b.created_at ASC LIMIT 1)
  END
FROM auth.users u
WHERE lower(u.email) IN ('yashelectronics@admin.local', 'nihalelectronics@admin.local')
ON CONFLICT (id) DO NOTHING;
