"use client"

import { useEffect, useRef } from "react"

/**
 * Interactive liquid/water background.
 * A canvas of soft metaball-like blobs that drift on their own AND are pulled
 * toward the mouse, creating a flowing, rippling "liquid" feel that reacts to
 * cursor movement. Falls back gracefully (static gradient stays behind it).
 * Respects prefers-reduced-motion.
 */
export function LiquidBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    let w = 0
    let h = 0
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    const resize = () => {
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener("resize", resize)

    // Soft colour blobs (blue + amber palette to match the brand).
    const palette = [
      [56, 160, 255], // sky
      [255, 150, 60], // amber
      [40, 110, 255], // blue
      [120, 90, 220], // violet
    ]
    type Blob = { x: number; y: number; vx: number; vy: number; r: number; c: number[] }
    const blobs: Blob[] = Array.from({ length: 5 }, (_, i) => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      r: Math.min(w, h) * (0.28 + Math.random() * 0.18),
      c: palette[i % palette.length],
    }))

    const mouse = { x: w / 2, y: h / 2, active: false }
    const onMove = (e: MouseEvent) => {
      mouse.x = e.clientX
      mouse.y = e.clientY
      mouse.active = true
    }
    const onLeave = () => (mouse.active = false)
    window.addEventListener("mousemove", onMove, { passive: true })
    window.addEventListener("mouseout", onLeave)

    let raf = 0
    const draw = () => {
      ctx.clearRect(0, 0, w, h)
      ctx.globalCompositeOperation = "lighter"

      for (const b of blobs) {
        // Drift
        b.x += b.vx
        b.y += b.vy

        // Pull toward the mouse (liquid follows the cursor)
        if (mouse.active) {
          const dx = mouse.x - b.x
          const dy = mouse.y - b.y
          const dist = Math.hypot(dx, dy) || 1
          const pull = Math.min(120 / dist, 0.6)
          b.vx += (dx / dist) * pull * 0.04
          b.vy += (dy / dist) * pull * 0.04
        }

        // Gentle damping + speed cap
        b.vx *= 0.98
        b.vy *= 0.98
        const sp = Math.hypot(b.vx, b.vy)
        if (sp > 1.2) {
          b.vx = (b.vx / sp) * 1.2
          b.vy = (b.vy / sp) * 1.2
        }

        // Bounce off edges
        if (b.x < -b.r * 0.5) b.vx += 0.05
        if (b.x > w + b.r * 0.5) b.vx -= 0.05
        if (b.y < -b.r * 0.5) b.vy += 0.05
        if (b.y > h + b.r * 0.5) b.vy -= 0.05

        const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r)
        grad.addColorStop(0, `rgba(${b.c[0]},${b.c[1]},${b.c[2]},0.45)`)
        grad.addColorStop(1, `rgba(${b.c[0]},${b.c[1]},${b.c[2]},0)`)
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2)
        ctx.fill()
      }

      if (!reduced) raf = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      window.removeEventListener("resize", resize)
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseout", onLeave)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 h-full w-full"
      style={{ filter: "blur(40px) saturate(1.3)" }}
    />
  )
}
