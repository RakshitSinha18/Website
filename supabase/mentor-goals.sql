-- ============================================================================
--  MENTOR GROWTH GOALS — "evolution is teaching and learning at the same time"
--  Run in Supabase → SQL Editor. Idempotent.
--
--  The mentor's own yearly learning journey, phased by quarter. A goal's
--  lifecycle mirrors the philosophy: planned → learning → teaching → done —
--  you haven't finished learning something until you've taught it.
--  Mentor-only (RLS via is_mentor()); rendered in the admin Growth tab.
-- ============================================================================

create table if not exists public.mentor_goals (
  id         uuid primary key default gen_random_uuid(),
  year       int  not null default extract(year from now()),
  quarter    int  not null check (quarter between 1 and 4),
  title      text not null,
  notes      text not null default '',
  status     text not null default 'planned' check (status in ('planned','learning','teaching','done')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.mentor_goals enable row level security;

drop policy if exists "mentor manages growth goals" on public.mentor_goals;
create policy "mentor manages growth goals"
  on public.mentor_goals for all to authenticated
  using (public.is_mentor()) with check (public.is_mentor());
