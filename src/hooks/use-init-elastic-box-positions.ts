// src/hooks/use-init-elastic-box-positions.ts

"use client"
import { useState, useEffect, type RefObject } from "react"
import type { MotionValue } from "framer-motion"

interface PositionState {
  isPositioned: boolean
  anchor: { x: number; y: number }
  restPosition: { x: number; y: number }
}

export function useInitElasticBoxPositions(
  containerRef: RefObject<HTMLDivElement>,
  x: MotionValue<number>,
  y: MotionValue<number>,
): PositionState {
  const [positionState, setPositionState] = useState<PositionState>({
    isPositioned: false,
    anchor: { x: 0, y: 0 },
    restPosition: { x: 0, y: 0 },
  })

  useEffect(() => {
    const updatePositions = () => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()

      // Keep the lamp toward the right so it doesn't sit over the centered
      // hero text. Anchor + rest position both shift to ~72% width.
      const rightX = rect.width * 0.72

      const newPositions = {
        isPositioned: true,
        anchor: { x: rightX, y: 0 },
        restPosition: { x: rightX, y: rect.height * 0.15 },
      }
      
      setPositionState(newPositions)
      
      if (!positionState.isPositioned) {
        x.set(newPositions.restPosition.x)
        y.set(newPositions.restPosition.y)
      }
    }
    updatePositions()
    window.addEventListener("resize", updatePositions)
    return () => window.removeEventListener("resize", updatePositions)
  }, [containerRef, x, y, positionState.isPositioned])

  return positionState
}
