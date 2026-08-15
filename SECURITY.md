# Security overview & checklist

Audit date: 2026-08-15. Overall the project is **secure by design**. This documents what's
verified, and the few actions only you can complete in the Supabase/GitHub dashboards.

## ✅ Verified in the repo

- **No secrets committed** — git history scanned; no JWTs, service-role keys, Resend keys, or
  passwords. `.env*` is gitignored; no `.env` is tracked.
- **Only public keys ship to the client** — `NEXT_PUBLIC_SUPABASE_URL` / `..._ANON_KEY` are
  publishable by design and protected by Row-Level Security (RLS). The **service-role key is
  never referenced in client code** (correct — it bypasses RLS).
- **RLS enabled on every table** in the schema (profiles, classes, class_bookings,
  session_bookings, roadmap_tasks, task_progress, settings).
- **Ownership enforced** — students can only touch their own rows (`auth.uid() = user_id`).
- **Admin gate is forgery-proof** — `public.is_mentor()` checks `auth.jwt() ->> 'email'`
  (JWT is server-signed).
- **CI secrets** are injected from GitHub Actions secrets, never echoed to logs.

## ⚠️ Action items (dashboard-only — I can't do these from code)

1. **Apply the hardened `settings` read policy.** The old policy let *anonymous* visitors read
   payment details (UPI ID, PayPal, bank). `supabase/setup.sql` now restricts reads to
   `authenticated`. **Run this in Supabase → SQL Editor:**
   ```sql
   drop policy if exists "anyone reads settings" on public.settings;
   drop policy if exists "authenticated reads settings" on public.settings;
   create policy "authenticated reads settings"
     on public.settings for select to authenticated using (true);
   ```

2. **Verify live RLS matches the schema.** In Supabase → **Database → Tables**, confirm every
   table shows **"RLS enabled."** (Tables created manually in the dashboard may have RLS off
   even though the SQL files enable it.)

3. **Confirm the admin email is consistent.** `rsinha1369@gmail.com` is hardcoded in three
   places — `lib/config.ts`, `supabase/schema.sql`, `supabase/admin-policies.sql`. If it ever
   changes, update all three or admin access breaks.

4. **Rotate keys if ever exposed.** Supabase → Project Settings → API → "Reset" the anon key;
   Resend → regenerate API key. Then update GitHub Actions secrets + Supabase secrets.

5. **2FA** — planned but not built. See [SECURITY-2FA.md](SECURITY-2FA.md).

6. **Auth email deliverability** — see [SUPABASE-EMAIL.md](SUPABASE-EMAIL.md) (custom SMTP via
   Resend). Not a vulnerability, but reset/verification emails depend on it.

## Not applicable / by design

- The `classes` and `roadmap_tasks` tables are intentionally world-readable (public course
  catalog). No sensitive data there.
- The UPI QR image lives in a **public** storage bucket by design (students need to see it).
