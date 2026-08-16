"use client"

import LightRays from "./light-rays"

/**
 * The light-rays WebGL effect from the animated-spotlight template, used purely
 * as a hero backdrop (no draggable lamp / switch). Rendered behind the hero
 * content. Loaded lazily + desktop-gated by the parent wrapper.
 */
export default function SpotlightRays() {
  return (
    <LightRays
      raysOrigin="top-center"
      raysColor="#8ec5ff"
      raysSpeed={0.8}
      lightSpread={0.6}
      rayLength={2.2}
      fadeDistance={1.3}
      saturation={1.1}
      className="absolute inset-0"
    />
  )
}
