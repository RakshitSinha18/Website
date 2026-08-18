// The email(s) treated as the site owner / mentor (Rakshit).
// Anyone logging in with one of these sees the admin dashboard at /admin;
// everyone else is a student and sees /portal.
//
// Rakshit uses more than one Google account, so this is a LIST. Override at
// build time with NEXT_PUBLIC_ADMIN_EMAIL (comma-separated for multiple).
// NOTE: the server-side source of truth is the RLS is_mentor() function in
// supabase/*.sql — keep this list in sync with those emails.
const DEFAULT_ADMIN_EMAILS = ["rsinha1369@gmail.com", "sinharakshit1988@gmail.com"]

export const ADMIN_EMAILS = (
  process.env.NEXT_PUBLIC_ADMIN_EMAIL
    ? process.env.NEXT_PUBLIC_ADMIN_EMAIL.split(",")
    : DEFAULT_ADMIN_EMAILS
).map((e) => e.trim().toLowerCase()).filter(Boolean)

// Primary admin email (first in the list) — used where a single address is needed.
export const ADMIN_EMAIL = ADMIN_EMAILS[0]

export function isAdminEmail(email?: string | null) {
  return Boolean(email && ADMIN_EMAILS.includes(email.toLowerCase()))
}
