// Supabase Edge Function: session reminder emails.
//
// Triggered hourly by pg_cron (see supabase/reminders.sql). Finds confirmed
// bookings starting within the next 24 hours that haven't been reminded yet,
// emails the student via Resend, and stamps reminded_at so each booking is
// reminded exactly once. Respects the portal Settings toggle
// (profiles.email_reminders) and skips students who marked can't-attend.
//
// SECURITY: deployed with verify_jwt=false so pg_net can reach it; the caller
// must present X-Reminders-Secret matching the REMINDERS_SECRET env (or the
// service-role key as Bearer). The secret only allows triggering an idempotent
// run — it is deliberately not the service-role key.
//
// Deploy:
//   supabase functions deploy reminders
//   supabase secrets set REMINDERS_SECRET=<random hex>
// (RESEND_API_KEY / FROM_EMAIL are already project secrets for notify.)

// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!)

function esc(v: unknown, max = 300): string {
  return String(v ?? "")
    .slice(0, max)
    .replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
    )
}

Deno.serve(async (req: Request) => {
  const secret = Deno.env.get("REMINDERS_SECRET") ?? ""
  const bearer = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "")
  const okSecret = secret && req.headers.get("X-Reminders-Secret") === secret
  const okService = bearer && bearer === Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  if (!okSecret && !okService) return json({ error: "Not authorized" }, 401)

  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")
  const FROM_EMAIL = Deno.env.get("FROM_EMAIL") ?? "Rakshit Sinha <no-reply@sinharakshit.com>"
  if (!RESEND_API_KEY) return json({ error: "RESEND_API_KEY not set" }, 500)

  try {
    const now = new Date()
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000)

    // Confirmed, upcoming (next 24h), not yet reminded, not opted out.
    const { data: bookings, error } = await admin
      .from("class_bookings")
      .select("id, user_id, class_title, scheduled_at, meet_link, session_link, attendance")
      .eq("status", "confirmed")
      .is("reminded_at", null)
      .gte("scheduled_at", now.toISOString())
      .lte("scheduled_at", in24h.toISOString())
    if (error) throw error

    let sent = 0
    let skipped = 0
    for (const b of bookings ?? []) {
      if (b.attendance === "opted_out") {
        skipped++
        await stamp(b.id)
        continue
      }
      const { data: prof } = await admin
        .from("profiles")
        .select("email, full_name, email_reminders")
        .eq("id", b.user_id)
        .single()
      // Toggle off, or no email on file → mark processed, send nothing.
      if (!prof?.email || prof.email_reminders === false) {
        skipped++
        await stamp(b.id)
        continue
      }

      const when = new Date(b.scheduled_at).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        weekday: "long",
        day: "numeric",
        month: "long",
        hour: "numeric",
        minute: "2-digit",
      })
      const link = b.meet_link || b.session_link || "https://sinharakshit.com/portal/"
      const safeLink = /^https?:\/\//i.test(link) ? esc(link) : "https://sinharakshit.com/portal/"

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: prof.email,
          subject: `Reminder: ${String(b.class_title ?? "your session").slice(0, 150)} — ${when} IST`,
          html: `<p>Hi ${esc(prof.full_name) || "there"},</p>
            <p>A quick reminder — your session <strong>${esc(b.class_title)}</strong> is coming up on
            <strong>${esc(when)} (IST)</strong>.</p>
            <p>Join here: <a href="${safeLink}">${safeLink}</a></p>
            <p>Can't make it? Reschedule anytime from your <a href="https://sinharakshit.com/portal/">portal</a>.</p>
            <p>— Rakshit Sinha</p>`,
        }),
      })
      if (res.ok) {
        sent++
        await stamp(b.id)
      }
      // On Resend failure: leave reminded_at null so the next hourly run retries.
    }

    return json({ ok: true, sent, skipped, window_end: in24h.toISOString() })
  } catch (err) {
    return json({ error: String(err) }, 500)
  }
})

async function stamp(bookingId: string) {
  await admin.from("class_bookings").update({ reminded_at: new Date().toISOString() }).eq("id", bookingId)
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}
