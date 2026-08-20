// Supabase Edge Function: verify a Razorpay Standard Checkout signature.
//
// Razorpay's interactive checkout `handler` returns razorpay_order_id,
// razorpay_payment_id and razorpay_signature to the browser. This endpoint
// verifies HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET) and, only on a
// match, marks the payment paid and the booking confirmed (via the service-role
// key — the browser cannot do this itself).
//
//   supabase functions deploy verify-payment
//   supabase secrets set RAZORPAY_KEY_SECRET=...   (already set for create-payment)
//
// This complements payment-webhook (server-to-server). Either path confirms a
// payment; both are idempotent so a double-confirm is a no-op.

// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!)

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors })

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json()

    // Missing fields → 400.
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return json({ error: "Missing payment fields." }, 400)
    }

    const secret = Deno.env.get("RAZORPAY_KEY_SECRET")
    if (!secret) return json({ error: "Razorpay not configured." }, 500)

    // HMAC-SHA256(order_id | payment_id).
    const expected = await hmacHex(`${razorpay_order_id}|${razorpay_payment_id}`, secret)
    if (!timingSafeEqual(expected, razorpay_signature)) {
      // Signature mismatch → 400, do NOT mark as paid.
      return json({ verified: false, error: "Signature verification failed." }, 400)
    }

    // Verified — reconcile by the Razorpay order id we stored on the payment row.
    const { data: pay } = await admin
      .from("payments")
      .select("id, booking_id, status")
      .eq("provider", "razorpay")
      .eq("provider_ref", razorpay_order_id)
      .single()

    if (pay && pay.status !== "paid") {
      await admin
        .from("payments")
        .update({ status: "paid", updated_at: new Date().toISOString() })
        .eq("id", pay.id)
      if (pay.booking_id) {
        const { data: booking } = await admin
          .from("class_bookings")
          .update({ status: "confirmed", payment_status: "paid" })
          .eq("id", pay.booking_id)
          .select("class_title, scheduled_at, session_link, user_id")
          .single()

        // Notify both the student (confirmation) and the admin (new paid booking).
        if (booking) await notifyPaid(booking)
      }
    }

    return json({ verified: true })
  } catch (err) {
    return json({ error: String(err) }, 500)
  }
})

// Email the student a confirmation and the admin a "new paid booking" alert.
// Best-effort: never let a notification failure break payment verification.
async function notifyPaid(booking: any) {
  try {
    const notifyUrl = Deno.env.get("NOTIFY_URL") ??
      `${Deno.env.get("SUPABASE_URL")}/functions/v1/notify`

    // Look up the student's email + name from auth + profiles.
    let studentEmail = ""
    let studentName = ""
    if (booking.user_id) {
      const { data: u } = await admin.auth.admin.getUserById(booking.user_id)
      studentEmail = u?.user?.email ?? ""
      const { data: prof } = await admin
        .from("profiles").select("full_name").eq("id", booking.user_id).single()
      studentName = prof?.full_name ?? ""
    }

    const when = booking.scheduled_at
      ? new Date(booking.scheduled_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
      : "the scheduled time"

    // 1) Student confirmation (with session link if present).
    if (studentEmail) {
      await fetch(notifyUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "approve",
          student_email: studentEmail,
          student_name: studentName,
          class_title: booking.class_title,
          scheduled_at: when,
          session_link: booking.session_link || "",
        }),
      })
    }

    // 2) Admin alert about the paid booking.
    await fetch(notifyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        table: "class_bookings",
        record: {
          name: studentName || studentEmail,
          email: studentEmail,
          class_title: `${booking.class_title} (PAID ✅)`,
          scheduled_at: when,
          notes: "Payment received — booking auto-confirmed.",
        },
      }),
    })
  } catch (_e) {
    /* best-effort */
  }
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  })
}

async function hmacHex(message: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  )
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message))
  return [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, "0")).join("")
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false
  let out = 0
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return out === 0
}
