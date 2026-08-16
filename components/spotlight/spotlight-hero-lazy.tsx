"use client"

import dynamic from "next/dynamic"
import { useEffect, useState, type ReactNode } from "react"
import { useMediaQuery } from "@/hooks/use-media-query"

// Interactive spotlight (framer-motion + ogl/WebGL) — client-only, code-split.
const AnimatedSpotlightHero = dynamic(
  () => import("./animated-spotlight-hero").then((m) => m.AnimatedSpotlightHero),
  { ssr: false },
)

/**
 * Renders the full interactive spotlight hero (draggable lamp + switch + light
 * rays) on desktop with motion enabled. On mobile / reduced-motion it renders
 * `fallback` (a static CSS backdrop) with the same children, so the lean
 * experience is preserved and content is always shown.
 */
export function SpotlightHeroLazy({
  children,
  fallback,
}: {
  children: ReactNode
  fallback: ReactNode
}) {
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

  if (isDesktop && interactive) {
    return <AnimatedSpotlightHero>{children}</AnimatedSpotlightHero>
  }
  return <>{fallback}</>
}
