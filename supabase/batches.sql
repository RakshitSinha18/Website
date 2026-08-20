-- ============================================================================
--  BATCHES  —  scheduled cohorts of a subject/class that students enroll in
--  Run in Supabase → SQL Editor. Idempotent; safe to re-run.
--
--  A "batch" is a scheduled cohort of a class (e.g. "SQL Foundations — Aug 2026"):
--  fixed start/end dates, a schedule note, a price, and an optional capacity.
--  Students enroll in a specific batch (a batch_enrollments row) and pay for it.
--  Materials (incl. transcripts) can attach to a batch as well as a class.
-- ============================================================================

-- 1) BATCHES -----------------------------------------------------------------
create table if not exists public.batches (
  id           uuid primary key default gen_random_uuid(),
  class_id     uuid references public.classes(id) on delete set null, -- the subject
  title        text        not null,               -- e.g. "SQL Foundations — Aug 2026"
  subject      text        not null default '',     -- denormalised subject label
  description  text        not null default '',
  schedule     text        not null default '',     -- e.g. "Tue & Thu, 7–8:30pm IST"
  start_date   date,
  end_date     date,
  price_paise  integer     not null default 0,      -- 0 = "on request"
  capacity     integer     not null default 0,      -- 0 = unlimited
  active       boolean     not null default true,
  created_at   timestamptz not null default now()
);

alter table public.batches enable row level security;

drop policy if exists "anyone reads active batches" on public.batches;
create policy "anyone reads active batches"
  on public.batches for select to anon, authenticated using (active = true);

drop policy if exists "mentor inserts batches" on public.batches;
create policy "mentor inserts batches"
  on public.batches for insert to authenticated with check (public.is_mentor());

drop policy if exists "mentor updates batches" on public.batches;
create policy "mentor updates batches"
  on public.batches for update to authenticated
  using (public.is_mentor()) with check (public.is_mentor());

drop policy if exists "mentor deletes batches" on public.batches;
create policy "mentor deletes batches"
  on public.batches for delete to authenticated using (public.is_mentor());

-- 2) BATCH ENROLLMENTS -------------------------------------------------------
--    A student joining a batch. status: requested → confirmed (on payment).
create table if not exists public.batch_enrollments (
  id             uuid        primary key default gen_random_uuid(),
  user_id        uuid        not null references auth.users(id) on delete cascade,
  batch_id       uuid        not null references public.batches(id) on delete cascade,
  status         text        not null default 'requested',  -- requested → confirmed
  payment_status text        not null default 'unpaid',      -- unpaid → paid
  created_at     timestamptz not null default now(),
  unique (user_id, batch_id)
);

alter table public.batch_enrollments enable row level security;

drop policy if exists "student reads own enrollments" on public.batch_enrollments;
create policy "student reads own enrollments"
  on public.batch_enrollments for select to authenticated using (auth.uid() = user_id);

drop policy if exists "student creates own enrollment" on public.batch_enrollments;
create policy "student creates own enrollment"
  on public.batch_enrollments for insert to authenticated
  with check (auth.uid() = user_id and status = 'requested');

drop policy if exists "mentor reads all enrollments" on public.batch_enrollments;
create policy "mentor reads all enrollments"
  on public.batch_enrollments for select to authenticated using (public.is_mentor());

drop policy if exists "mentor updates enrollments" on public.batch_enrollments;
create policy "mentor updates enrollments"
  on public.batch_enrollments for update to authenticated
  using (public.is_mentor()) with check (public.is_mentor());

drop policy if exists "mentor deletes enrollments" on public.batch_enrollments;
create policy "mentor deletes enrollments"
  on public.batch_enrollments for delete to authenticated using (public.is_mentor());

-- 3) MATERIALS: allow attaching to a batch (in addition to a class) ----------
--    class_materials already exists (from payments-materials.sql). Add batch_id
--    and a 'transcript' kind. A material may belong to a class, a batch, or both.
alter table public.class_materials add column if not exists batch_id uuid
  references public.batches(id) on delete cascade;

-- Students may read materials for a confirmed batch enrollment too. This adds a
-- policy alongside the existing class-based one (RLS policies are OR-combined).
drop policy if exists "students read batch materials" on public.class_materials;
create policy "students read batch materials"
  on public.class_materials for select to authenticated
  using (
    batch_id is not null and exists (
      select 1 from public.batch_enrollments e
      where e.batch_id = class_materials.batch_id
        and e.user_id = auth.uid()
        and e.status = 'confirmed'
    )
  );
