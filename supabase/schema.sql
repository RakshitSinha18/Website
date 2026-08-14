-- Run this once in your Supabase project:
-- Dashboard → SQL Editor → paste → Run.
--
-- Creates the table that stores session / course sign-ups, and locks it down so
-- anonymous visitors can ONLY insert new bookings (not read or edit others').

create table if not exists public.session_bookings (
  id         uuid primary key default gen_random_uuid(),
  name       text        not null,
  email      text        not null,
  topic      text        not null default 'General',
  message    text        not null,
  status     text        not null default 'new',
  created_at timestamptz not null default now()
);

-- Turn on Row Level Security.
alter table public.session_bookings enable row level security;

-- Allow anyone (the public anon key) to submit a booking...
create policy "anon can insert bookings"
  on public.session_bookings
  for insert
  to anon
  with check (true);

-- ...but NOT to read them. Rakshit reads sign-ups from the Supabase dashboard
-- (Table Editor), which uses the privileged service role and bypasses RLS.
-- No SELECT policy for anon = the public site cannot list other people's data.
