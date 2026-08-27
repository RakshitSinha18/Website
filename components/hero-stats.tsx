"use client"

import { useEffect, useState } from "react"
import { useCountUp } from "@/hooks/use-count-up"

/**
 * A compact, counting stat ticker for the hero — "9+ yrs · 100+ dashboards ·
 * 7 companies". Numbers tally up on load for a touch of life and instant
 * credibility, then sit still. Reduced-motion aware via useCountUp.
 */
const STATS: { value: number; suffix?: string; label: string }[] = [
  { value: 9, suffix: "+", label: "years" },
  { value: 100, suffix: "+", label: "dashboards" },
  { value: 7, label: "companies" },
]

function Stat({ value, suffix, label, active }: { value: number; suffix?: string; label: string; active: boolean }) {
  const n = useCountUp(value, active, 1600)
  return (
    <span className="inline-flex items-baseline gap-1">
      <span className="font-sans text-base font-normal tabular-nums text-foreground md:text-lg">
        {n}
        {suffix}
      </span>
      <span className="font-mono text-[10px] uppercase tracking-wider text-foreground/45 md:text-xs">{label}</span>
    </span>
  )
}

export function HeroStats({ className = "" }: { className?: string }) {
  const [active, setActive] = useState(false)
  useEffect(() => setActive(true), [])

  return (
    <div className={`flex flex-wrap items-center gap-x-4 gap-y-1.5 ${className}`}>
      {STATS.map((s, i) => (
        <span key={s.label} className="inline-flex items-center gap-4">
          <Stat {...s} active={active} />
          {i < STATS.length - 1 && <span className="text-foreground/20">·</span>}
        </span>
      ))}
    </div>
  )
}
