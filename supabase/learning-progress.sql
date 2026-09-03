-- ============================================================================
--  LEARNING PROGRESS SYNC + STUDENT ROSTER SUPPORT
--  Run in Supabase → SQL Editor. Idempotent.
--
--  • learning_progress : mirrors the portal's Learn (lessons) and Practice
--    (flashcards) localStorage progress so it follows the student across
--    devices — and so the mentor can see where each student actually is.
--  • task_progress     : adds the missing mentor-read policy (roadmap % in
--    the admin Students tab).
--  • profiles.email    : lets the admin roster show who a student IS without
--    touching auth.users from the client. Backfilled + set on signup.
-- ============================================================================

-- 1) LEARNING PROGRESS -------------------------------------------------------
create table if not exists public.learning_progress (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  kind         text not null check (kind in ('lesson','card','deck')),
  group_id     text not null,   -- course id (lessons/decks) or deck id (cards)
  item_id      text not null,   -- lesson / card / session-deck id within that group
  completed_at timestamptz not null default now(),
  unique (user_id, kind, group_id, item_id)
);
create index if not exists learning_progress_user_idx on public.learning_progress(user_id);
alter table public.learning_progress enable row level security;

-- Widen the kind check for pre-existing tables (idempotent): 'deck' tracks
-- completed session decks in the portal's Learn tab.
alter table public.learning_progress drop constraint if exists learning_progress_kind_check;
alter table public.learning_progress
  add constraint learning_progress_kind_check check (kind in ('lesson','card','deck'));

drop policy if exists "students read own learning progress" on public.learning_progress;
create policy "students read own learning progress"
  on public.learning_progress for select to authenticated
  using (auth.uid() = user_id or public.is_mentor());

drop policy if exists "students write own learning progress" on public.learning_progress;
create policy "students write own learning progress"
  on public.learning_progress for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "students delete own learning progress" on public.learning_progress;
create policy "students delete own learning progress"
  on public.learning_progress for delete to authenticated using (auth.uid() = user_id);

-- 2) ROADMAP PROGRESS — mentor visibility ------------------------------------
drop policy if exists "mentor reads all task progress" on public.task_progress;
create policy "mentor reads all task progress"
  on public.task_progress for select to authenticated using (public.is_mentor());

-- 3) PROFILES.EMAIL ----------------------------------------------------------
alter table public.profiles add column if not exists email text;

-- Keep it populated for new signups.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), new.email)
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

-- Backfill existing students.
update public.profiles p
set email = u.email
from auth.users u
where u.id = p.id and (p.email is null or p.email = '');
