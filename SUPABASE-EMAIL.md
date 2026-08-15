# Fixing Supabase Auth emails (password reset + email verification)

**Symptom:** New accounts stay stuck on **"Waiting for verification"**, and password-reset
emails never arrive.

**Root cause:** These emails are sent by **Supabase Auth's own email system**, *not* by the
`notify` Resend edge function (that one only emails Rakshit about bookings and emails students
about approvals — it has nothing to do with auth). Supabase's **built-in** email sender is
heavily rate-limited (a few messages/hour, shared, for testing only) and often lands in spam.
The fix is to give Supabase Auth its own SMTP — using your existing **Resend** account.

Project: `ipuwwhksolvkswsnseis` · Dashboard: https://supabase.com/dashboard/project/ipuwwhksolvkswsnseis

---

## 0. Immediate unblock (no email needed)

To let the Rakshit admin account (`rsinha1369@gmail.com`) sign in **right now**:

1. Dashboard → **Authentication → Users**.
2. On the `rsinha1369@gmail.com` row (shows "Waiting for verification"), open the `⋮` menu.
3. Click **Confirm email** (a.k.a. "Confirm user").

That clears the block immediately. Everything below makes it work for *future* users too.

---

## 1. Verify your domain in Resend

Until a domain is verified, Resend only lets you send from `onboarding@resend.dev` **to your own
address** — useless for real students. So:

1. Resend → **Domains → Add Domain** → `sinharakshit.com`.
2. Add the DNS records Resend shows you at your domain registrar (SPF + DKIM, e.g.):
   - `TXT`  `send.sinharakshit.com`  → SPF value from Resend
   - `TXT`/`CNAME` DKIM records from Resend
   - (optional) DMARC `TXT` at `_dmarc.sinharakshit.com`
3. Wait for **Verified** (usually minutes, up to a few hours).

## 2. Get Resend SMTP credentials

Resend → **SMTP** (or **API Keys**):

| Field    | Value                         |
| -------- | ----------------------------- |
| Host     | `smtp.resend.com`             |
| Port     | `465` (SSL) or `587` (TLS)    |
| Username | `resend`                      |
| Password | your **Resend API key** (`re_...`) |

## 3. Point Supabase Auth at Resend SMTP

Dashboard → **Project Settings → Authentication → SMTP Settings**
(older UI: **Authentication → Emails**), then:

1. Toggle **Enable Custom SMTP** on.
2. Fill in:
   - **Sender email:** `no-reply@sinharakshit.com`
   - **Sender name:** `Rakshit Sinha`
   - **Host:** `smtp.resend.com`
   - **Port:** `465`
   - **Username:** `resend`
   - **Password:** your Resend API key
3. **Save**, then use **Send test email** to your own inbox. It must arrive (check spam once).

## 4. Allow-list the redirect URLs

The app sends password-reset links back to `/reset/` (see `app/login/page.tsx` →
`redirectTo: ${window.location.origin}/reset/`). Supabase rejects redirects that aren't
allow-listed.

Dashboard → **Authentication → URL Configuration**:

- **Site URL:** `https://sinharakshit.com`
- **Redirect URLs** (add each):
  - `https://sinharakshit.com/**`
  - `https://sinharakshit.com/reset/`
  - `http://localhost:3000/**` (and whatever port `npm run dev` prints, e.g. `3002`)

## 5. Confirm the email-confirmation toggle

Dashboard → **Authentication → Providers → Email**:

- **Confirm email:** ON  → new signups must verify (a verification email is sent).
  If you'd rather skip verification entirely, turn this OFF and users are active immediately
  (less secure, but no email needed).

## 6. (Optional) brand the email templates

Dashboard → **Authentication → Email Templates** → customize **Confirm signup** and
**Reset password**. Keep the `{{ .ConfirmationURL }}` token intact.

---

## Verify it works

1. In the app, go to `/login`, click **Forgot password?**, enter an address → email should arrive.
2. Sign up a fresh test account → verification email should arrive; clicking it confirms the user.
3. Check **Authentication → Users**: the new user should flip from "Waiting for verification"
   to confirmed.

## Notes

- The `notify` edge function still needs its own secrets to email booking alerts:
  `supabase secrets set RESEND_API_KEY=... OWNER_EMAIL=rsinha1369@gmail.com FROM_EMAIL="Rakshit Sinha <no-reply@sinharakshit.com>"`
  — but that is **separate** from the auth-email SMTP configured above.
- Admin account is `rsinha1369@gmail.com` (`lib/config.ts` → `ADMIN_EMAIL`). That's the account
  that must be confirmed for the `/admin` dashboard to be reachable.
