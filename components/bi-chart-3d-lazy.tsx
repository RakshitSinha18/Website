"use client"

import dynamic from "next/dynamic"
import { useEffect, useState } from "react"
import { useMediaQuery } from "@/hooks/use-media-query"

// Three.js is heavy — load it only on the client, and only when actually shown.
const BIChart3D = dynamic(() => import("@/components/bi-chart-3d"), { ssr: false })

/**
 * Renders the 3D bar-chart only on desktop and only when the user hasn't asked
 * to reduce motion. Everywhere else it renders nothing, so the lean experience
 * (and small bundle) is preserved for mobile / motion-sensitive visitors.
 */
export function BIChart3DLazy({ className = "" }: { className?: string }) {
  const isDesktop = useMediaQuery("(min-width: 1024px)")
  const [allowed, setAllowed] = useState(false)

  useEffect(() => {
    const reduce =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      document.documentElement.classList.contains("reduce-motion")
    setAllowed(!reduce)
  }, [])

  if (!isDesktop || !allowed) return null
  return <BIChart3D className={className} />
}
