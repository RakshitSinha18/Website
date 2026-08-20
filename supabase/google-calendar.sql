-- ============================================================================
--  GOOGLE CALENDAR / MEET SYNC
--  Run in Supabase → SQL Editor. Idempotent.
--
--  Stores the mentor's Google OAuth refresh token (single row, mentor-only) and
--  adds columns on class_bookings for the created event + Meet link.
--
--  Setup (mentor, in Google Cloud — see GOOGLE-CALENDAR-SETUP.md):
--    1. Enable the Google Calendar API.
--    2. Create an OAuth client (Web); scope https://www.googleapis.com/auth/calendar.events
--    3. Authorize once to obtain a REFRESH token; store it via the Edge Function
--       secret GOOGLE_REFRESH_TOKEN (or in the google_integration row below).
-- ============================================================================

-- Meet/Calendar fields on a booking.
alter table public.class_bookings add column if not exists google_event_id text;
alter table public.class_bookings add column if not exists meet_link       text;

-- Single-row store for the mentor's Google integration (kept out of client reach).
create table if not exists public.google_integration (
  id            int primary key default 1,
  refresh_token text,
  connected     boolean not null default false,
  updated_at    timestamptz not null default now(),
  constraint google_integration_singleton check (id = 1)
);
insert into public.google_integration (id) values (1) on conflict (id) do nothing;

alter table public.google_integration enable row level security;

-- Only the mentor may read/write the integration row; nobody else, ever.
drop policy if exists "mentor reads google integration" on public.google_integration;
create policy "mentor reads google integration"
  on public.google_integration for select to authenticated using (public.is_mentor());

drop policy if exists "mentor writes google integration" on public.google_integration;
create policy "mentor writes google integration"
  on public.google_integration for all to authenticated
  using (public.is_mentor()) with check (public.is_mentor());
