"use client"

import { useEffect, useRef, useState } from "react"

/**
 * Reveals content once the referenced element scrolls into view.
 * Works inside the horizontally-scrolling section container.
 */
export function useReveal(threshold = 0.3) {
  const ref = useRef<HTMLElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Reveal as soon as any meaningful part is on screen, and once revealed
        // it stays (no re-hide) so content never flickers away.
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold, rootMargin: "0px 0px -10% 0px" },
    )

    observer.observe(element)

    // Safety net: if the observer never fires (edge cases in the horizontal
    // container), reveal after a short delay so content is never stuck hidden.
    const fallback = setTimeout(() => setIsVisible(true), 1200)

    return () => {
      observer.disconnect()
      clearTimeout(fallback)
    }
  }, [threshold])

  return { ref, isVisible }
}
