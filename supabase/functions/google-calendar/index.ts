// Supabase Edge Function: create a Google Calendar event with a Meet link.
//
// Called (e.g. from verify-payment on confirmation, or manually from admin) with:
//   { booking_id, title, description, start_iso, end_iso, attendee_email }
// It uses the mentor's stored Google refresh token to mint an access token,
// creates a Calendar event with conferenceData (Google Meet), and writes the
// meet_link + google_event_id back onto the booking.
//
// Secrets required:
//   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET  (from the Google Cloud OAuth client)
//   GOOGLE_REFRESH_TOKEN                    (mentor's offline refresh token)
// SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are provided automatically.
//
// Deploy: supabase functions deploy google-calendar

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
    // Service-role callers only (verify-payment). The platform's JWT check
    // accepts the public anon key, so without this anyone could create events
    // on the mentor's real calendar and overwrite meet_link on bookings.
    const callerToken = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "")
    if (!callerToken || callerToken !== Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")) {
      return json({ error: "Not authorized" }, 401)
    }

    const { booking_id, title, description, start_iso, end_iso, attendee_email } = await req.json()
    if (!start_iso || !end_iso) return json({ error: "start_iso and end_iso are required." }, 400)

    // Prefer a secret; fall back to the stored integration row.
    let refreshToken = Deno.env.get("GOOGLE_REFRESH_TOKEN") ?? ""
    if (!refreshToken) {
      const { data } = await admin.from("google_integration").select("refresh_token").eq("id", 1).single()
      refreshToken = data?.refresh_token ?? ""
    }
    const clientId = Deno.env.get("GOOGLE_CLIENT_ID")
    const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET")
    if (!refreshToken || !clientId || !clientSecret) {
      return json({ error: "Google Calendar is not connected yet." }, 500)
    }

    // 1) Exchange the refresh token for an access token.
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    })
    const token = await tokenRes.json()
    if (!tokenRes.ok) return json({ error: `Google auth failed: ${token.error_description ?? token.error}` }, 502)

    // 2) Create the event with a Meet conference.
    const eventRes = await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1&sendUpdates=all",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          summary: title || "Mentoring session — Rakshit Sinha",
          description: description || "",
          start: { dateTime: start_iso, timeZone: "Asia/Kolkata" },
          end: { dateTime: end_iso, timeZone: "Asia/Kolkata" },
          attendees: attendee_email ? [{ email: attendee_email }] : [],
          conferenceData: {
            createRequest: { requestId: crypto.randomUUID(), conferenceSolutionKey: { type: "hangoutsMeet" } },
          },
        }),
      },
    )
    const event = await eventRes.json()
    if (!eventRes.ok) return json({ error: `Calendar error: ${event.error?.message ?? "unknown"}` }, 502)

    const meetLink = event.hangoutLink ||
      event.conferenceData?.entryPoints?.find((e: any) => e.entryPointType === "video")?.uri || ""

    // 3) Save back to the booking.
    if (booking_id) {
      await admin.from("class_bookings")
        .update({ meet_link: meetLink, google_event_id: event.id, session_link: meetLink })
        .eq("id", booking_id)
    }

    return json({ ok: true, meet_link: meetLink, event_id: event.id })
  } catch (err) {
    return json({ error: String(err) }, 500)
  }
})

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...cors, "Content-Type": "application/json" } })
}
