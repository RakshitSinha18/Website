-- ============================================================================
--  RSVP / attendance on a booking
--  Run in Supabase → SQL Editor. Idempotent.
--
--  Lets a student mark whether they'll attend a confirmed session ('attending')
--  or can't make it that day ('opted_out'). The guard trigger from reschedule.sql
--  only protects status/payment_status, so students can freely set this column.
-- ============================================================================

alter table public.class_bookings
  add column if not exists attendance text not null default 'pending'
  check (attendance in ('pending', 'attending', 'opted_out'));
