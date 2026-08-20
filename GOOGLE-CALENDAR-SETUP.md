# Google Calendar + Meet sync — setup

The code is built and deployed (`supabase/functions/google-calendar`). It stays
dormant until you complete these one-time Google steps. When done, confirmed
bookings can auto-create a Google Calendar event **with a Google Meet link**.

## 1. Google Cloud project + Calendar API
1. Go to https://console.cloud.google.com → create/select a project.
2. **APIs & Services → Library →** enable **Google Calendar API**.

## 2. OAuth consent screen
1. **APIs & Services → OAuth consent screen → External** → fill app name, your
   email, developer email → Save.
2. **Scopes:** add `https://www.googleapis.com/auth/calendar.events`.
3. Add yourself (Rakshit's Google account) as a **Test user** (fine to stay in
   "Testing" — no Google verification needed for your own account).

## 3. OAuth client (Web)
1. **APIs & Services → Credentials → Create Credentials → OAuth client ID → Web application**.
2. **Authorized redirect URI** (for the one-time token grab), use the OAuth
   Playground: `https://developers.google.com/oauthplayground`
3. Copy the **Client ID** and **Client Secret**.

## 4. Get a REFRESH token (one-time)
Easiest via the OAuth Playground:
1. Open https://developers.google.com/oauthplayground
2. Gear icon (top right) → tick **Use your own OAuth credentials** → paste Client
   ID + Secret.
3. In "Step 1", find **Google Calendar API v3** → select
   `https://www.googleapis.com/auth/calendar.events` → **Authorize APIs** →
   sign in as Rakshit → allow.
4. "Step 2" → **Exchange authorization code for tokens** → copy the **Refresh token**.

## 5. Set the secrets (hidden — never paste in chat)
Ask the assistant to run a helper, or set directly:
```
supabase secrets set \
  GOOGLE_CLIENT_ID=... \
  GOOGLE_CLIENT_SECRET=... \
  GOOGLE_REFRESH_TOKEN=... \
  --project-ref ipuwwhksolvkswsnseis
```

## 6. Done
- Run `supabase/google-calendar.sql` (already applied) if setting up fresh.
- Confirmed bookings will get a **Meet link** saved to `class_bookings.meet_link`
  (and shown to the student). The `google-calendar` Edge Function creates the
  event via the Calendar API using your refresh token.

**Note:** Google Meet links can only be created through a Calendar event — that's
why this uses the Calendar API rather than a "Meet API".
