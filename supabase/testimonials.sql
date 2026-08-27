-- ============================================================================
--  TESTIMONIALS (student feedback → mentor approval → homepage social proof)
--  Run in Supabase → SQL Editor. Idempotent.
--
--  • Students write ONE testimonial each from the portal (rating + text).
--  • Nothing is public until Rakshit approves it (approved = false default).
--  • The homepage reads only approved rows — so social proof is always real.
-- ============================================================================

create table if not exists public.testimonials (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null unique references auth.users(id) on delete cascade,
  author_name  text not null default '',
  author_role  text not null default '',   -- e.g. "Data Analyst" — optional
  body         text not null,
  rating       int check (rating between 1 and 5),
  approved     boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
alter table public.testimonials enable row level security;

-- Public homepage reads only approved testimonials.
drop policy if exists "anyone reads approved testimonials" on public.testimonials;
create policy "anyone reads approved testimonials"
  on public.testimonials for select to anon, authenticated using (approved = true);

-- Authors see their own (pending or not); mentor sees all.
drop policy if exists "authors read own testimonial" on public.testimonials;
create policy "authors read own testimonial"
  on public.testimonials for select to authenticated
  using (auth.uid() = user_id or public.is_mentor());

drop policy if exists "students write own testimonial" on public.testimonials;
create policy "students write own testimonial"
  on public.testimonials for insert to authenticated with check (auth.uid() = user_id);

-- Authors may edit their text; any student edit un-approves it so changed
-- copy never goes live without Rakshit re-approving (see trigger below).
drop policy if exists "authors or mentor update testimonials" on public.testimonials;
create policy "authors or mentor update testimonials"
  on public.testimonials for update to authenticated
  using (auth.uid() = user_id or public.is_mentor())
  with check (auth.uid() = user_id or public.is_mentor());

drop policy if exists "authors or mentor delete testimonials" on public.testimonials;
create policy "authors or mentor delete testimonials"
  on public.testimonials for delete to authenticated
  using (auth.uid() = user_id or public.is_mentor());

-- Guard: only the mentor can set approved = true. A student INSERT/UPDATE
-- always lands as approved = false, and edits to an approved row unapprove it.
create or replace function public.testimonials_guard()
returns trigger language plpgsql security definer as $$
begin
  if not public.is_mentor() then
    new.approved := false;
  end if;
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists testimonials_guard on public.testimonials;
create trigger testimonials_guard
  before insert or update on public.testimonials
  for each row execute function public.testimonials_guard();
