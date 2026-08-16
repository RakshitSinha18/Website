"use client"

import { Suspense, useRef } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { useGLTF, Environment } from "@react-three/drei"
import type { Group } from "three"

/**
 * Rotating 3D bar-chart (modelled in Blender, exported to /models/bi-chart.glb).
 *
 * Loaded lazily and only where it makes sense — the parent gates on desktop +
 * reduced-motion, so mobile users and motion-sensitive users never pay the cost.
 */

const MODEL = `${process.env.NEXT_PUBLIC_BASE_PATH || ""}/models/bi-chart.glb`

function Chart() {
  const ref = useRef<Group>(null)
  const { scene } = useGLTF(MODEL)
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.35
  })
  return (
    <group ref={ref}>
      <primitive object={scene} />
    </group>
  )
}

export default function BIChart3D({ className = "" }: { className?: string }) {
  return (
    <div className={className} aria-hidden>
      <Canvas
        camera={{ position: [3.2, 2.4, 3.6], fov: 40 }}
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[4, 6, 3]} intensity={1.2} />
        <Suspense fallback={null}>
          <Chart />
          <Environment preset="city" />
        </Suspense>
      </Canvas>
    </div>
  )
}

useGLTF.preload(MODEL)
