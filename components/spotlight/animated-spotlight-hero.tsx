"use client"

import { useState, useRef, type ReactNode } from "react"
import { motion, useMotionValue } from "framer-motion"
import { BackgroundEffects } from "./solution-hero-background"
import { useGravityEffect } from "@/src/hooks/use-gravity-effect"
import { useInitElasticBoxPositions } from "@/src/hooks/use-init-elastic-box-positions"
import { Lamp } from "./lamp"
import { RealisticSwitch } from "./realistic-switch"
import "@/app/realistic-switch.css"

/**
 * Interactive spotlight hero from the animated-spotlight template.
 *  - Draggable hanging lamp; the WebGL light-rays follow it (dynamicOrigin).
 *  - A realistic on/off switch (top-left) that dims the whole scene.
 *  - `children` are the page's hero content, centered over the scene.
 */
export function AnimatedSpotlightHero({ children }: { children?: ReactNode }) {
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

  const toggle = () => setIsLightOn((v) => !v)

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden touch-none">
      {/* Dark overlay when the light is off */}
      <motion.div
        className="absolute inset-0 z-30 pointer-events-none"
        style={{ backgroundColor: "#020617" }}
        animate={{ opacity: isLightOn ? 0 : 0.9 }}
        transition={{ duration: 0.5 }}
      />

      {/* WebGL light-rays that follow the lamp */}
      <div className="absolute inset-0 z-0">
        <BackgroundEffects dynamicOrigin={{ x, y }} isLightOn={isLightOn} />
      </div>

      {/* Hero content, centered — sits above rays but below the lamp/switch */}
      {children && <div className="relative z-20">{children}</div>}

      {/* Draggable lamp — above content so it's always visible & grabbable */}
      {isPositioned && (
        <Lamp
          x={x}
          y={y}
          rotation={rotation}
          anchor={anchor}
          isLightOn={isLightOn}
          onPointerDown={handlePointerDown}
          onCordPull={toggle}
        />
      )}

      {/* On/off switch — clears the fixed top nav, top-most layer */}
      <div className="switch-container absolute right-6 top-24 z-[60] md:top-28">
        <RealisticSwitch isOn={isLightOn} onToggle={toggle} orientation="vertical" />
      </div>
    </div>
  )
}
