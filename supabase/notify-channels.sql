-- ============================================================================
--  NOTIFICATION CHANNELS — admin-attachable Discord/Slack webhooks
--  Run in Supabase → SQL Editor. Idempotent.
--
--  Webhook URLs are effectively secrets (anyone holding one can post to the
--  channel), so they live in their OWN singleton table readable only by the
--  mentor — NOT in `settings`, which signed-in students can read. The notify
--  Edge Function reads this via the service role and mirrors every owner
--  alert (new booking / reschedule / can't-attend / paid) into whichever
--  channels are attached. Clear a field in the admin panel to detach.
-- ============================================================================

create table if not exists public.notify_channels (
  id                  int primary key default 1,
  discord_webhook_url text not null default '',
  slack_webhook_url   text not null default '',
  updated_at          timestamptz not null default now(),
  constraint notify_channels_singleton check (id = 1)
);
insert into public.notify_channels (id) values (1) on conflict (id) do nothing;

alter table public.notify_channels enable row level security;

drop policy if exists "mentor reads notify channels" on public.notify_channels;
create policy "mentor reads notify channels"
  on public.notify_channels for select to authenticated
  using (public.is_mentor());

drop policy if exists "mentor updates notify channels" on public.notify_channels;
create policy "mentor updates notify channels"
  on public.notify_channels for update to authenticated
  using (public.is_mentor()) with check (public.is_mentor());
