-- ===========================================================================
-- Payments, class materials (PPT/notes), and Terms acceptance.
-- Run this in Supabase → SQL Editor after schema.sql / setup.sql.
--
-- Best practices applied:
--   * RLS on every table.
--   * Students see only their own rows; the mentor (is_mentor()) manages all.
--   * Payment status is written ONLY by the service role (Edge Function webhook),
--     never by the browser — so a student cannot mark themselves "paid".
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 1. Payments — one row per checkout attempt, linked to a class booking.
-- ---------------------------------------------------------------------------
create table if not exists public.payments (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid        not null references auth.users(id) on delete cascade,
  booking_id     uuid        references public.class_bookings(id) on delete set null,
  provider       text        not null check (provider in ('stripe', 'razorpay')),
  provider_ref   text,                       -- Stripe session id / Razorpay order id
  amount         integer     not null,       -- smallest unit (paise / cents)
  currency       text        not null default 'INR',
  status         text        not null default 'created'
                   check (status in ('created', 'paid', 'failed', 'refunded')),
  receipt_url    text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- Ensure the bookings table has the column the webhook writes (safe if present).
alter table public.class_bookings add column if not exists payment_status text not null default 'unpaid';

create index if not exists payments_user_idx on public.payments(user_id);
create unique index if not exists payments_provider_ref_idx
  on public.payments(provider, provider_ref) where provider_ref is not null;

alter table public.payments enable row level security;

-- Students may read their own payments and create a "created" row (checkout start).
drop policy if exists "students read own payments" on public.payments;
create policy "students read own payments"
  on public.payments for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "students start own payment" on public.payments;
create policy "students start own payment"
  on public.payments for insert to authenticated
  with check (auth.uid() = user_id and status = 'created');

-- NOTE: no UPDATE policy for students — status transitions to 'paid' happen
-- only via the Edge Function using the service-role key (bypasses RLS). This is
-- the security boundary that prevents self-confirmation.

drop policy if exists "mentor reads all payments" on public.payments;
create policy "mentor reads all payments"
  on public.payments for select to authenticated
  using (public.is_mentor());

-- ---------------------------------------------------------------------------
-- 2. Class materials — PPT / notes Rakshit attaches to each class.
-- ---------------------------------------------------------------------------
create table if not exists public.class_materials (
  id          uuid primary key default gen_random_uuid(),
  class_id    uuid        references public.classes(id) on delete cascade,
  title       text        not null,
  kind        text        not null default 'notes' check (kind in ('ppt', 'notes', 'file')),
  file_url    text        not null,
  created_at  timestamptz not null default now()
);

create index if not exists class_materials_class_idx on public.class_materials(class_id);

alter table public.class_materials enable row level security;

-- Any signed-in student who has a PAID booking for that class can read its materials.
drop policy if exists "paid students read materials" on public.class_materials;
create policy "paid students read materials"
  on public.class_materials for select to authenticated
  using (
    public.is_mentor()
    or exists (
      select 1
      from public.class_bookings b
      where b.class_id = class_materials.class_id
        and b.user_id = auth.uid()
        and b.status = 'confirmed'
    )
  );

-- Only the mentor can add / change / remove materials.
drop policy if exists "mentor inserts materials" on public.class_materials;
create policy "mentor inserts materials"
  on public.class_materials for insert to authenticated
  with check (public.is_mentor());

drop policy if exists "mentor updates materials" on public.class_materials;
create policy "mentor updates materials"
  on public.class_materials for update to authenticated
  using (public.is_mentor()) with check (public.is_mentor());

drop policy if exists "mentor deletes materials" on public.class_materials;
create policy "mentor deletes materials"
  on public.class_materials for delete to authenticated
  using (public.is_mentor());

-- ---------------------------------------------------------------------------
-- 3. Terms & Conditions acceptance — record consent at signup / checkout.
-- ---------------------------------------------------------------------------
create table if not exists public.terms_acceptance (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid        not null references auth.users(id) on delete cascade,
  terms_version text       not null default 'v1',
  accepted_at  timestamptz not null default now()
);

alter table public.terms_acceptance enable row level security;

drop policy if exists "users record own acceptance" on public.terms_acceptance;
create policy "users record own acceptance"
  on public.terms_acceptance for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "users read own acceptance" on public.terms_acceptance;
create policy "users read own acceptance"
  on public.terms_acceptance for select to authenticated
  using (auth.uid() = user_id or public.is_mentor());

-- ---------------------------------------------------------------------------
-- 4. Storage bucket for materials (PPT/notes). Public read is fine for course
--    files; tighten to signed URLs later if materials become sensitive.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('materials', 'materials', true)
on conflict (id) do nothing;

-- Mentor can upload to the materials bucket.
drop policy if exists "mentor uploads materials" on storage.objects;
create policy "mentor uploads materials"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'materials' and public.is_mentor());

-- ---------------------------------------------------------------------------
-- 5. Course curriculum — structure, outcomes, syllabus steps, learning path.
--    Extends the classes table so each course has editable rich detail.
--    Public read (course pages); mentor-only edit.
-- ---------------------------------------------------------------------------
-- Numeric price for checkout (smallest unit, e.g. paise). The old free-form
-- `price` text column stays for display; this one drives payment amounts.
alter table public.classes add column if not exists price_paise integer not null default 0;
alter table public.classes add column if not exists tagline    text;
alter table public.classes add column if not exists level      text;
alter table public.classes add column if not exists for_whom   text;
alter table public.classes add column if not exists summary    text;
-- JSON arrays of strings: what you'll learn, syllabus, tools, and the ordered
-- learning-path steps used to render the flow diagram.
alter table public.classes add column if not exists outcomes      jsonb not null default '[]'::jsonb;
alter table public.classes add column if not exists syllabus      jsonb not null default '[]'::jsonb;
alter table public.classes add column if not exists tools         jsonb not null default '[]'::jsonb;
alter table public.classes add column if not exists learning_path jsonb not null default '[]'::jsonb;

-- Mentor can edit the full course catalog + curriculum.
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
