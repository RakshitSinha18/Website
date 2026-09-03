"use client"

import { useState } from "react"

/**
 * Shows Rakshit's photo from /public/rakshit.jpg.
 *
 * The brand monogram renders as the BASE layer and the photo fades in over it
 * once loaded — so a missing or slow photo never flashes a broken image.
 *
 * To add the real photo: drop a square image at public/rakshit.jpg
 * (a ~600x600 headshot works great).
 */
export function ProfilePhoto({ className = "" }: { className?: string }) {
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ""

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-foreground/20 bg-foreground/10 backdrop-blur-md ${className}`}
    >
      {/* Monogram base — matches the brand tile (serif RS, sky→amber). */}
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-sky-500/25 to-amber-500/15">
        <span className="bg-gradient-to-br from-sky-300 to-amber-300 bg-clip-text font-serif text-4xl font-bold tracking-tight text-transparent md:text-5xl">
          RS
        </span>
      </div>
      {!failed && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`${basePath}/rakshit.jpg`}
          alt="Rakshit Sinha"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
        />
      )}
      {/* subtle ring glow — inherits the container's corner radius */}
      <div className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-white/10" />
    </div>
  )
}
