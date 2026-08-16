# Signup captcha (bot protection)

The signup form is wired to pass a `captchaToken` to Supabase — it just needs a captcha
provider enabled. Supabase Auth supports **hCaptcha** and **Cloudflare Turnstile**.

## 1. Enable in Supabase

Dashboard → **Authentication → Settings → Bot & Abuse Protection** (or **Attack Protection**):
- Turn on **Enable Captcha protection**.
- Choose provider (Turnstile recommended — free, privacy-friendly).
- Paste the provider's **secret key**.

## 2. Get provider keys

- **Cloudflare Turnstile:** dash.cloudflare.com → Turnstile → add site `sinharakshit.com` →
  copy the **site key** (public) and **secret key**.
- **hCaptcha:** hcaptcha.com → get site key + secret.

## 3. Add the widget to the login page

Install the widget and render it in `app/login/page.tsx`, then feed the token to the existing
`captchaToken` state (already passed into `supabase.auth.signUp`).

Turnstile (React):
```bash
npm install @marsidev/react-turnstile
```
```tsx
import { Turnstile } from "@marsidev/react-turnstile"
// in the signup form:
<Turnstile siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!} onSuccess={setCaptchaToken} />
```
Change `const [captchaToken] = useState("")` to `const [captchaToken, setCaptchaToken] = useState("")`.

Add `NEXT_PUBLIC_TURNSTILE_SITE_KEY` to `.env.local` + GitHub Actions secrets.

## Current state

Until the above is done, signup works without captcha (the token is simply omitted). Once
Supabase captcha is **enforced**, signups without a token will be rejected — so add the widget
at the same time you enable enforcement.
