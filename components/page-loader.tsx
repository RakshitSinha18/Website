"use client"

import { useEffect, useState } from "react"

/**
 * Brief branded loading screen shown on first paint, then fades out. Respects
 * reduced-motion (shorter, no spin). Sits above everything until dismissed.
 */
export function PageLoader() {
  const [gone, setGone] = useState(false)
  const [hiding, setHiding] = useState(false)

  useEffect(() => {
    const reduce =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      document.documentElement.classList.contains("reduce-motion")

    // Start fade-out shortly after load, then unmount.
    const hideAt = reduce ? 250 : 900
    const t1 = setTimeout(() => setHiding(true), hideAt)
    const t2 = setTimeout(() => setGone(true), hideAt + 500)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [])

  if (gone) return null

  return (
    <div
      aria-hidden
      className={`fixed inset-0 z-[200] flex items-center justify-center bg-[#0b0f19] transition-opacity duration-500 ${
        hiding ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      {/* soft glow */}
      <div className="pointer-events-none absolute h-64 w-64 rounded-full bg-sky-500/20 blur-3xl" />

      <div className="relative flex flex-col items-center gap-5">
        {/* Monogram with ring spinner */}
        <div className="relative flex h-16 w-16 items-center justify-center">
          <span className="absolute inset-0 rounded-full border-2 border-white/10" />
          <span className="page-loader-ring absolute inset-0 rounded-full border-2 border-transparent border-t-sky-400" />
          <span className="font-sans text-lg font-semibold tracking-tight text-foreground">RS</span>
        </div>
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-foreground/50">
          Rakshit Sinha
        </p>
      </div>
    </div>
  )
}
