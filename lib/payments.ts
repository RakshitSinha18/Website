import { supabase } from "@/lib/supabase"

export type Provider = "stripe" | "razorpay"

export interface StartPaymentArgs {
  provider: Provider
  bookingId: string
  amount: number // smallest unit: paise (INR) / cents (USD)
  currency?: string
  title?: string
}

/**
 * Starts checkout by calling the `create-payment` Edge Function.
 *
 * - Stripe → returns a hosted Checkout URL; we redirect the browser to it.
 * - Razorpay → returns an order id + public key; the caller opens Razorpay
 *   Checkout with it (the Razorpay script is loaded on demand).
 *
 * Returns `{ ok, error? }`. On Stripe success the page navigates away.
 */
export async function startPayment(
  args: StartPaymentArgs,
): Promise<{ ok: boolean; error?: string; razorpay?: RazorpayResult }> {
  if (!supabase) return { ok: false, error: "Payments aren't configured yet." }

  const { data: sessionData } = await supabase.auth.getSession()
  const token = sessionData.session?.access_token
  if (!token) return { ok: false, error: "Please sign in again." }

  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-payment`
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      provider: args.provider,
      booking_id: args.bookingId,
      amount: args.amount,
      currency: args.currency ?? "INR",
      title: args.title,
    }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) return { ok: false, error: data.error ?? "Could not start payment." }

  if (args.provider === "stripe" && data.url) {
    window.location.href = data.url
    return { ok: true }
  }
  if (args.provider === "razorpay" && data.order_id) {
    return { ok: true, razorpay: data as RazorpayResult }
  }
  return { ok: false, error: "Unexpected payment response." }
}

export interface RazorpayResult {
  order_id: string
  key_id: string
  amount: number
  currency: string
}

/** Loads the Razorpay Checkout script once and opens the payment modal. */
export function openRazorpay(r: RazorpayResult, opts: { name: string; email?: string }) {
  const open = () => {
    // @ts-expect-error injected by the Razorpay script
    const rzp = new window.Razorpay({
      key: r.key_id,
      order_id: r.order_id,
      amount: r.amount,
      currency: r.currency,
      name: "Rakshit Sinha — Evening Classes",
      description: opts.name,
      prefill: { email: opts.email },
      theme: { color: "#0b0f19" },
    })
    rzp.open()
  }
  // @ts-expect-error runtime check
  if (window.Razorpay) return open()
  const s = document.createElement("script")
  s.src = "https://checkout.razorpay.com/v1/checkout.js"
  s.onload = open
  document.body.appendChild(s)
}
