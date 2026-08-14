-- ============================================================================
--  RAKSHIT SINHA — MENTORING PLATFORM · COMPLETE DATABASE SETUP
-- ----------------------------------------------------------------------------
--  Run this ONCE in Supabase → SQL Editor → New query → paste → Run.
--  This single file sets up EVERYTHING and is safe to re-run anytime:
--    • Tables (session requests, profiles, courses, bookings, roadmap, progress)
--    • Student security (each student sees only their own data)
--    • Mentor/admin security (Rakshit sees & manages everything)
--    • Payment tracking (Rakshit confirms payment manually)
--    • Auto-profile on signup + seed courses + seed roadmap
--
--  Owner email (the mentor/admin): change MENTOR_EMAIL below if needed.
-- ============================================================================

-- Who is the mentor/admin (Rakshit). Everyone else is a student.
create or replace function public.is_mentor()
returns boolean language sql stable as $$
  select coalesce(lower(auth.jwt() ->> 'email') = 'rsinha1369@gmail.com', false);
$$;

-- ============================================================================
-- 1) PUBLIC "BOOK A SESSION" REQUESTS  (landing-page form, no login needed)
-- ============================================================================
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

drop policy if exists "anyone can submit a request" on public.session_bookings;
create policy "anyone can submit a request"
  on public.session_bookings for insert to anon, authenticated with check (true);

drop policy if exists "mentor reads requests" on public.session_bookings;
create policy "mentor reads requests"
  on public.session_bookings for select to authenticated using (public.is_mentor());

drop policy if exists "mentor updates requests" on public.session_bookings;
create policy "mentor updates requests"
  on public.session_bookings for update to authenticated
  using (public.is_mentor()) with check (public.is_mentor());

-- ============================================================================
-- 2) STUDENT PROFILES  (one row per signed-up user)
-- ============================================================================
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  full_name  text,
  experience text,
  goals      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

drop policy if exists "student reads own profile" on public.profiles;
create policy "student reads own profile"
  on public.profiles for select to authenticated using (auth.uid() = id);

drop policy if exists "student inserts own profile" on public.profiles;
create policy "student inserts own profile"
  on public.profiles for insert to authenticated with check (auth.uid() = id);

drop policy if exists "student updates own profile" on public.profiles;
create policy "student updates own profile"
  on public.profiles for update to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "mentor reads all profiles" on public.profiles;
create policy "mentor reads all profiles"
  on public.profiles for select to authenticated using (public.is_mentor());

-- Auto-create a profile whenever a new user signs up.
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
  after insert on auth.users for each row execute function public.handle_new_user();

-- ============================================================================
-- 3) COURSE CATALOG  (readable by everyone; Rakshit edits it)
-- ============================================================================
create table if not exists public.classes (
  id          uuid primary key default gen_random_uuid(),
  title       text        not null,
  description text        not null default '',
  duration    text        not null default '1–2 hours',
  price       text        not null default '',
  active      boolean     not null default true,
  created_at  timestamptz not null default now()
);
-- Add price to older installs that don't have it yet.
alter table public.classes add column if not exists price text not null default '';

alter table public.classes enable row level security;

drop policy if exists "anyone reads active courses" on public.classes;
create policy "anyone reads active courses"
  on public.classes for select to anon, authenticated using (active = true);

drop policy if exists "mentor inserts courses" on public.classes;
create policy "mentor inserts courses"
  on public.classes for insert to authenticated with check (public.is_mentor());

drop policy if exists "mentor updates courses" on public.classes;
create policy "mentor updates courses"
  on public.classes for update to authenticated
  using (public.is_mentor()) with check (public.is_mentor());

drop policy if exists "mentor deletes courses" on public.classes;
create policy "mentor deletes courses"
  on public.classes for delete to authenticated using (public.is_mentor());

insert into public.classes (title, description, duration)
select * from (values
  ('Data Analytics', 'End-to-end analytics: question → data → insight → action.', '6–8 sessions'),
  ('Tableau Dashboards', 'Design, build and publish interactive Tableau dashboards.', '5–7 sessions'),
  ('SQL & T-SQL Foundations', 'Query, join and model data confidently in SQL Server.', '5–6 sessions'),
  ('Advanced Excel for Analysts', 'Formulas, pivots and automated reporting workflows.', '4–5 sessions'),
  ('Base SAS Programming 9.4', 'Data steps, procedures and reporting with Base SAS.', '5–6 sessions'),
  ('BI Career Guidance', 'Portfolio, interviews and breaking into business intelligence.', 'Flexible')
) as seed(title, description, duration)
where not exists (select 1 from public.classes);

-- ============================================================================
-- 4) CLASS BOOKINGS  (logged-in students; evening slots; pay-to-confirm)
--    status:         requested → confirmed (by Rakshit)
--    payment_status: unpaid → paid (Rakshit marks after student pays him)
-- ============================================================================
create table if not exists public.class_bookings (
  id             uuid        primary key default gen_random_uuid(),
  user_id        uuid        not null references auth.users(id) on delete cascade,
  class_id       uuid        references public.classes(id) on delete set null,
  class_title    text        not null,
  scheduled_at   timestamptz not null,
  notes          text        not null default '',
  status         text        not null default 'requested',
  payment_status text        not null default 'unpaid',
  session_link   text        not null default '',
  created_at     timestamptz not null default now()
);
-- Add the newer columns to older installs.
alter table public.class_bookings add column if not exists payment_status text not null default 'unpaid';
alter table public.class_bookings add column if not exists session_link   text not null default '';

alter table public.class_bookings enable row level security;

drop policy if exists "student reads own bookings" on public.class_bookings;
create policy "student reads own bookings"
  on public.class_bookings for select to authenticated using (auth.uid() = user_id);

drop policy if exists "student creates own bookings" on public.class_bookings;
create policy "student creates own bookings"
  on public.class_bookings for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "student updates own bookings" on public.class_bookings;
create policy "student updates own bookings"
  on public.class_bookings for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "mentor reads all bookings" on public.class_bookings;
create policy "mentor reads all bookings"
  on public.class_bookings for select to authenticated using (public.is_mentor());

drop policy if exists "mentor updates all bookings" on public.class_bookings;
create policy "mentor updates all bookings"
  on public.class_bookings for update to authenticated
  using (public.is_mentor()) with check (public.is_mentor());

-- ============================================================================
-- 5) LEARNING ROADMAP  (day-to-day tasks; Rakshit curates; students check off)
-- ============================================================================
create table if not exists public.roadmap_tasks (
  id          uuid primary key default gen_random_uuid(),
  track       text not null,
  day         int  not null,
  title       text not null,
  description text not null default '',
  resource    text not null default '',
  created_at  timestamptz not null default now()
);
alter table public.roadmap_tasks enable row level security;

drop policy if exists "anyone reads roadmap" on public.roadmap_tasks;
create policy "anyone reads roadmap"
  on public.roadmap_tasks for select to anon, authenticated using (true);

drop policy if exists "mentor inserts roadmap" on public.roadmap_tasks;
create policy "mentor inserts roadmap"
  on public.roadmap_tasks for insert to authenticated with check (public.is_mentor());

drop policy if exists "mentor updates roadmap" on public.roadmap_tasks;
create policy "mentor updates roadmap"
  on public.roadmap_tasks for update to authenticated
  using (public.is_mentor()) with check (public.is_mentor());

drop policy if exists "mentor deletes roadmap" on public.roadmap_tasks;
create policy "mentor deletes roadmap"
  on public.roadmap_tasks for delete to authenticated using (public.is_mentor());

insert into public.roadmap_tasks (track, day, title, description)
select * from (values
  ('Data Analytics', 1, 'Analytics foundations', 'The workflow: question → data → insight → action.'),
  ('Data Analytics', 2, 'Excel essentials', 'Formulas, lookups and PivotTables on a real dataset.'),
  ('Data Analytics', 3, 'SQL basics', 'SELECT, WHERE, GROUP BY and JOINs to pull the data you need.'),
  ('Data Analytics', 4, 'Data cleaning', 'Handle nulls, duplicates and types; shape data for analysis.'),
  ('Data Analytics', 5, 'Your first Tableau dashboard', 'Build and publish an interactive dashboard.'),
  ('Data Analytics', 6, 'KPIs & storytelling', 'Choose the right metrics and present a clear data story.'),
  ('Data Analytics', 7, 'Capstone project', 'Deliver an end-to-end analysis for your portfolio.')
) as seed(track, day, title, description)
where not exists (select 1 from public.roadmap_tasks);

-- ============================================================================
-- 6) ROADMAP PROGRESS  (per-student checkmarks)
-- ============================================================================
create table if not exists public.task_progress (
  user_id    uuid not null references auth.users(id) on delete cascade,
  task_id    uuid not null references public.roadmap_tasks(id) on delete cascade,
  completed  boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (user_id, task_id)
);
alter table public.task_progress enable row level security;

drop policy if exists "student reads own progress" on public.task_progress;
create policy "student reads own progress"
  on public.task_progress for select to authenticated using (auth.uid() = user_id);

drop policy if exists "student inserts own progress" on public.task_progress;
create policy "student inserts own progress"
  on public.task_progress for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "student updates own progress" on public.task_progress;
create policy "student updates own progress"
  on public.task_progress for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "student deletes own progress" on public.task_progress;
create policy "student deletes own progress"
  on public.task_progress for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "mentor reads all progress" on public.task_progress;
create policy "mentor reads all progress"
  on public.task_progress for select to authenticated using (public.is_mentor());

-- ============================================================================
-- 7) SITE SETTINGS  (single row) — Rakshit's UPI ID + QR for payments
-- ============================================================================
create table if not exists public.settings (
  id         int primary key default 1,
  upi_id     text not null default '',
  upi_qr_url text not null default '',
  updated_at timestamptz not null default now(),
  constraint settings_singleton check (id = 1)
);
insert into public.settings (id) values (1) on conflict (id) do nothing;

alter table public.settings enable row level security;

drop policy if exists "anyone reads settings" on public.settings;
create policy "anyone reads settings"
  on public.settings for select to anon, authenticated using (true);

drop policy if exists "mentor updates settings" on public.settings;
create policy "mentor updates settings"
  on public.settings for update to authenticated
  using (public.is_mentor()) with check (public.is_mentor());

-- Storage bucket for the UPI QR image (public read). Create it if missing.
insert into storage.buckets (id, name, public)
values ('payment', 'payment', true)
on conflict (id) do nothing;

drop policy if exists "public read payment bucket" on storage.objects;
create policy "public read payment bucket"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'payment');

drop policy if exists "mentor uploads payment bucket" on storage.objects;
create policy "mentor uploads payment bucket"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'payment' and public.is_mentor());

drop policy if exists "mentor updates payment bucket" on storage.objects;
create policy "mentor updates payment bucket"
  on storage.objects for update to authenticated
  using (bucket_id = 'payment' and public.is_mentor());

-- ============================================================================
--  DONE. You should see "Success. No rows returned."
--  Everything now works: student signup/login, booking, roadmap, and
--  Rakshit's admin dashboard (approve payment, confirm, manage courses/roadmap).
-- ============================================================================
