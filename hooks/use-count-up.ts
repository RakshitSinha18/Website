"use client"

import { useEffect, useRef, useState } from "react"

/**
 * Animates a number from 0 to `target` once `active` becomes true.
 * Respects prefers-reduced-motion (jumps straight to the value).
 * Returns the current animated value.
 *
 * Initialises at `target` (not 0) so the statically exported HTML — what
 * search engines, link previews and the pre-hydration paint show — carries
 * the real number. The 0 → target tally only plays client-side.
 */
export function useCountUp(target: number, active: boolean, durationMs = 1400) {
  const [value, setValue] = useState(target)
  const started = useRef(false)

  useEffect(() => {
    if (!active || started.current) return
    started.current = true

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (prefersReduced) {
      setValue(target)
      return
    }

    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min((now - start) / durationMs, 1)
      // easeOutExpo for a lively, decelerating count.
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
      setValue(Math.round(target * eased))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [active, target, durationMs])

  return value
}
