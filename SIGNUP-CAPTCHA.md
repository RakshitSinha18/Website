# Signup captcha (bot protection)

The signup form **renders a Cloudflare Turnstile widget** and passes its `captchaToken` to
Supabase. The widget only appears once `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is set — until then
signup works without it. To turn it on you just need the provider keys (below); no code changes.

Supabase Auth also supports hCaptcha, but this site is wired specifically for Turnstile.

## 1. Enable in Supabase

Dashboard → **Authentication → Settings → Bot & Abuse Protection** (or **Attack Protection**):
- Turn on **Enable Captcha protection**.
- Choose provider (Turnstile recommended — free, privacy-friendly).
- Paste the provider's **secret key**.

## 2. Get provider keys

- **Cloudflare Turnstile:** dash.cloudflare.com → Turnstile → add site `sinharakshit.com` →
  copy the **site key** (public) and **secret key**.
- **hCaptcha:** hcaptcha.com → get site key + secret.

## 3. Publish the site key

The widget code is **already in `app/login/page.tsx`** (`@marsidev/react-turnstile`, gated on
`TURNSTILE_SITE_KEY`). You only need to publish the **public site key** so the build picks it up:

- **GitHub Actions:** add repo secret `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (Settings → Secrets and
  variables → Actions). It's already referenced in `.github/workflows/deploy.yml`.
- **Local dev (optional):** add `NEXT_PUBLIC_TURNSTILE_SITE_KEY=...` to `.env.local`.

The CSP in `app/layout.tsx` already allows `https://challenges.cloudflare.com` in `script-src`
and `frame-src`, so no CSP change is needed.

## Current state

- **Site key unset (now):** no widget renders, signup works without a token.
- **Site key set + Supabase enforcement on:** the widget appears on signup, submission is
  blocked until it's solved, and Supabase rejects any signup without a valid token.

Set the site key and the Supabase **secret key** together, then flip enforcement on — otherwise
enforcement is on with no widget (signups blocked) or a widget with no enforcement (no effect).
The client resets the single-use token automatically after a failed attempt.
