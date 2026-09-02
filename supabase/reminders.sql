-- ============================================================================
--  SESSION REMINDER EMAILS  —  schema + hourly schedule
--  Run in Supabase → SQL Editor. Idempotent.
--
--  • profiles.email_reminders : the portal Settings toggle, now real. The
--    reminders Edge Function skips students who turned it off.
--  • class_bookings.reminded_at : set once a reminder is processed, so each
--    booking is reminded exactly once even though the cron runs hourly.
--  • cron job : pg_cron + pg_net POST the reminders function every hour with
--    a shared secret header (X-Reminders-Secret). The secret lives in the
--    function's env (supabase secrets) and inside this job — rotate both
--    together. It is NOT the service-role key on purpose: leaking it only
--    lets someone trigger an idempotent reminder run.
-- ============================================================================

alter table public.profiles add column if not exists email_reminders boolean not null default true;
alter table public.class_bookings add column if not exists reminded_at timestamptz;

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Replace any previous schedule, then register the hourly run.
-- EDIT the secret below if you rotate REMINDERS_SECRET.
select cron.unschedule('session-reminders-hourly')
where exists (select 1 from cron.job where jobname = 'session-reminders-hourly');

select cron.schedule(
  'session-reminders-hourly',
  '5 * * * *', -- five past every hour
  $$
  select net.http_post(
    url := 'https://ipuwwhksolvkswsnseis.supabase.co/functions/v1/reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-Reminders-Secret', '__REMINDERS_SECRET__'
    ),
    body := '{}'::jsonb
  );
  $$
);
