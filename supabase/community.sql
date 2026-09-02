-- ============================================================================
--  STUDENT COMMUNITY — Discord invite link
--  Run in Supabase → SQL Editor. Idempotent.
--
--  One column on the single-row settings table. The admin pastes a Discord
--  server invite (use a non-expiring invite); the portal shows a "Join the
--  community" banner to signed-in students only while the link is non-empty.
--  Clear the field to hide the banner everywhere.
-- ============================================================================

alter table public.settings add column if not exists discord_invite_url text not null default '';
