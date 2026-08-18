-- ============================================================================
-- MENTOR / ADMIN policies for Rakshit — RUN THIS AFTER schema.sql
-- Lets Rakshit (identified by email) read everything AND edit the class
-- catalog and learning roadmap from the admin dashboard, over time.
-- Safe to re-run.
-- ============================================================================

-- Who counts as the mentor/admin. Rakshit uses two accounts — both are admin.
-- (Keep in sync with supabase/admin-emails.sql and lib/config.ts → ADMIN_EMAILS.)
create or replace function public.is_mentor()
returns boolean language sql stable as $$
  select coalesce(
    lower(auth.jwt() ->> 'email') in ('rsinha1369@gmail.com', 'sinharakshit1988@gmail.com'),
    false
  );
$$;

-- --- Read everything the mentor needs ---------------------------------------
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

drop policy if exists "mentor updates session requests" on public.session_bookings;
create policy "mentor updates session requests"
  on public.session_bookings for update to authenticated
  using (public.is_mentor()) with check (public.is_mentor());

drop policy if exists "mentor reads all profiles" on public.profiles;
create policy "mentor reads all profiles"
  on public.profiles for select to authenticated
  using (public.is_mentor());

-- --- Let the mentor EDIT the class catalog over time ------------------------
drop policy if exists "mentor inserts classes" on public.classes;
create policy "mentor inserts classes"
  on public.classes for insert to authenticated
  with check (public.is_mentor());

drop policy if exists "mentor updates classes" on public.classes;
create policy "mentor updates classes"
  on public.classes for update to authenticated
  using (public.is_mentor()) with check (public.is_mentor());

drop policy if exists "mentor deletes classes" on public.classes;
create policy "mentor deletes classes"
  on public.classes for delete to authenticated
  using (public.is_mentor());

-- --- Let the mentor EDIT the learning roadmap over time ---------------------
drop policy if exists "mentor inserts roadmap" on public.roadmap_tasks;
create policy "mentor inserts roadmap"
  on public.roadmap_tasks for insert to authenticated
  with check (public.is_mentor());

drop policy if exists "mentor updates roadmap" on public.roadmap_tasks;
create policy "mentor updates roadmap"
  on public.roadmap_tasks for update to authenticated
  using (public.is_mentor()) with check (public.is_mentor());

drop policy if exists "mentor deletes roadmap" on public.roadmap_tasks;
create policy "mentor deletes roadmap"
  on public.roadmap_tasks for delete to authenticated
  using (public.is_mentor());
