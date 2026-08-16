"use client"

import { useState, useRef } from "react"
import { motion, AnimatePresence, useMotionValue } from "framer-motion"
import { BackgroundEffects } from "./solution-hero-background"
import { useGravityEffect } from "@/src/hooks/use-gravity-effect"
import { useInitElasticBoxPositions } from "@/src/hooks/use-init-elastic-box-positions"
import { Lamp } from "./lamp"
import { RealisticSwitch } from "./realistic-switch"
import { QUOTES } from "@/lib/quotes"
import "@/app/realistic-switch.css"

/**
 * Faithful port of the animated-spotlight template's interactive scene
 * (draggable lamp + light rays that follow it + on/off switch), with `children`
 * overlaid centered on top for the page's hero text.
 */
export function AnimatedSpotlightHero() {
  const containerRef = useRef<HTMLDivElement>(null)
  const isDraggingRef = useRef(false)
  const [isLightOn, setIsLightOn] = useState(true)
  // Secret quote revealed when the lamp is switched on (via cord or switch).
  const [quote, setQuote] = useState<(typeof QUOTES)[number] | null>(null)

  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rotation = useMotionValue(0)

  const { isPositioned, anchor, restPosition } = useInitElasticBoxPositions(containerRef, x, y)
  useGravityEffect({ anchor, restPosition, x, y, rotation, isDraggingRef })

  const handlePointerMove = (e: PointerEvent) => {
    if (isDraggingRef.current && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      x.set(e.clientX - rect.left)
      y.set(e.clientY - rect.top)
    }
  }
  const handlePointerUp = () => {
    isDraggingRef.current = false
    window.removeEventListener("pointermove", handlePointerMove)
    window.removeEventListener("pointerup", handlePointerUp)
  }
  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
    window.addEventListener("pointermove", handlePointerMove)
    window.addEventListener("pointerup", handlePointerUp)
  }
  const handleToggle = () => {
    setIsLightOn((prev) => {
      const next = !prev
      // Turning the light ON reveals a fresh secret quote; off hides it.
      setQuote(next ? QUOTES[Math.floor(Math.random() * QUOTES.length)] : null)
      return next
    })
  }

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0 overflow-hidden font-sans touch-none"
      style={{ background: "radial-gradient(circle, #1E293B 0%, #0F172A 100%)" }}
    >
      {/* Dark overlay when the light is off */}
      <motion.div
        className="pointer-events-none absolute inset-0 z-[35]"
        style={{ backgroundColor: "#020617" }}
        animate={{ opacity: isLightOn ? 0 : 0.85 }}
        transition={{ duration: 0.5 }}
      />

      {/* WebGL light-rays that follow the lamp (behind hero text) */}
      <div className="absolute inset-0 z-0">
        <BackgroundEffects dynamicOrigin={{ x, y }} isLightOn={isLightOn} />
      </div>

      {/* On/off switch — top-right, above everything, interactive */}
      <div className="switch-container pointer-events-auto absolute right-6 top-24 z-[45] md:top-28">
        <RealisticSwitch isOn={isLightOn} onToggle={handleToggle} orientation="vertical" />
      </div>

      {/* Draggable lamp — hangs on the right, above hero text so it's grabbable */}
      {isPositioned && (
        <Lamp
          x={x}
          y={y}
          rotation={rotation}
          anchor={anchor}
          isLightOn={isLightOn}
          onPointerDown={handlePointerDown}
          onCordPull={handleToggle}
        />
      )}

      {/* Secret quote revealed by the lamp — royal card, lower-right. */}
      <AnimatePresence>
        {isLightOn && quote && (
          <motion.figure
            key={quote.text}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-none absolute bottom-24 right-6 z-40 max-w-xs rounded-2xl border border-[#d4af37]/30 bg-[#0b0f19]/70 p-5 text-right backdrop-blur-xl md:right-12 md:max-w-sm"
          >
            <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.25em] text-[#d4af37]/70">
              Illuminated
            </p>
            <blockquote className="font-serif text-sm italic leading-relaxed text-foreground/90 md:text-base">
              “{quote.text}”
            </blockquote>
            <figcaption className="mt-2 font-mono text-[11px] text-[#d4af37]/80">
              — {quote.author}
            </figcaption>
          </motion.figure>
        )}
      </AnimatePresence>
    </div>
  )
}
