"use client"

import dynamic from "next/dynamic"
import { useEffect, useState } from "react"
import { useMediaQuery } from "@/hooks/use-media-query"

// Interactive spotlight (framer-motion + ogl/WebGL) — client-only, code-split.
const AnimatedSpotlightHero = dynamic(
  () => import("./animated-spotlight-hero").then((m) => m.AnimatedSpotlightHero),
  { ssr: false },
)

/**
 * Spotlight backdrop that sits BEHIND the hero content (which is always rendered
 * server-side, so the hero is never blank). On desktop + motion-on it mounts the
 * interactive draggable lamp + switch scene; otherwise a lightweight static beam.
 */
export function SpotlightHeroLazy() {
  const isDesktop = useMediaQuery("(min-width: 768px)")
  const [interactive, setInteractive] = useState(false)

  useEffect(() => {
    const check = () =>
      setInteractive(
        !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
          !document.documentElement.classList.contains("reduce-motion"),
      )
    check()
    const obs = new MutationObserver(check)
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
    return () => obs.disconnect()
  }, [])

  // Static beam fallback (also the SSR/first-paint state).
  const beam = (
    <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
      <div className="absolute left-1/2 top-0 h-[75%] w-[70%] -translate-x-1/2 bg-[radial-gradient(closest-side,rgba(142,197,255,0.22),transparent)]" />
    </div>
  )

  if (isDesktop && interactive) {
    return <AnimatedSpotlightHero />
  }
  return beam
}
