-- ============================================================================
--  CREATE RAKSHIT'S ADMIN ACCOUNT  (run ONCE in Supabase → SQL Editor)
-- ----------------------------------------------------------------------------
--  Email:    rsinha1369@gmail.com
--  Password: Rakshit@2026
--  >>> CHANGE THIS PASSWORD after first login (Login → Forgot password). <<<
--
--  This inserts a confirmed auth user directly. Safe to run once; if the user
--  already exists it does nothing.
-- ============================================================================

insert into auth.users (
  instance_id, id, aud, role, email,
  encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
)
select
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'rsinha1369@gmail.com',
  crypt('Rakshit@2026', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Rakshit Sinha"}',
  now(),
  now()
where not exists (
  select 1 from auth.users where email = 'rsinha1369@gmail.com'
);

-- Create the matching identity row (required for email/password login).
insert into auth.identities (
  provider_id, user_id, identity_data, provider, created_at, updated_at, last_sign_in_at
)
select
  u.id::text, u.id,
  jsonb_build_object('sub', u.id::text, 'email', u.email),
  'email', now(), now(), now()
from auth.users u
where u.email = 'rsinha1369@gmail.com'
  and not exists (
    select 1 from auth.identities i where i.user_id = u.id and i.provider = 'email'
  );
