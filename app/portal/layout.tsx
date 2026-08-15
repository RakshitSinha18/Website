import type { Metadata } from "next"

// Private student area — never index.
export const metadata: Metadata = {
  title: "Student portal",
  description: "Book evening classes and track your learning roadmap.",
  robots: { index: false, follow: false },
}

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return children
}
