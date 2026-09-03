// Supabase Edge Function: email notifications via Resend.
//
// Two jobs:
//  1. Called by the portal (with the student's JWT) or a Database Webhook on
//     INSERT into session_bookings / class_bookings -> emails Rakshit that a
//     new request came in. The recipient is ALWAYS the owner.
//  2. Called server-to-server (service-role key) with { action: "approve", ... }
//     -> emails the STUDENT an approval + session link.
//
// SECURITY: deployed with verify_jwt=false so the DB webhook can reach it, so
// this function does its OWN auth:
//   - "approve" (arbitrary recipient) requires the service-role key. Otherwise
//     anyone could use this as an open relay to phish from our domain.
//   - owner notifications require a signed-in user's JWT (or service role).
//     If you wire a Database Webhook, add an Authorization header with the
//     service-role key in the webhook config.
// All user-supplied strings are HTML-escaped before they reach an email body.
//
// Deploy:
//   supabase functions deploy notify --no-verify-jwt
//   supabase secrets set RESEND_API_KEY=... OWNER_EMAIL=rsinha1369@gmail.com FROM_EMAIL="Rakshit Sinha <onboarding@resend.dev>"

// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// Escape user-supplied text so it renders inert inside email HTML.
function esc(v: unknown, max = 500): string {
  return String(v ?? "")
    .slice(0, max)
    .replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
    )
}

// Only http(s) links may appear in the student email; anything else is dropped.
function safeLink(v: unknown): string {
  const s = String(v ?? "")
  return /^https?:\/\//i.test(s) ? esc(s, 300) : ""
}

// Mirror an owner alert into whichever Discord/Slack webhooks the admin has
// attached (notify_channels, mentor-managed). Best-effort: never blocks or
// fails the email path. URLs are pattern-checked so a typo'd value can't make
// us POST the alert to an arbitrary server.
async function fanOutToChannels(text: string) {
  try {
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!)
    const { data } = await admin
      .from("notify_channels")
      .select("discord_webhook_url, slack_webhook_url")
      .eq("id", 1)
      .single()
    if (!data) return
    const posts: Promise<unknown>[] = []
    const discord = data.discord_webhook_url ?? ""
    const slack = data.slack_webhook_url ?? ""
    if (/^https:\/\/(discord|discordapp)\.com\/api\/webhooks\//.test(discord)) {
      posts.push(fetch(discord, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text.slice(0, 1900) }),
      }))
    }
    if (/^https:\/\/hooks\.slack\.com\//.test(slack)) {
      posts.push(fetch(slack, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.slice(0, 1900) }),
      }))
    }
    if (posts.length) await Promise.allSettled(posts)
  } catch {
    /* channels are best-effort */
  }
}

Deno.serve(async (req: Request) => {
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")
  const OWNER_EMAIL = Deno.env.get("OWNER_EMAIL") ?? "rsinha1369@gmail.com"
  const FROM_EMAIL = Deno.env.get("FROM_EMAIL") ?? "Rakshit Sinha <onboarding@resend.dev>"

  if (!RESEND_API_KEY) {
    return json({ error: "RESEND_API_KEY not set" }, 500)
  }

  // --- Caller auth (see header comment) ---
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "")
  const isService = Boolean(token) && token === Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  let isUser = false
  if (!isService && token) {
    try {
      const supa = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!)
      const { data } = await supa.auth.getUser(token)
      isUser = Boolean(data?.user)
    } catch {
      /* treated as unauthenticated */
    }
  }
  if (!isService && !isUser) {
    return json({ error: "Not authorized" }, 401)
  }

  let body: any = {}
  try {
    body = await req.json()
  } catch {
    /* empty body is fine for some triggers */
  }

  const send = async (to: string, subject: string, html: string) => {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
    })
    if (!res.ok) throw new Error(`Resend error: ${await res.text()}`)
    return res.json()
  }

  try {
    // --- Approval flow: notify the student with a session link ---
    // Service-role only: this is the one path that emails an arbitrary address.
    if (body.action === "approve") {
      if (!isService) return json({ error: "Not authorized" }, 403)
      const { student_email, student_name, class_title, scheduled_at, session_link } = body
      const link = safeLink(session_link)
      await send(
        student_email,
        `Your session is confirmed: ${String(class_title ?? "").slice(0, 200)}`,
        `<p>Hi ${esc(student_name) || "there"},</p>
         <p>Your mentoring session <strong>${esc(class_title)}</strong> is confirmed for
         <strong>${esc(scheduled_at) || "the requested time"}</strong>.</p>
         ${link ? `<p>Join here: <a href="${link}">${link}</a></p>` : ""}
         <p>— Rakshit Sinha</p>`,
      )
      return json({ ok: true, sent: "student" })
    }

    // --- Webhook flow: a new booking/registration was inserted ---
    // Supabase DB webhooks send { type, table, record, ... }
    const record = body.record ?? body
    const table = body.table ?? "booking"
    const who = esc(record?.name || record?.email || "A new student", 200)
    const detail =
      record?.class_title
        ? `Class: ${esc(record.class_title)} @ ${esc(record.scheduled_at) || "TBD"}`
        : record?.topic
          ? `Topic: ${esc(record.topic)}`
          : ""

    await send(
      OWNER_EMAIL,
      `New ${table === "class_bookings" ? "class booking" : "session request"} — ${who}`,
      `<p>You have a new ${table === "class_bookings" ? "class booking" : "session request"}.</p>
       <ul>
         <li><strong>Name:</strong> ${esc(record?.name) || "—"}</li>
         <li><strong>Email:</strong> ${esc(record?.email) || "—"}</li>
         <li>${detail}</li>
         <li><strong>Notes:</strong> ${esc(record?.message ?? record?.notes, 1000) || "—"}</li>
       </ul>
       <p>Review it in your Supabase dashboard.</p>`,
    )

    // Same alert, as plain text, into any attached Discord/Slack channel.
    const plain = [
      `New ${table === "class_bookings" ? "class booking" : "session request"} — ${String(record?.name ?? record?.email ?? "student").slice(0, 100)}`,
      record?.email ? `Email: ${String(record.email).slice(0, 100)}` : "",
      record?.class_title
        ? `Class: ${String(record.class_title).slice(0, 150)} @ ${String(record?.scheduled_at ?? "TBD").slice(0, 50)}`
        : record?.topic
          ? `Topic: ${String(record.topic).slice(0, 150)}`
          : "",
      record?.message ?? record?.notes ? `Notes: ${String(record.message ?? record.notes).slice(0, 300)}` : "",
    ]
      .filter(Boolean)
      .join("\n")
    await fanOutToChannels(plain)

    return json({ ok: true, sent: "owner" })
  } catch (err) {
    return json({ error: String(err) }, 500)
  }
})

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}
