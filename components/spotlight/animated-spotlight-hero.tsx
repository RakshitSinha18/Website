"use client"

import { useState, useRef, useEffect } from "react"
import { motion, useMotionValue, useTransform } from "framer-motion"
import { BackgroundEffects } from "./solution-hero-background"
import { useGravityEffect } from "@/src/hooks/use-gravity-effect"
import { useInitElasticBoxPositions } from "@/src/hooks/use-init-elastic-box-positions"
import { Lamp } from "./lamp"
import { RealisticSwitch } from "./realistic-switch"

export function AnimatedSpotlightHero() {
  const containerRef = useRef<HTMLDivElement>(null)
  const isDraggingRef = useRef(false)
  const [isLightOn, setIsLightOn] = useState(true)

  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rotation = useMotionValue(0)

  const { isPositioned, anchor, restPosition } = useInitElasticBoxPositions(containerRef, x, y)
  useGravityEffect({ anchor, restPosition, x, y, rotation, isDraggingRef })

  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true
    const target = e.target as HTMLElement
    target.setPointerCapture(e.pointerId)
    window.addEventListener("pointermove", handlePointerMove)
    window.addEventListener("pointerup", handlePointerUp)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
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

  const handleToggle = () => {
    setIsLightOn((prev) => !prev)
  }

  return (
    <div 
      ref={containerRef} 
      className="min-h-screen relative overflow-hidden font-sans touch-none"
      style={{ background: "radial-gradient(circle, #1E293B 0%, #0F172A 100%)" }}
    >
      <motion.div
        className="absolute inset-0 z-30 pointer-events-none"
        style={{ backgroundColor: '#020617' }}
        animate={{ opacity: isLightOn ? 0 : 0.85 }}
        transition={{ duration: 0.5 }}
      />
      
      <div className="absolute top-8 left-8 z-50">
        <RealisticSwitch 
          isOn={isLightOn} 
          onToggle={handleToggle} 
          orientation="vertical"
        />
      </div>

      <div className="absolute inset-0 z-0">
        <BackgroundEffects 
          dynamicOrigin={{ x, y }}
          isLightOn={isLightOn} 
        />
      </div>

      {isPositioned && (
        <Lamp
          x={x}
          y={y}
          rotation={rotation}
          anchor={anchor}
          onPointerDown={handlePointerDown}
        />
      )}
    </div>
  )
}
