-- ============================================================================
--  ARTICLES + COMMENTS + IDEAS (discussion)
--  Run in Supabase → SQL Editor. Idempotent.
--
--  • articles     : blog-style posts Rakshit writes (public reads published).
--  • comments     : reusable — attach to an article, a batch, or an idea via a
--                   (target_type, target_id) pair. Students post; mentor moderates.
--  • ideas        : the 'ideas / open discussion' board — logged-in students only.
-- ============================================================================

-- 1) ARTICLES ----------------------------------------------------------------
create table if not exists public.articles (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,
  title        text not null,
  excerpt      text not null default '',
  body         text not null default '',      -- markdown/plain
  cover_url    text,
  published    boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
alter table public.articles enable row level security;

drop policy if exists "anyone reads published articles" on public.articles;
create policy "anyone reads published articles"
  on public.articles for select to anon, authenticated using (published = true);

drop policy if exists "mentor reads all articles" on public.articles;
create policy "mentor reads all articles"
  on public.articles for select to authenticated using (public.is_mentor());

drop policy if exists "mentor writes articles" on public.articles;
create policy "mentor writes articles"
  on public.articles for all to authenticated
  using (public.is_mentor()) with check (public.is_mentor());

-- 2) IDEAS (discussion board) — logged-in students only --------------------
create table if not exists public.ideas (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  author_name text not null default '',
  title       text not null,
  body        text not null default '',
  status      text not null default 'open',   -- open | answered | closed
  created_at  timestamptz not null default now()
);
alter table public.ideas enable row level security;

drop policy if exists "authenticated read ideas" on public.ideas;
create policy "authenticated read ideas"
  on public.ideas for select to authenticated using (true);

drop policy if exists "students post ideas" on public.ideas;
create policy "students post ideas"
  on public.ideas for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "authors edit own ideas" on public.ideas;
create policy "authors edit own ideas"
  on public.ideas for update to authenticated
  using (auth.uid() = user_id or public.is_mentor())
  with check (auth.uid() = user_id or public.is_mentor());

drop policy if exists "authors or mentor delete ideas" on public.ideas;
create policy "authors or mentor delete ideas"
  on public.ideas for delete to authenticated
  using (auth.uid() = user_id or public.is_mentor());

-- 3) COMMENTS (reusable) -----------------------------------------------------
--    target_type in ('article','batch','idea'); target_id references that row.
create table if not exists public.comments (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  author_name  text not null default '',
  target_type  text not null check (target_type in ('article','batch','idea')),
  target_id    uuid not null,
  body         text not null,
  rating       int,                            -- optional 1–5 for feedback
  hidden       boolean not null default false, -- mentor can moderate
  created_at   timestamptz not null default now()
);
create index if not exists comments_target_idx on public.comments(target_type, target_id);
alter table public.comments enable row level security;

-- Anyone may read non-hidden comments (public articles have public discussion).
drop policy if exists "read visible comments" on public.comments;
create policy "read visible comments"
  on public.comments for select to anon, authenticated
  using (hidden = false or public.is_mentor());

drop policy if exists "students write comments" on public.comments;
create policy "students write comments"
  on public.comments for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "authors edit own comments" on public.comments;
create policy "authors edit own comments"
  on public.comments for update to authenticated
  using (auth.uid() = user_id or public.is_mentor())
  with check (auth.uid() = user_id or public.is_mentor());

drop policy if exists "authors or mentor delete comments" on public.comments;
create policy "authors or mentor delete comments"
  on public.comments for delete to authenticated
  using (auth.uid() = user_id or public.is_mentor());
