import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import { ToastProvider } from "@/components/toast"
import { AccessibilityButton } from "@/components/accessibility-button"
import "./globals.css"

const geist = Inter({ subsets: ["latin"], variable: "--font-geist-sans" })
const geistMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-geist-mono" })

const SITE_URL = "https://sinharakshit.com"
const DESCRIPTION =
  "Rakshit Sinha — Senior Business Intelligence consultant (IBM) with 9+ years turning data into insight with Tableau, SQL, Advanced Excel and Base SAS 9.4. After-hours mentor running evening classes in Data Analytics, Tableau, SQL and more."

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Rakshit Sinha — Senior BI Consultant & Mentor",
    template: "%s · Rakshit Sinha",
  },
  description: DESCRIPTION,
  keywords: [
    "Rakshit Sinha", "Business Intelligence", "Tableau", "SQL", "Data Analytics",
    "Base SAS", "Advanced Excel", "BI mentor", "data analytics classes", "Mumbai",
  ],
  authors: [{ name: "Rakshit Sinha" }],
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: "website",
    url: SITE_URL,
    title: "Rakshit Sinha — Senior BI Consultant & Mentor",
    description: DESCRIPTION,
    siteName: "Rakshit Sinha",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rakshit Sinha — Senior BI Consultant & Mentor",
    description: DESCRIPTION,
  },
  generator: "Next.js",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0a1220",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${geist.variable} ${geistMono.variable} font-sans antialiased`}>
        {/* Skip link for keyboard & screen-reader users (WCAG 2.4.1). */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-foreground focus:px-4 focus:py-2 focus:text-sm focus:text-background"
        >
          Skip to content
        </a>
        <ToastProvider>{children}</ToastProvider>
        <AccessibilityButton />
      </body>
    </html>
  )
}
