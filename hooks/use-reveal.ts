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
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold },
    )

    observer.observe(element)

    return () => observer.disconnect()
  }, [threshold])

  return { ref, isVisible }
}
