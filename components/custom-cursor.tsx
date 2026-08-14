"use client"

import { useEffect, useRef } from "react"

/**
 * Liquid custom cursor:
 *  - a crisp inner dot that tracks the pointer almost instantly
 *  - a soft outer blob that trails with elastic lag and STRETCHES in the
 *    direction of motion (velocity-based squash) for a gooey, liquid feel
 *  - grows and softens over interactive elements
 */
export function CustomCursor() {
  const outerRef = useRef<HTMLDivElement>(null)
  const dotRef = useRef<HTMLDivElement>(null)
  const pos = useRef({ x: 0, y: 0 }) // trailing blob
  const dot = useRef({ x: 0, y: 0 }) // fast dot
  const target = useRef({ x: 0, y: 0 })
  const prev = useRef({ x: 0, y: 0 })
  const hovering = useRef(false)

  useEffect(() => {
    let raf = 0
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t

    const tick = () => {
      // Fast dot
      dot.current.x = lerp(dot.current.x, target.current.x, 0.35)
      dot.current.y = lerp(dot.current.y, target.current.y, 0.35)
      // Slow trailing blob
      pos.current.x = lerp(pos.current.x, target.current.x, 0.16)
      pos.current.y = lerp(pos.current.y, target.current.y, 0.16)

      // Velocity → stretch (liquid squash)
      const vx = pos.current.x - prev.current.x
      const vy = pos.current.y - prev.current.y
      prev.current = { x: pos.current.x, y: pos.current.y }
      const speed = Math.min(Math.hypot(vx, vy), 40)
      const angle = (Math.atan2(vy, vx) * 180) / Math.PI
      const stretch = 1 + speed / 55 // up to ~1.7x
      const squash = 1 - speed / 90

      if (outerRef.current && dotRef.current) {
        const base = hovering.current ? 1.8 : 1
        outerRef.current.style.transform =
          `translate3d(${pos.current.x}px, ${pos.current.y}px, 0) translate(-50%, -50%) ` +
          `rotate(${angle}deg) scale(${stretch * base}, ${squash * base})`
        outerRef.current.style.opacity = hovering.current ? "0.9" : "0.65"
        dotRef.current.style.transform = `translate3d(${dot.current.x}px, ${dot.current.y}px, 0) translate(-50%, -50%) scale(${hovering.current ? 0.4 : 1})`
      }
      raf = requestAnimationFrame(tick)
    }

    const onMove = (e: MouseEvent) => {
      target.current = { x: e.clientX, y: e.clientY }
      const el = e.target as HTMLElement
      hovering.current =
        window.getComputedStyle(el).cursor === "pointer" ||
        el.tagName === "BUTTON" ||
        el.tagName === "A" ||
        el.closest("button, a") !== null
    }

    window.addEventListener("mousemove", onMove, { passive: true })
    raf = requestAnimationFrame(tick)
    return () => {
      window.removeEventListener("mousemove", onMove)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <>
      {/* Trailing liquid blob */}
      <div
        ref={outerRef}
        className="pointer-events-none fixed left-0 top-0 z-[60] h-8 w-8 rounded-full will-change-transform"
        style={{
          contain: "layout style paint",
          background: "radial-gradient(circle, rgba(140,200,255,0.9) 0%, rgba(255,180,80,0.5) 70%, transparent 100%)",
          mixBlendMode: "screen",
          filter: "blur(1px)",
        }}
      />
      {/* Crisp inner dot */}
      <div
        ref={dotRef}
        className="pointer-events-none fixed left-0 top-0 z-[60] h-1.5 w-1.5 rounded-full bg-white will-change-transform"
        style={{ contain: "layout style paint" }}
      />
    </>
  )
}
