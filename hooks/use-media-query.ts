"use client"

import { useEffect, useState } from "react"

/**
 * Returns true when the given media query matches.
 * Defaults to false on the server / first paint to avoid hydration mismatch,
 * then updates on mount.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia(query)
    const update = () => setMatches(mql.matches)
    update()
    mql.addEventListener("change", update)
    return () => mql.removeEventListener("change", update)
  }, [query])

  return matches
}
