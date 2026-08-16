"use client"

import { useState, useRef } from "react"
import { motion, useMotionValue } from "framer-motion"
import { BackgroundEffects } from "./solution-hero-background"
import { useGravityEffect } from "@/src/hooks/use-gravity-effect"
import { useInitElasticBoxPositions } from "@/src/hooks/use-init-elastic-box-positions"
import { Lamp } from "./lamp"
import { RealisticSwitch } from "./realistic-switch"
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
  const handleToggle = () => setIsLightOn((v) => !v)

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0 overflow-hidden font-sans touch-none"
      style={{ background: "radial-gradient(circle, #1E293B 0%, #0F172A 100%)" }}
    >
      {/* Dark overlay when the light is off */}
      <motion.div
        className="absolute inset-0 z-30 pointer-events-none"
        style={{ backgroundColor: "#020617" }}
        animate={{ opacity: isLightOn ? 0 : 0.85 }}
        transition={{ duration: 0.5 }}
      />

      {/* On/off switch — moved below the fixed nav; interactive */}
      <div className="switch-container pointer-events-auto absolute right-6 top-24 z-50 md:top-28">
        <RealisticSwitch isOn={isLightOn} onToggle={handleToggle} orientation="vertical" />
      </div>

      {/* WebGL light-rays that follow the lamp */}
      <div className="absolute inset-0 z-0">
        <BackgroundEffects dynamicOrigin={{ x, y }} isLightOn={isLightOn} />
      </div>

      {/* Draggable lamp */}
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
    </div>
  )
}
