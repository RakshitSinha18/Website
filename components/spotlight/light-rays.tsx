// light-rays.tsx
"use client"
import type React from "react"
import { Mesh, Program, Renderer, Triangle } from "ogl"
import { useEffect, useRef, useState } from "react"
import type { MotionValue } from "framer-motion"

export type RaysOrigin = "top-center" | "top-left" | "top-right" | "right" | "left" | "bottom-center" | "bottom-right" | "bottom-left"

interface LightRaysProps {
  raysOrigin?: RaysOrigin
  raysColor?: string
  raysSpeed?: number
  lightSpread?: number
  rayLength?: number
  pulsating?: boolean
  fadeDistance?: number
  saturation?: number
  mouseInfluence?: number
  noiseAmount?: number
  distortion?: number
  className?: string
  introAnimation?: boolean
  dynamicOrigin?: { x: MotionValue<number>; y: MotionValue<number> } | null
}

const DEFAULT_COLOR = "#ffffff"
const hexToRgb = (hex: string): [number, number, number] => {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return m ? [Number.parseInt(m[1], 16) / 255, Number.parseInt(m[2], 16) / 255, Number.parseInt(m[3], 16) / 255] : [1, 1, 1]
}
const getAnchorAndDir = (origin: RaysOrigin, w: number, h: number): { anchor: [number, number]; dir: [number, number] } => {
  const outside = 0.2
  switch (origin) {
    case "top-left": return { anchor: [0, -outside * h], dir: [0, 1] }
    case "top-right": return { anchor: [w, -outside * h], dir: [0, 1] }
    case "left": return { anchor: [-outside * w, 0.5 * h], dir: [1, 0] }
    case "right": return { anchor: [(1 + outside) * w, 0.5 * h], dir: [-1, 0] }
    case "bottom-left": return { anchor: [0, (1 + outside) * h], dir: [0, -1] }
    case "bottom-center": return { anchor: [0.5 * w, (1 + outside) * h], dir: [0, -1] }
    case "bottom-right": return { anchor: [w, (1 + outside) * h], dir: [0, -1] }
    default: return { anchor: [0.5 * w, -outside * h], dir: [0, 1] }
  }
}

const LightRays: React.FC<LightRaysProps> = ({
  raysOrigin = "top-center", raysColor = DEFAULT_COLOR, raysSpeed = 1, lightSpread = 1, rayLength = 2, pulsating = false, fadeDistance = 1.0, saturation = 1.0, mouseInfluence = 0.1, noiseAmount = 0.0, distortion = 0.0, className = "", introAnimation = true, dynamicOrigin = null,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const uniformsRef = useRef<Record<string, { value: any }> | null>(null)
  const rendererRef = useRef<Renderer | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    observerRef.current = new IntersectionObserver((entries) => setIsVisible(entries[0].isIntersecting), { threshold: 0.1 })
    observerRef.current.observe(containerRef.current)
    return () => observerRef.current?.disconnect()
  }, [])
  
  useEffect(() => {
    if (!isVisible || !containerRef.current) return
    let cleanupFunction: (() => void) | null = null

    const initializeWebGL = () => {
      if (!containerRef.current) return
      const renderer = new Renderer({ dpr: Math.min(window.devicePixelRatio, 2), alpha: true })
      rendererRef.current = renderer
      const gl = renderer.gl
      gl.canvas.style.width = "100%"; gl.canvas.style.height = "100%";
      containerRef.current.innerHTML = ""; containerRef.current.appendChild(gl.canvas)

      const vert = `attribute vec2 position; varying vec2 vUv; void main() { vUv = position * 0.5 + 0.5; gl_Position = vec4(position, 0.0, 1.0); }`
const frag = `precision highp float; uniform float iTime; uniform vec2 iResolution; uniform vec2 rayPos; uniform vec2 rayDir; uniform vec3 raysColor; uniform float raysSpeed; uniform float lightSpread; uniform float rayLength; uniform float pulsating; uniform float fadeDistance; uniform float saturation; uniform float mouseInfluence; uniform float noiseAmount; uniform float distortion; uniform float uIntro; varying vec2 vUv; float noise(vec2 st) { return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123); } float rayStrength(vec2 raySource, vec2 rayRefDirection, vec2 coord, float seedA, float seedB, float speed) { vec2 sourceToCoord = coord - raySource; vec2 dirNorm = normalize(sourceToCoord); float cosAngle = dot(dirNorm, rayRefDirection); float distortedAngle = cosAngle; if (distortion > 0.0) { distortedAngle += distortion * sin(iTime * 2.0 + length(sourceToCoord) * 0.01) * 0.2; } float spreadFactor = pow(max(distortedAngle, 0.0), 1.8 / max(lightSpread, 0.001)); float distance = length(sourceToCoord); float maxDistance = iResolution.x * rayLength; float lengthFalloff = clamp((maxDistance - distance) / maxDistance, 0.0, 1.0); float fadeFalloff = clamp((iResolution.x * fadeDistance - distance) / (iResolution.x * fadeDistance), 0.5, 1.0); float pulse = 1.0; if (pulsating > 0.5) { pulse = 0.9 + 0.1 * sin(iTime * speed); } 
      float baseStrength = 1.0;
      return baseStrength * lengthFalloff * fadeFalloff * spreadFactor * pulse; } void mainImage(out vec4 fragColor, in vec2 fragCoord) { vec2 coord = vec2(fragCoord.x, iResolution.y - fragCoord.y); vec2 finalRayDir = rayDir; vec4 rays1 = vec4(1.0) * rayStrength(rayPos, finalRayDir, coord, 36.2214, 21.11349, 1.5 * raysSpeed); vec4 rays2 = vec4(1.0) * rayStrength(rayPos, finalRayDir, coord, 22.3991, 18.0234, 1.1 * raysSpeed); fragColor = rays1 * 1.0 + rays2 * 0.8; if (noiseAmount > 0.0) { float n = noise(coord * 0.01 + iTime * 0.1); fragColor.rgb *= (1.0 - noiseAmount + noiseAmount * n); } float brightness = smoothstep(0.0, 0.8, 1.0 - (coord.y / iResolution.y)); fragColor.rgb *= 0.5 + brightness * 0.5; if (saturation != 1.0) { float gray = dot(fragColor.rgb, vec3(0.299, 0.587, 0.114)); fragColor.rgb = mix(vec3(gray), fragColor.rgb, saturation); } fragColor.rgb *= raysColor; fragColor.a *= uIntro; } void main() { vec4 color; mainImage(color, gl_FragCoord.xy); gl_FragColor = color; }`
      
      const uniforms = { iTime: { value: 0 }, iResolution: { value: [1, 1] }, rayPos: { value: [0, 0] }, rayDir: { value: [0, 1] }, raysColor: { value: hexToRgb(raysColor) }, raysSpeed: { value: raysSpeed }, lightSpread: { value: lightSpread }, rayLength: { value: rayLength }, pulsating: { value: pulsating ? 1.0 : 0.0 }, fadeDistance: { value: fadeDistance }, saturation: { value: saturation }, mouseInfluence: { value: mouseInfluence }, noiseAmount: { value: noiseAmount }, distortion: { value: distortion }, uIntro: { value: introAnimation ? 0 : 1 }, };
      uniformsRef.current = uniforms
      
      const geometry = new Triangle(gl)
      const program = new Program(gl, { vertex: vert, fragment: frag, uniforms })
      const mesh = new Mesh(gl, { geometry, program })

      const updatePlacement = () => {
        if (!containerRef.current || !renderer) return
        renderer.dpr = Math.min(window.devicePixelRatio, 2)
        const { clientWidth: wCSS, clientHeight: hCSS } = containerRef.current
        renderer.setSize(wCSS, hCSS)
        const dpr = renderer.dpr; const w = wCSS * dpr; const h = hCSS * dpr
        uniforms.iResolution.value = [w, h]
        if (!dynamicOrigin) {
            const { anchor, dir } = getAnchorAndDir(raysOrigin, w, h)
            uniforms.rayPos.value = anchor
            uniforms.rayDir.value = dir
        }
      }
      if (introAnimation) {
          let startTime: number | null = null; const duration = 2500
          const animateIntro = (currentTime: number) => {
              if (startTime === null) startTime = currentTime
              let progress = Math.min((currentTime - startTime) / duration, 1)
              progress = 1 - (1 - progress) ** 3
              if (uniformsRef.current) uniformsRef.current.uIntro.value = progress
              if (progress < 1) requestAnimationFrame(animateIntro)
          }
          requestAnimationFrame(animateIntro)
      }
      
      let animationId: number
      const loop = (t: number) => {
        if (!uniformsRef.current) return
        uniformsRef.current.iTime.value = t * 0.001
        renderer.render({ scene: mesh })
        animationId = requestAnimationFrame(loop)
      }
      
      window.addEventListener("resize", updatePlacement)
      updatePlacement()

      // Seed the ray origin from the lamp's CURRENT position so a re-init
      // (e.g. toggling the light on/off, which changes ray props) doesn't snap
      // the light back to the corner until the next move.
      if (dynamicOrigin) {
        uniforms.rayPos.value = [dynamicOrigin.x.get() * renderer.dpr, dynamicOrigin.y.get() * renderer.dpr]
      }

      animationId = requestAnimationFrame(loop)
      
      // framer-motion v11: use .on("change", …) (v10's .onChange was removed).
      const unsubX = dynamicOrigin?.x.on("change", (v) => { if (uniformsRef.current) uniformsRef.current.rayPos.value[0] = v * renderer.dpr })
      const unsubY = dynamicOrigin?.y.on("change", (v) => { if (uniformsRef.current) uniformsRef.current.rayPos.value[1] = v * renderer.dpr })

      cleanupFunction = () => {
        cancelAnimationFrame(animationId)
        window.removeEventListener("resize", updatePlacement)
        unsubX?.(); unsubY?.()
        renderer.gl.getExtension('WEBGL_lose_context')?.loseContext()
      }
    }

    initializeWebGL()
    return () => cleanupFunction?.()
    // Init WebGL once when visible. Prop changes (color/spread/etc.) are applied
    // live via the effect below — WITHOUT re-initializing, which used to snap the
    // light back to the corner on every on/off toggle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible, raysOrigin, dynamicOrigin, introAnimation])

  // Live-update ray uniforms when props change (no re-init, no position jump).
  useEffect(() => {
    const u = uniformsRef.current
    if (!u) return
    u.raysColor.value = hexToRgb(raysColor)
    u.raysSpeed.value = raysSpeed
    u.lightSpread.value = lightSpread
    u.rayLength.value = rayLength
    u.pulsating.value = pulsating ? 1.0 : 0.0
    u.fadeDistance.value = fadeDistance
    u.saturation.value = saturation
    u.mouseInfluence.value = mouseInfluence
    u.noiseAmount.value = noiseAmount
    u.distortion.value = distortion
  }, [raysColor, raysSpeed, lightSpread, rayLength, pulsating, fadeDistance, saturation, mouseInfluence, noiseAmount, distortion])

  return <div ref={containerRef} className={`w-full h-full pointer-events-none z-[3] overflow-hidden relative ${className}`.trim()} />
}
export default LightRays
