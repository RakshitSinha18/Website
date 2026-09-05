"use client"

import { useEffect, useState } from "react"

/**
 * Brand loading screen: the RS monogram tile (ink base, sky→amber gradient —
 * same as /rs-logo.svg) with a light sweep, then fades out. Quick (~0.6s).
 * Respects reduced-motion.
 */
export function PageLoader() {
  const [gone, setGone] = useState(false)
  const [hiding, setHiding] = useState(false)

  useEffect(() => {
    const reduce =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      document.documentElement.classList.contains("reduce-motion")

    const hideAt = reduce ? 200 : 600
    const t1 = setTimeout(() => setHiding(true), hideAt)
    const t2 = setTimeout(() => setGone(true), hideAt + 450)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [])

  if (gone) return null

  return (
    <div
      aria-hidden
      className={`fixed inset-0 z-[200] flex items-center justify-center bg-[#0b0f19] transition-opacity duration-[450ms] ${
        hiding ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      {/* Overhead spotlight beam in the brand sky tint */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-[70%] w-[60%] -translate-x-1/2 bg-[radial-gradient(closest-side,rgba(56,189,248,0.14),transparent)]" />

      <div className="relative flex flex-col items-center gap-4">
        {/* Brand monogram — the 3D Cycles render — with a sweeping shine. */}
        <div className="relative h-20 w-20 overflow-hidden rounded-2xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/rs-logo-3d.png" alt="" aria-hidden className="h-full w-full object-contain" />
          <span className="page-loader-sweep pointer-events-none absolute inset-0" />
        </div>
        <p className="page-loader-fade font-mono text-[10px] uppercase tracking-[0.35em] text-foreground/50">
          Rakshit Sinha
        </p>
      </div>
    </div>
  )
}
