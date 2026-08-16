// src/hooks/use-gravity-effect.ts

"use client"
import { useEffect, type MutableRefObject } from "react"
import type { MotionValue } from "framer-motion"

interface GravityEffectProps {
  anchor: { x: number; y: number }
  restPosition: { x: number; y: number }
  x: MotionValue<number>
  y: MotionValue<number>
  rotation: MotionValue<number>
  isDraggingRef: MutableRefObject<boolean>
}

export function useGravityEffect({ anchor, restPosition, x, y, rotation, isDraggingRef }: GravityEffectProps) {
  useEffect(() => {
    // Adicionamos de volta as variáveis para um controle de física mais fino
    const velocityX = { current: 0 }
    const velocityY = { current: 0 }
    const bounceCountX = { current: 0 }
    const bounceCountY = { current: 0 }
    const lastVelocityX = { current: 0 }
    const lastVelocityY = { current: 0 }

    let frameId: number
    let lastTime = performance.now()

    const applyGravity = (currentTime: number) => {
      const deltaTime = Math.min((currentTime - lastTime) / 16, 2)
      lastTime = currentTime

      if (isDraggingRef.current) {
        // Reinicia os contadores quando começamos a arrastar
        velocityX.current = x.getVelocity() / 60
        velocityY.current = y.getVelocity() / 60
        bounceCountX.current = 0
        bounceCountY.current = 0
        frameId = requestAnimationFrame(applyGravity)
        return
      }

      const currentY = y.get()
      const currentX = x.get()
      const dx = restPosition.x - currentX
      const dy = restPosition.y - currentY

      // A força da mola (elasticidade)
      const springForceX = dx * 0.04 * deltaTime
      const springForceY = dy * 0.04 * deltaTime
      velocityX.current += springForceX
      velocityY.current += springForceY

      // Detecta as "quicadas" para aumentar o amortecimento
      if (Math.sign(velocityX.current) !== Math.sign(lastVelocityX.current) && lastVelocityX.current !== 0) {
        bounceCountX.current += 1
      }
      if (Math.sign(velocityY.current) !== Math.sign(lastVelocityY.current) && lastVelocityY.current !== 0) {
        bounceCountY.current += 1
      }
      lastVelocityX.current = velocityX.current
      lastVelocityY.current = velocityY.current

      // AMORTECIMENTO INTELIGENTE: Fica mais forte a cada "quicada"
      const baseDamping = 0.96
      const progressiveDampingX = Math.pow(baseDamping, 1 + bounceCountX.current * 0.3)
      const progressiveDampingY = Math.pow(baseDamping, 1 + bounceCountY.current * 0.3)
      velocityX.current *= progressiveDampingX
      velocityY.current *= progressiveDampingY

      x.set(currentX + velocityX.current)
      y.set(currentY + velocityY.current)
      
      const positionOffset = (currentX - anchor.x) / 30
      const velocityOffset = velocityX.current / 8
      rotation.set(positionOffset + velocityOffset)

      frameId = requestAnimationFrame(applyGravity)
    }
    frameId = requestAnimationFrame(applyGravity)
    return () => {
      cancelAnimationFrame(frameId)
    }
  }, [anchor, restPosition, x, y, rotation, isDraggingRef])
}
