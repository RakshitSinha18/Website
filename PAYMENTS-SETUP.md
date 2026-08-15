# Payments setup (Stripe + Razorpay)

Server-side logic runs as **Supabase Edge Functions** (your static site can't hold secret keys
or receive webhooks). Two functions:

- `create-payment` — starts a Stripe Checkout session or Razorpay order.
- `payment-webhook` — verifies the provider signature, then (via the service-role key) marks the
  payment paid and the booking confirmed, and triggers the receipt email.

## 1. Apply the schema

Run `supabase/payments-materials.sql` in Supabase → SQL Editor.

## 2. Deploy the functions

```bash
supabase functions deploy create-payment
supabase functions deploy payment-webhook --no-verify-jwt
```

## 3. Set secrets

```bash
supabase secrets set \
  STRIPE_SECRET_KEY=sk_live_... \
  STRIPE_WEBHOOK_SECRET=whsec_... \
  RAZORPAY_KEY_ID=rzp_live_... \
  RAZORPAY_KEY_SECRET=... \
  RAZORPAY_WEBHOOK_SECRET=... \
  SITE_URL=https://sinharakshit.com \
  NOTIFY_URL=https://<project-ref>.functions.supabase.co/notify
```
`SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are provided to Edge
Functions automatically.

## 4. Configure webhooks in each dashboard

- **Stripe** → Developers → Webhooks → add endpoint
  `https://<ref>.functions.supabase.co/payment-webhook`, event `checkout.session.completed`.
- **Razorpay** → Settings → Webhooks → same URL, events `payment.captured` and `order.paid`.

## 5. Frontend env (public keys only)

Add to GitHub Actions secrets + `.env.local`:
```
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_...   # public key id, safe in browser
```
(Stripe redirect uses the Checkout URL returned by the function — no public key needed.)

## Security notes (already implemented)

- Secret keys live only in Edge Function secrets — never in the client bundle.
- Students can insert only a `status = 'created'` payment row (RLS); they have **no UPDATE**
  policy, so "paid" can only be set by the signature-verified webhook using the service-role key.
- The webhook is **idempotent** (ignores already-paid rows) and uses timing-safe signature
  comparison for both providers.
