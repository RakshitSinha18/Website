-- ============================================================================
--  CLASS / SESSION POLICY  —  one clear, editable policy both sides can see
--  Run in Supabase → SQL Editor. Idempotent.
--
--  Stored on the singleton settings row so the mentor edits it in admin and it
--  shows to students at booking + on the /policy page. Plain language, not legalese.
-- ============================================================================

alter table public.settings add column if not exists class_policy text not null default
  E'Attendance: please join on time; sessions start as scheduled.\n'
  || E'Reschedule: you may reschedule up to 24 hours before a session, from your portal.\n'
  || E'Cancellation & refunds: cancellations 24h+ before are eligible per the refund policy; no-shows are non-refundable.\n'
  || E'Payment: your seat is confirmed once payment is received.\n'
  || E'Materials & transcripts: shared in your portal after a session is confirmed.';

-- settings already has RLS: authenticated read, mentor update. The new column
-- inherits those policies, so students can read the policy and only Rakshit edits it.
