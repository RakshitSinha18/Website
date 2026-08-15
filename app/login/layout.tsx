import type { Metadata } from "next"

// Auth pages should never be indexed by search engines.
export const metadata: Metadata = {
  title: "Sign in",
  description:
    "Sign in or create an account to book 1-on-1 evening Business Intelligence classes with Rakshit Sinha and track your learning roadmap.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/login/" },
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
