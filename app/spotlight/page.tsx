"use client"

import dynamic from "next/dynamic"

// The interactive spotlight template, running standalone exactly as designed
// (full-screen scene: draggable lamp + light rays + on/off switch).
const AnimatedSpotlightHero = dynamic(
  () => import("@/components/spotlight/animated-spotlight-hero").then((m) => m.AnimatedSpotlightHero),
  { ssr: false },
)

export default function SpotlightDemoPage() {
  return (
    <main className="relative min-h-[100dvh] w-full overflow-hidden bg-[#0F172A]">
      <AnimatedSpotlightHero />
    </main>
  )
}
