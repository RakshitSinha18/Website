import type { Metadata } from "next"

// Password-reset flow — never index.
export const metadata: Metadata = {
  title: "Reset password",
  description: "Choose a new password for your account.",
  robots: { index: false, follow: false },
}

export default function ResetLayout({ children }: { children: React.ReactNode }) {
  return children
}
