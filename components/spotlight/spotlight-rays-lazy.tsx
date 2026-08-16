"use client"

import dynamic from "next/dynamic"
import { useEffect, useState } from "react"
import { useMediaQuery } from "@/hooks/use-media-query"

// ogl/WebGL is heavy — load only on the client, only when shown.
const SpotlightRays = dynamic(() => import("./spotlight-rays"), { ssr: false })

/**
 * Renders the spotlight light-rays backdrop only on desktop and only when the
 * user hasn't requested reduced motion (a11y button / OS setting). Elsewhere it
 * renders nothing, so the CSS gradient hero shows through and stays lean/fast.
 */
export function SpotlightRaysLazy() {
  const isDesktop = useMediaQuery("(min-width: 768px)")
  const [allowed, setAllowed] = useState(false)

  useEffect(() => {
    const check = () =>
      setAllowed(
        !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
          !document.documentElement.classList.contains("reduce-motion"),
      )
    check()
    // Re-check if the a11y button toggles reduce-motion.
    const obs = new MutationObserver(check)
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
    return () => obs.disconnect()
  }, [])

  if (!isDesktop || !allowed) return null
  return (
    <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
      <SpotlightRays />
    </div>
  )
}
