// Supabase Edge Function: create a payment order.
//
// Called by the student portal to start checkout. Secret keys live ONLY here as
// Supabase secrets — never in the browser.
//
//   supabase functions deploy create-payment
//   supabase secrets set \
//     STRIPE_SECRET_KEY=sk_live_... \
//     RAZORPAY_KEY_ID=rzp_live_... RAZORPAY_KEY_SECRET=... \
//     SITE_URL=https://sinharakshit.com
//
// Request body: { provider: "stripe" | "razorpay", booking_id, amount, currency, title }
//   amount is in the smallest unit (paise for INR, cents for USD).
//
// Auth: the caller's Supabase JWT is forwarded so we know which user this is and
// can record the payment row (RLS: student may insert a 'created' payment).

// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors })

  try {
    const authHeader = req.headers.get("Authorization") ?? ""
    const jwt = authHeader.replace("Bearer ", "")
    if (!jwt) return json({ error: "Not authenticated" }, 401)

    // Identify the user from their JWT (anon client + their token).
    const supaUrl = Deno.env.get("SUPABASE_URL")!
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!
    const userClient = createClient(supaUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: userData } = await userClient.auth.getUser()
    const user = userData.user
    if (!user) return json({ error: "Not authenticated" }, 401)

    const { provider, booking_id, amount, currency = "INR", title } = await req.json()
    if (!provider || !amount) return json({ error: "provider and amount are required" }, 400)

    // Record a 'created' payment row (RLS allows the student to insert this).
    const { data: payment, error: payErr } = await userClient
      .from("payments")
      .insert({ user_id: user.id, booking_id, provider, amount, currency, status: "created" })
      .select("id")
      .single()
    if (payErr) return json({ error: payErr.message }, 400)

    if (provider === "stripe") {
      const key = Deno.env.get("STRIPE_SECRET_KEY")
      if (!key) return json({ error: "Stripe not configured" }, 500)
      const site = Deno.env.get("SITE_URL") ?? "https://sinharakshit.com"
      const body = new URLSearchParams({
        mode: "payment",
        "line_items[0][price_data][currency]": currency.toLowerCase(),
        "line_items[0][price_data][product_data][name]": title ?? "Evening BI class",
        "line_items[0][price_data][unit_amount]": String(amount),
        "line_items[0][quantity]": "1",
        success_url: `${site}/portal/?paid=1`,
        cancel_url: `${site}/portal/?canceled=1`,
        client_reference_id: payment.id,
        "metadata[payment_id]": payment.id,
      })
      const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
      })
      const session = await res.json()
      if (!res.ok) return json({ error: session.error?.message ?? "Stripe error" }, 400)
      // Save the provider reference for webhook reconciliation.
      await userClient.from("payments").update({ provider_ref: session.id }).eq("id", payment.id)
      return json({ url: session.url, provider: "stripe" })
    }

    if (provider === "razorpay") {
      const id = Deno.env.get("RAZORPAY_KEY_ID")
      const secret = Deno.env.get("RAZORPAY_KEY_SECRET")
      if (!id || !secret) return json({ error: "Razorpay not configured" }, 500)
      const auth = btoa(`${id}:${secret}`)
      const res = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          currency,
          receipt: payment.id,
          notes: { payment_id: payment.id },
        }),
      })
      const order = await res.json()
      if (!res.ok) return json({ error: order.error?.description ?? "Razorpay error" }, 400)
      await userClient.from("payments").update({ provider_ref: order.id }).eq("id", payment.id)
      // The browser opens Razorpay Checkout with this order id + the public key id.
      return json({ order_id: order.id, key_id: id, amount, currency, provider: "razorpay" })
    }

    return json({ error: "Unknown provider" }, 400)
  } catch (err) {
    return json({ error: String(err) }, 500)
  }
})

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  })
}
