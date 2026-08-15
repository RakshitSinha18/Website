# Two-Factor Authentication (2FA) — plan (not yet built)

Requested for extra account security ("banking and money"). **Note:** the app does
**not** currently process payments in-app — students pay Rakshit directly (UPI/PayPal)
and he marks bookings paid manually. So 2FA here is a **login/account-security** upgrade,
not payment security. If in-app payments are added later, revisit the whole security model.

Supabase supports **TOTP MFA** (authenticator apps like Google Authenticator / Authy).
No third-party service needed.

## Steps to implement

1. **Enable MFA** in Supabase → **Authentication → Providers / MFA** (turn on TOTP).

2. **Enrollment UI** (Settings → Account → "Enable 2FA"):
   ```ts
   const { data } = await supabase.auth.mfa.enroll({ factorType: "totp" })
   // data.totp.qr_code  -> render as <img> for the user to scan
   // data.totp.secret   -> show as manual-entry fallback
   const { data: c } = await supabase.auth.mfa.challenge({ factorId: data.id })
   await supabase.auth.mfa.verify({ factorId: data.id, challengeId: c.id, code })
   ```

3. **Login step-up** — after `signInWithPassword`, check assurance level:
   ```ts
   const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
   if (aal.nextLevel === "aal2" && aal.nextLevel !== aal.currentLevel) {
     // prompt for the 6-digit code, then mfa.challenge + mfa.verify
   }
   ```

4. **Enforce** (optional) — require aal2 for the admin dashboard route.

5. **Recovery** — show backup codes at enrollment; document account-recovery via Rakshit.

## Where it plugs in

- Enrollment: `app/portal/page.tsx` → Settings tab → Account card (the "coming soon" line).
- Login step-up: `app/login/page.tsx` `handleSubmit`, after a successful password sign-in.

## Effort

~Half a day: enrollment UI + QR, login challenge screen, and testing. Self-contained;
does not affect the booking/roadmap logic.
