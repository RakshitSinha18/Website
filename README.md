# Rakshit Sinha — Portfolio & Mentoring Site

Personal site for **Rakshit Sinha** — Senior Business Intelligence professional
at **IBM** and an after-hours mentor for aspiring data professionals.

Live site: **https://RakshitSinha18.github.io/Website/**
GitHub: **https://github.com/RakshitSinha18**

Built with **Next.js 14 + TypeScript + Tailwind CSS**, exported as a fully
static site and hosted free on **GitHub Pages**. Session sign-ups are stored in
**Supabase**. The layout is **phone-optimized** (vertical scroll + hamburger menu
on mobile, horizontal "slide" experience on desktop).

Sections: **Home → Experience → Skills → About → Contact (Book a Session)**.

---

## Tech at a glance

| Area | Choice |
| --- | --- |
| Framework | Next.js 14 (static export, `output: "export"`) |
| Styling | Tailwind CSS, animated CSS gradient + floating orbs |
| Hosting | GitHub Pages (via GitHub Actions) |
| Auth & database | Supabase (Postgres, Auth, browser client + RLS) |
| Student portal | Login, class booking, learning roadmap, profile |
| Email notifications | Resend (via Supabase Edge Function) |
| Fonts | Inter (sans) + JetBrains Mono (mono) |

---

## Run locally

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # static export → ./out
```

Create `.env.local` for the booking form to work locally:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-KEY
```

---

## Booking / sign-ups (Supabase)

1. Create a free project at [supabase.com](https://supabase.com).
2. In the dashboard → **SQL Editor**, run the script in
   [`supabase/schema.sql`](supabase/schema.sql). It creates the
   `session_bookings` table and a Row Level Security policy that lets visitors
   **insert** a booking but **not read** anyone else's data.
3. Copy your **Project URL** and **anon public key**
   (Settings → API) into `.env.local` (local) and into GitHub Actions secrets
   (deploy — see below).
4. Rakshit reviews sign-ups directly in the Supabase dashboard
   (**Table Editor → session_bookings**).

The anon key is safe to expose in the browser — RLS controls what it can do.

---

## Deploy to GitHub Pages

Deployment is automated by [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml):
every push to `main` builds the static site and publishes it.

**One-time setup:**

1. On GitHub: **Settings → Pages → Build and deployment → Source = GitHub Actions**.
2. On GitHub: **Settings → Secrets and variables → Actions → New repository secret**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Push to `main`. The site goes live at
   `https://RakshitSinha18.github.io/Website/`.

> The workflow sets `NEXT_PUBLIC_BASE_PATH=/Website` so assets resolve under the
> repo sub-path. If you later use a custom domain (see below), remove that env
> line so the base path is empty.

---

## Custom domain (Hostinger)

Want `rakshitsinha.com` instead of the github.io URL? See
[`DEPLOY-HOSTINGER.md`](DEPLOY-HOSTINGER.md) for pointing a Hostinger domain at
GitHub Pages.

---

## Project structure

```
app/            # Next.js App Router (layout, page, global styles)
components/     # Cursor, grain overlay, magnetic button
  sections/     # Experience, Skills, About, Contact sections
hooks/          # useReveal (scroll animations), useMediaQuery (responsive)
lib/            # supabase client, utils
supabase/       # schema.sql (run once in Supabase)
.github/        # Pages deploy workflow
```
