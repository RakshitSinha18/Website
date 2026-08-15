import type { Metadata } from "next"

// Private dashboard — never index.
export const metadata: Metadata = {
  title: "Admin dashboard",
  description: "Manage bookings, courses, roadmap and payments.",
  robots: { index: false, follow: false },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children
}
