-- ============================================================================
--  ADMIN EMAILS  —  allow more than one admin/mentor account
--  Run this in Supabase → SQL Editor. Idempotent; safe to re-run.
--
--  Rakshit signs in with two Google accounts, and both should have full admin
--  access. All RLS policies call public.is_mentor(), so redefining that one
--  function here grants admin to BOTH emails everywhere at once — no policy
--  edits needed.
--
--  To add/remove an admin later, edit the list below and re-run this file.
--  Keep this in sync with lib/config.ts → ADMIN_EMAILS (the client-side gate).
-- ============================================================================

create or replace function public.is_mentor()
returns boolean language sql stable as $$
  select coalesce(
    lower(auth.jwt() ->> 'email') in (
      'rsinha1369@gmail.com',
      'sinharakshit1988@gmail.com'
    ),
    false
  );
$$;
