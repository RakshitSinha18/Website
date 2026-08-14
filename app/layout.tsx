import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import "./globals.css"

const geist = Inter({ subsets: ["latin"], variable: "--font-geist-sans" })
const geistMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-geist-mono" })

export const metadata: Metadata = {
  title: "Rakshit Sinha — Senior BI Consultant & Mentor",
  description:
    "Rakshit Sinha is a results-driven Senior Business Intelligence consultant with 9+ years turning complex data into actionable insights using Tableau, SQL, Advanced Excel and Base SAS 9.4 — and an after-hours mentor for aspiring data professionals.",
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
      <body className={`${geist.variable} ${geistMono.variable} font-sans antialiased`}>{children}</body>
    </html>
  )
}
