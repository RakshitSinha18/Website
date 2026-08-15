// Supabase Edge Function: payment webhook (Stripe + Razorpay).
//
// This is the security boundary: it VERIFIES the provider's signature, then uses
// the SERVICE-ROLE key to mark the payment paid and confirm the booking. Students
// have no UPDATE rights on payments, so paid status can only originate here.
//
//   supabase functions deploy payment-webhook --no-verify-jwt
//   supabase secrets set \
//     STRIPE_WEBHOOK_SECRET=whsec_... \
//     RAZORPAY_WEBHOOK_SECRET=... \
//     SUPABASE_SERVICE_ROLE_KEY=... (auto-available as env in Edge Functions) \
//     NOTIFY_URL=https://<ref>.functions.supabase.co/notify
//
// Configure the endpoints in each dashboard:
//   Stripe:   Developers → Webhooks → checkout.session.completed
//   Razorpay: Settings → Webhooks → payment.captured / order.paid

// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const admin = createClient(SUPABASE_URL, SERVICE_KEY)

Deno.serve(async (req: Request) => {
  const url = new URL(req.url)
  const raw = await req.text()

  try {
    let paymentId: string | null = null

    // --- Stripe ---
    const stripeSig = req.headers.get("stripe-signature")
    if (stripeSig) {
      const secret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!
      if (!(await verifyStripe(raw, stripeSig, secret))) {
        return new Response("bad signature", { status: 400 })
      }
      const event = JSON.parse(raw)
      if (event.type !== "checkout.session.completed") return ok()
      paymentId = event.data.object.metadata?.payment_id ?? null
    }

    // --- Razorpay ---
    const rzpSig = req.headers.get("x-razorpay-signature")
    if (rzpSig) {
      const secret = Deno.env.get("RAZORPAY_WEBHOOK_SECRET")!
      if (!(await verifyHmac(raw, rzpSig, secret))) {
        return new Response("bad signature", { status: 400 })
      }
      const event = JSON.parse(raw)
      const entity = event.payload?.payment?.entity ?? event.payload?.order?.entity
      paymentId = entity?.notes?.payment_id ?? null
    }

    if (!paymentId) return ok()

    // Idempotent: only act if not already paid.
    const { data: pay } = await admin
      .from("payments")
      .select("id, booking_id, user_id, status")
      .eq("id", paymentId)
      .single()
    if (!pay || pay.status === "paid") return ok()

    await admin.from("payments").update({ status: "paid", updated_at: new Date().toISOString() }).eq("id", paymentId)

    // Mark the booking paid + confirmed (this is what students cannot do).
    if (pay.booking_id) {
      await admin
        .from("class_bookings")
        .update({ status: "confirmed", payment_status: "paid" })
        .eq("id", pay.booking_id)
    }

    // Fire notification emails (receipt to student + alert to Rakshit) if wired.
    const notifyUrl = Deno.env.get("NOTIFY_URL")
    if (notifyUrl && pay.booking_id) {
      const { data: booking } = await admin
        .from("class_bookings")
        .select("class_title, scheduled_at")
        .eq("id", pay.booking_id)
        .single()
      const { data: userRow } = await admin.auth.admin.getUserById(pay.user_id)
      await fetch(notifyUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "approve",
          student_email: userRow?.user?.email,
          student_name: userRow?.user?.user_metadata?.full_name,
          class_title: booking?.class_title,
          scheduled_at: booking?.scheduled_at,
          session_link: "https://sinharakshit.com/portal/",
        }),
      }).catch(() => {})
    }

    return ok()
  } catch (err) {
    console.error(err)
    return new Response("error", { status: 500 })
  }
})

function ok() {
  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  })
}

// HMAC-SHA256 hex compare (Razorpay).
async function verifyHmac(payload: string, signature: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  )
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload))
  const hex = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, "0")).join("")
  return timingSafeEqual(hex, signature)
}

// Stripe signature: t=timestamp,v1=hmac(timestamp + "." + body).
async function verifyStripe(payload: string, header: string, secret: string) {
  const parts = Object.fromEntries(header.split(",").map((p) => p.split("=")))
  const signed = `${parts.t}.${payload}`
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  )
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signed))
  const hex = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, "0")).join("")
  return timingSafeEqual(hex, parts.v1 ?? "")
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false
  let out = 0
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return out === 0
}
