<div align="center">

# Rakshit Sinha — Mentoring & Classes Platform

**Portfolio + full booking, payments, and learning platform** for Rakshit Sinha —
Senior Business Intelligence professional at IBM and after-hours mentor.

[![Live](https://img.shields.io/badge/live-sinharakshit.com-38bdf8?style=flat)](https://sinharakshit.com)
[![Next.js](https://img.shields.io/badge/Next.js-14-000000?style=flat&logo=nextdotjs)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ECF8E?style=flat&logo=supabase&logoColor=white)](https://supabase.com)
[![License](https://img.shields.io/badge/license-Proprietary-red?style=flat)](./LICENSE)

**⚠️ Proprietary — All Rights Reserved. Not open source.** See [LICENSE](./LICENSE).

</div>

---

## Overview

A production site that combines a personal portfolio with a complete **classes &
mentoring business**: students sign up, book sessions or enroll in batches, pay
online, and access materials — while the mentor manages everything from an admin
dashboard. Built as a **static Next.js export** on GitHub Pages, with all secure
server logic running in **Supabase Edge Functions** and **Postgres (RLS)**.

**Live:** https://sinharakshit.com

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| **Framework** | Next.js 14 (App Router, `output: "export"` static site) |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS 3 · custom dark-navy + sky→amber design system |
| **Animation** | Framer Motion (reduced-motion aware) |
| **3D / visuals** | React Three Fiber · three.js · OGL (spotlight hero) |
| **Icons** | lucide-react |
| **Backend** | Supabase — Postgres, Auth, Storage, Edge Functions (Deno) |
| **Auth** | Supabase Auth — email/password (verified) + GitHub OAuth (Google planned) |
| **Payments** | Razorpay Standard Checkout (server order + signature verification + webhook) |
| **Email** | Resend (SMTP for auth + transactional notifications) |
| **Hosting / CI** | GitHub Pages via GitHub Actions |

---

## Features

### For students
- Email/password (with verification) or **GitHub** sign-in
- Browse & **book classes** into the mentor's real availability
- Enroll in **batches** (scheduled cohorts)
- **Pay online** via Razorpay (card/UPI) — booking auto-confirms on success
- **Reschedule** or **RSVP** (attending / can't make it) for sessions
- Access **materials, slides & transcripts** for confirmed sessions
- Track a **learning roadmap**, post to the **ideas/discussion board**,
  read **articles**, and leave **comments & feedback**

### For the mentor (admin)
- Dashboard for **bookings, courses, batches, articles, roadmap, availability, payments**
- Set prices, upload materials/transcripts (per course or batch)
- **Weekly availability** + holiday blocking; editable **class policy**
- **Email alerts** on new requests and paid bookings
- Moderate community content

---

## Architecture & Security

- **Static frontend** (no server) — secrets never ship to the browser.
- **Supabase Edge Functions** handle order creation, signature verification, the
  payment webhook, and email notifications.
- **Row-Level Security** on every table. Students can only ever create their own
  `requested` rows; a `paid`/`confirmed` status can only originate from the
  signature-verified webhook or the mentor (enforced by RLS + a guard trigger).
- **Content-Security-Policy** and referrer policy shipped as `<meta>` (whitelists
  Supabase + Razorpay only).

---

## Project Structure

```
app/            Next.js routes (home, portal, admin, login, articles, policy, legal)
components/     UI, sections, motion primitives, comment/ideas widgets
lib/            Supabase client, payments, config
supabase/       SQL migrations + Edge Functions (create-payment, verify-payment,
                payment-webhook, notify)
public/brand/   Brand kit — favicon, OG image, wordmark
scripts/        Secret-setup helpers (hidden-input; never commit secrets)
```

---

## Deployment

Every push to `main` triggers `.github/workflows/deploy.yml`, which builds the
static export and publishes it to GitHub Pages (custom domain `sinharakshit.com`).
Frontend env (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) is
injected from GitHub Actions secrets. Server secrets (Razorpay, Resend) live only
in Supabase Edge Function secrets.

---

## License

**Proprietary — © 2026 Rakshit Sinha. All Rights Reserved.**
This code is published for viewing only. No copying, reuse, modification, or
redistribution is permitted without written consent. See [LICENSE](./LICENSE).

Enquiries: **rsinha1369@gmail.com**
