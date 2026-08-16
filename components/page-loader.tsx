"use client"

import { useEffect, useState } from "react"

/**
 * Royal, spotlight-themed loading screen: a gold light-beam sweeps over the
 * "RS" monogram, then fades out. Quick (~0.6s). Respects reduced-motion.
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
      className={`fixed inset-0 z-[200] flex items-center justify-center bg-[#0a0e18] transition-opacity duration-[450ms] ${
        hiding ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      {/* Overhead spotlight beam */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-[70%] w-[60%] -translate-x-1/2 bg-[radial-gradient(closest-side,rgba(212,175,55,0.18),transparent)]" />

      <div className="relative flex flex-col items-center gap-4">
        {/* Gold-ringed monogram with a sweeping shine */}
        <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-[#d4af37]/40 bg-white/[0.03]">
          <span className="page-loader-sweep pointer-events-none absolute inset-0" />
          <span className="bg-gradient-to-b from-[#f5e7b8] to-[#d4af37] bg-clip-text font-sans text-xl font-semibold tracking-tight text-transparent">
            RS
          </span>
        </div>
        <p className="page-loader-fade font-mono text-[10px] uppercase tracking-[0.35em] text-[#d4af37]/70">
          Rakshit Sinha
        </p>
      </div>
    </div>
  )
}
