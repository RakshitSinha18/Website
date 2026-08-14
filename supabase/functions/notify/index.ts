// Supabase Edge Function: email notifications via Resend.
//
// Two jobs:
//  1. Fired by a Database Webhook on INSERT into session_bookings / class_bookings
//     -> emails Rakshit that a new request came in.
//  2. Called directly with { action: "approve", ... } -> emails the STUDENT an
//     approval + session link.
//
// Deploy:
//   supabase functions deploy notify --no-verify-jwt
//   supabase secrets set RESEND_API_KEY=... OWNER_EMAIL=rsinha1369@gmail.com FROM_EMAIL="Rakshit Sinha <onboarding@resend.dev>"
//
// Then in Supabase → Database → Webhooks, create a webhook on INSERT for
// session_bookings and class_bookings that POSTs to this function's URL.

// deno-lint-ignore-file no-explicit-any
Deno.serve(async (req: Request) => {
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")
  const OWNER_EMAIL = Deno.env.get("OWNER_EMAIL") ?? "rsinha1369@gmail.com"
  const FROM_EMAIL = Deno.env.get("FROM_EMAIL") ?? "Rakshit Sinha <onboarding@resend.dev>"

  if (!RESEND_API_KEY) {
    return json({ error: "RESEND_API_KEY not set" }, 500)
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
    if (body.action === "approve") {
      const { student_email, student_name, class_title, scheduled_at, session_link } = body
      await send(
        student_email,
        `Your session is confirmed: ${class_title}`,
        `<p>Hi ${student_name ?? "there"},</p>
         <p>Your mentoring session <strong>${class_title}</strong> is confirmed for
         <strong>${scheduled_at ?? "the requested time"}</strong>.</p>
         <p>Join here: <a href="${session_link}">${session_link}</a></p>
         <p>— Rakshit Sinha</p>`,
      )
      return json({ ok: true, sent: "student" })
    }

    // --- Webhook flow: a new booking/registration was inserted ---
    // Supabase DB webhooks send { type, table, record, ... }
    const record = body.record ?? body
    const table = body.table ?? "booking"
    const who = record?.name || record?.email || "A new student"
    const detail =
      record?.class_title
        ? `Class: ${record.class_title} @ ${record.scheduled_at ?? "TBD"}`
        : record?.topic
          ? `Topic: ${record.topic}`
          : ""

    await send(
      OWNER_EMAIL,
      `New ${table === "class_bookings" ? "class booking" : "session request"} — ${who}`,
      `<p>You have a new ${table === "class_bookings" ? "class booking" : "session request"}.</p>
       <ul>
         <li><strong>Name:</strong> ${record?.name ?? "—"}</li>
         <li><strong>Email:</strong> ${record?.email ?? "—"}</li>
         <li>${detail}</li>
         <li><strong>Notes:</strong> ${record?.message ?? record?.notes ?? "—"}</li>
       </ul>
       <p>Review it in your Supabase dashboard.</p>`,
    )
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
