"use client"

import { useState } from "react"

/**
 * Shows Rakshit's photo from /public/rakshit.jpg.
 * If the file isn't there (yet), it gracefully falls back to an "RS" monogram,
 * so the layout never looks broken.
 *
 * To add the real photo: drop a square image at public/rakshit.jpg
 * (a ~600x600 headshot works great).
 */
export function ProfilePhoto({ className = "" }: { className?: string }) {
  const [failed, setFailed] = useState(false)
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ""

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-foreground/20 bg-foreground/10 backdrop-blur-md ${className}`}
    >
      {!failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`${basePath}/rakshit.jpg`}
          alt="Rakshit Sinha"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-sky-500/30 to-amber-500/20">
          <span className="font-sans text-4xl font-light tracking-tight text-foreground md:text-5xl">RS</span>
        </div>
      )}
      {/* subtle ring glow */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10" />
    </div>
  )
}
