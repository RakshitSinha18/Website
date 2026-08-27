"use client"

import { useEffect, useState } from "react"
import { Download } from "lucide-react"

/**
 * "Download CV" button.
 *
 * To publish your CV: drop a PDF at public/rakshit-sinha-cv.pdf and it appears
 * automatically. Until the file exists, the button hides itself so the layout
 * never shows a dead link. (Checked with a lightweight HEAD request on mount.)
 */
export function DownloadCV({ className = "" }: { className?: string }) {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ""
  const href = `${basePath}/rakshit-sinha-cv.pdf`
  const [available, setAvailable] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch(href, { method: "HEAD" })
      .then((res) => {
        // Guard against SPA fallbacks that return 200 with an HTML page.
        const type = res.headers.get("content-type") || ""
        if (!cancelled && res.ok && !type.includes("text/html")) setAvailable(true)
      })
      .catch(() => {
        /* file not there yet — stay hidden */
      })
    return () => {
      cancelled = true
    }
  }, [href])

  if (!available) return null

  return (
    <a
      href={href}
      download
      className={`inline-flex items-center gap-2 rounded-full border border-foreground/25 bg-foreground/5 px-4 py-2 text-sm text-foreground/90 backdrop-blur-md transition-all hover:-translate-y-0.5 hover:border-foreground/50 hover:bg-foreground/10 ${className}`}
    >
      <Download className="h-4 w-4" /> Download CV
    </a>
  )
}
