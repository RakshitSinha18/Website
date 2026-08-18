-- ============================================================================
--  AVAILABILITY  —  Rakshit's weekly recurring schedule + holiday blocking
--  Run this in Supabase → SQL Editor. Idempotent; safe to re-run.
--
--  Adds two columns to the singleton `settings` table (id = 1):
--    • weekly_availability : which hours are open on each weekday (recurring)
--    • blocked_dates       : specific calendar dates that are closed (holidays)
--
--  The student booking calendar reads these to decide which days/slots to offer;
--  the admin "Availability" tab writes them. No Edge Functions needed — this is
--  plain data on a row the portal already fetches.
-- ============================================================================

-- weekly_availability: JSON object keyed by weekday number as a STRING
--   0 = Sunday … 6 = Saturday, each mapping to an array of "HH:MM" start times.
--   Example: {"2": ["18:00","19:00"], "4": ["18:00","19:00","20:00"], "6": ["17:00"]}
--   An empty array or a missing key means Rakshit is OFF that weekday.
alter table public.settings
  add column if not exists weekly_availability jsonb not null default '{}'::jsonb;

-- blocked_dates: JSON array of "YYYY-MM-DD" strings that are closed even if the
--   weekday would normally be open (vacations, holidays).
--   Example: ["2026-08-25", "2026-12-25"]
alter table public.settings
  add column if not exists blocked_dates jsonb not null default '[]'::jsonb;

-- Optional: a friendly note shown to students on the booking calendar
--   (e.g. "Evening slots only · Asia/Kolkata time").
alter table public.settings
  add column if not exists availability_note text not null default '';

-- Sensible starting schedule so the calendar isn't empty before Rakshit edits it:
--   Tue/Thu/Sat evenings. Only applied if weekly_availability is still the default {}.
update public.settings
  set weekly_availability = '{"2":["18:00","19:00"],"4":["18:00","19:00","20:00"],"6":["17:00","18:00"]}'::jsonb
  where id = 1 and weekly_availability = '{}'::jsonb;

-- RLS is already configured on public.settings by setup.sql:
--   • authenticated users may SELECT (students read availability to book)
--   • only the mentor (is_mentor()) may UPDATE (Rakshit edits the schedule)
-- These new columns inherit those row-level policies automatically.
