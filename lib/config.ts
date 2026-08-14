// The email that is treated as the site owner / mentor (Rakshit).
// Anyone logging in with this email sees the admin dashboard at /admin;
// everyone else is a student and sees /portal.
//
// Override at build time with NEXT_PUBLIC_ADMIN_EMAIL if needed.
export const ADMIN_EMAIL = (
  process.env.NEXT_PUBLIC_ADMIN_EMAIL || "rsinha1369@gmail.com"
).toLowerCase()

export function isAdminEmail(email?: string | null) {
  return Boolean(email && email.toLowerCase() === ADMIN_EMAIL)
}
