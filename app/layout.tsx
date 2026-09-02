import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import { ToastProvider } from "@/components/toast"
import { StructuredData } from "@/components/structured-data"
import { AccessibilityButton } from "@/components/accessibility-button"
import { RefreshButton } from "@/components/refresh-button"
import { PageLoader } from "@/components/page-loader"
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
  icons: {
    icon: [
      { url: "/brand/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/favicon-16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/brand/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    title: "Rakshit Sinha — Senior BI Consultant & Mentor",
    description: DESCRIPTION,
    siteName: "Rakshit Sinha",
    images: [
      { url: "/brand/og-image.png", width: 1200, height: 630, alt: "Rakshit Sinha — Business Intelligence and Mentoring" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Rakshit Sinha — Senior BI Consultant & Mentor",
    description: DESCRIPTION,
    images: ["/brand/og-image.png"],
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
      <head>
        {/* Security hardening. GitHub Pages can't set HTTP headers on a static
            export, so these ship as <meta> equivalents. The CSP whitelists only
            the services actually used: Supabase (auth/db/functions), Razorpay
            checkout, and self. Keep this in sync if a new external service is added. */}
        <meta
          httpEquiv="Content-Security-Policy"
          content={[
            "default-src 'self'",
            // Next.js needs inline/eval for hydration; Razorpay checkout; Google (upcoming OAuth); Cloudflare Turnstile captcha.
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://accounts.google.com https://challenges.cloudflare.com",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: blob: https:",
            "font-src 'self' data:",
            // XHR/fetch: Supabase API + functions, Razorpay API, Google identity.
            "connect-src 'self' https://*.supabase.co https://api.razorpay.com https://lumberjack.razorpay.com https://accounts.google.com",
            // Razorpay + Google open in iframes; Turnstile renders its challenge in one.
            "frame-src https://api.razorpay.com https://checkout.razorpay.com https://accounts.google.com https://challenges.cloudflare.com",
            "worker-src 'self' blob:",
            "manifest-src 'self'",
            "media-src 'self'",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "frame-ancestors 'none'",
            "block-all-mixed-content",
            "upgrade-insecure-requests",
          ].join("; ")}
        />
        <meta name="referrer" content="strict-origin-when-cross-origin" />
        {/* Defence-in-depth. GitHub Pages can't send these as HTTP headers, so
            they ship as meta equivalents where the browser honours them. */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta
          httpEquiv="Permissions-Policy"
          content="camera=(), microphone=(), geolocation=(), payment=(self)"
        />
        <StructuredData />
      </head>
      <body className={`${geist.variable} ${geistMono.variable} font-sans antialiased`}>
        {/* Skip link for keyboard & screen-reader users (WCAG 2.4.1). */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-foreground focus:px-4 focus:py-2 focus:text-sm focus:text-background"
        >
          Skip to content
        </a>
        <PageLoader />
        <ToastProvider>{children}</ToastProvider>
        <AccessibilityButton />
        <RefreshButton />
      </body>
    </html>
  )
}
