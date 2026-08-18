-- ============================================================================
-- Rakshit Sinha — mentoring site database schema
-- Run this in Supabase → SQL Editor → New query → Run.
-- Safe to re-run (uses IF NOT EXISTS / OR REPLACE where possible).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Public "Book a Session" requests (from the landing page, no login needed)
-- ---------------------------------------------------------------------------
create table if not exists public.session_bookings (
  id         uuid primary key default gen_random_uuid(),
  name       text        not null,
  email      text        not null,
  topic      text        not null default 'General',
  message    text        not null,
  status     text        not null default 'new',
  created_at timestamptz not null default now()
);

alter table public.session_bookings enable row level security;

drop policy if exists "anon can insert bookings" on public.session_bookings;
create policy "anon can insert bookings"
  on public.session_bookings
  for insert to anon, authenticated
  with check (true);

-- ---------------------------------------------------------------------------
-- 2. Student profiles (one row per authenticated user)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  full_name  text,
  experience text,          -- e.g. Beginner / Intermediate / Advanced
  goals      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "users read own profile" on public.profiles;
create policy "users read own profile"
  on public.profiles for select to authenticated
  using (auth.uid() = id);

drop policy if exists "users upsert own profile" on public.profiles;
create policy "users insert own profile"
  on public.profiles for insert to authenticated
  with check (auth.uid() = id);

drop policy if exists "users update own profile" on public.profiles;
create policy "users update own profile"
  on public.profiles for update to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

-- Auto-create a profile row when a new user signs up.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 3. Class catalog (what Rakshit offers). Readable by everyone.
-- ---------------------------------------------------------------------------
create table if not exists public.classes (
  id          uuid primary key default gen_random_uuid(),
  title       text        not null,
  description text        not null default '',
  duration    text        not null default '1–2 hours',
  active      boolean     not null default true,
  created_at  timestamptz not null default now()
);

alter table public.classes enable row level security;

drop policy if exists "anyone can read classes" on public.classes;
create policy "anyone can read classes"
  on public.classes for select to anon, authenticated
  using (active = true);

-- Seed the catalog (only inserts if the table is empty).
insert into public.classes (title, description, duration)
select * from (values
  ('Tableau Dashboards', 'Design, build and publish interactive Tableau dashboards from scratch.', '1–2 hours'),
  ('SQL & T-SQL Foundations', 'Query, join and model data confidently in SQL Server.', '1–2 hours'),
  ('Advanced Excel for Analysts', 'Formulas, pivots and automated reporting workflows.', '1–2 hours'),
  ('Base SAS Programming 9.4', 'Data steps, procedures and reporting with Base SAS.', '1–2 hours'),
  ('BI Career Guidance', 'Portfolio, interviews and breaking into business intelligence.', '1 hour')
) as seed(title, description, duration)
where not exists (select 1 from public.classes);

-- ---------------------------------------------------------------------------
-- 4. Class bookings by logged-in students (after-hours, evening slots)
-- ---------------------------------------------------------------------------
create table if not exists public.class_bookings (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid        not null references auth.users(id) on delete cascade,
  class_id     uuid        references public.classes(id) on delete set null,
  class_title  text        not null,
  scheduled_at timestamptz not null,     -- chosen date + evening time slot
  notes        text        not null default '',
  status       text        not null default 'requested',
  created_at   timestamptz not null default now()
);

alter table public.class_bookings enable row level security;

drop policy if exists "students read own class bookings" on public.class_bookings;
create policy "students read own class bookings"
  on public.class_bookings for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "students create own class bookings" on public.class_bookings;
create policy "students create own class bookings"
  on public.class_bookings for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "students cancel own class bookings" on public.class_bookings;
create policy "students update own class bookings"
  on public.class_bookings for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 4b. Mentor (admin) access — Rakshit can read & manage everything.
--     Identified by the email on the JWT. Change to match your owner email.
-- ---------------------------------------------------------------------------
create or replace function public.is_mentor()
returns boolean language sql stable as $$
  select coalesce(
    lower(auth.jwt() ->> 'email') in ('rsinha1369@gmail.com', 'sinharakshit1988@gmail.com'),
    false
  );
$$;

drop policy if exists "mentor reads all class bookings" on public.class_bookings;
create policy "mentor reads all class bookings"
  on public.class_bookings for select to authenticated
  using (public.is_mentor());

drop policy if exists "mentor updates all class bookings" on public.class_bookings;
create policy "mentor updates all class bookings"
  on public.class_bookings for update to authenticated
  using (public.is_mentor()) with check (public.is_mentor());

drop policy if exists "mentor reads session requests" on public.session_bookings;
create policy "mentor reads session requests"
  on public.session_bookings for select to authenticated
  using (public.is_mentor());

drop policy if exists "mentor reads all profiles" on public.profiles;
create policy "mentor reads all profiles"
  on public.profiles for select to authenticated
  using (public.is_mentor());

-- ---------------------------------------------------------------------------
-- 5. Learning roadmap — day-to-day tasks/activities students work through
--    to become professionals. Read by everyone; Rakshit curates the content.
-- ---------------------------------------------------------------------------
create table if not exists public.roadmap_tasks (
  id          uuid primary key default gen_random_uuid(),
  track       text        not null,            -- e.g. 'Data Analytics'
  day         int         not null,            -- ordering / day number
  title       text        not null,
  description text        not null default '',
  resource    text        not null default '', -- optional link/resource
  created_at  timestamptz not null default now()
);

alter table public.roadmap_tasks enable row level security;

drop policy if exists "anyone reads roadmap" on public.roadmap_tasks;
create policy "anyone reads roadmap"
  on public.roadmap_tasks for select to anon, authenticated
  using (true);

-- Per-student progress: which roadmap tasks they've completed.
create table if not exists public.task_progress (
  user_id     uuid        not null references auth.users(id) on delete cascade,
  task_id     uuid        not null references public.roadmap_tasks(id) on delete cascade,
  completed   boolean     not null default true,
  updated_at  timestamptz not null default now(),
  primary key (user_id, task_id)
);

alter table public.task_progress enable row level security;

drop policy if exists "students read own progress" on public.task_progress;
create policy "students read own progress"
  on public.task_progress for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "students write own progress" on public.task_progress;
create policy "students insert own progress"
  on public.task_progress for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "students update own progress" on public.task_progress;
create policy "students update own progress"
  on public.task_progress for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "students delete own progress" on public.task_progress;
create policy "students delete own progress"
  on public.task_progress for delete to authenticated
  using (auth.uid() = user_id);

-- Seed a Data Analytics roadmap (only if empty).
insert into public.roadmap_tasks (track, day, title, description)
select * from (values
  ('Data Analytics', 1, 'Analytics foundations', 'Understand the analytics workflow: question → data → insight → action.'),
  ('Data Analytics', 2, 'Excel essentials', 'Formulas, lookups and PivotTables on a real dataset.'),
  ('Data Analytics', 3, 'SQL basics', 'SELECT, WHERE, GROUP BY and JOINs to pull the data you need.'),
  ('Data Analytics', 4, 'Data cleaning', 'Handle nulls, duplicates and types; shape data for analysis.'),
  ('Data Analytics', 5, 'Your first Tableau dashboard', 'Build and publish an interactive dashboard from a dataset.'),
  ('Data Analytics', 6, 'KPIs & storytelling', 'Choose the right metrics and present a clear data story.'),
  ('Data Analytics', 7, 'Capstone project', 'Deliver an end-to-end analysis and add it to your portfolio.')
) as seed(track, day, title, description)
where not exists (select 1 from public.roadmap_tasks);
