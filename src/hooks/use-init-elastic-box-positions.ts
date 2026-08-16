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
      const centerX = rect.width / 2

      const newPositions = {
        isPositioned: true,
        anchor: { x: centerX, y: 0 }, 
        // 2. LUMINÁRIA POSICIONADA MAIS ALTA
        // Um valor menor (0.15) significa mais perto do topo da tela.
        restPosition: { x: centerX, y: rect.height * 0.15 }, 
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
