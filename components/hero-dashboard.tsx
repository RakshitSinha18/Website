"use client"

import { useEffect, useState } from "react"
import { useReducedMotion } from "framer-motion"
import { TrendingUp, Activity, Users } from "lucide-react"
import { useCountUp } from "@/hooks/use-count-up"

/**
 * A small, self-animating "mini BI dashboard" for the hero — on-brand signal
 * that Rakshit builds dashboards. Counts KPIs up, draws a line chart, fills
 * mini bars. Purely decorative, fully reduced-motion aware, and cheap (SVG +
 * one rAF count-up hook), so it stays out of the way of the hero content.
 */

// A gentle, believable revenue-ish series (normalised 0–100).
const SERIES = [22, 30, 26, 44, 40, 58, 52, 70, 66, 82, 88, 96]
const BARS = [40, 62, 48, 78, 90]

function useMounted() {
  const [m, setM] = useState(false)
  useEffect(() => setM(true), [])
  return m
}

function KpiStat({
  icon,
  label,
  value,
  suffix,
  prefix = "",
  accent,
  active,
}: {
  icon: React.ReactNode
  label: string
  value: number
  suffix?: string
  prefix?: string
  accent: string
  active: boolean
}) {
  const n = useCountUp(value, active, 1600)
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
      <div className="mb-1 flex items-center gap-1.5">
        <span style={{ color: accent }}>{icon}</span>
        <span className="font-mono text-[9px] uppercase tracking-wider text-foreground/40">{label}</span>
      </div>
      <div className="font-sans text-lg font-light tabular-nums text-foreground md:text-xl">
        {prefix}
        {n}
        {suffix}
      </div>
    </div>
  )
}

function LineChart({ active, reduce }: { active: boolean; reduce: boolean }) {
  const w = 260
  const h = 70
  const max = Math.max(...SERIES)
  const pts = SERIES.map((v, i) => {
    const x = (i / (SERIES.length - 1)) * w
    const y = h - (v / max) * (h - 8) - 4
    return [x, y] as const
  })
  const line = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ")
  const area = `${line} L${w},${h} L0,${h} Z`
  const lastPt = pts[pts.length - 1]

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-[70px] w-full" preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id="heroArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="heroLine" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#7dd3fc" />
          <stop offset="100%" stopColor="#fcd34d" />
        </linearGradient>
      </defs>
      {/* area fill */}
      <path d={area} fill="url(#heroArea)" opacity={active ? 1 : 0} style={{ transition: "opacity 700ms 600ms" }} />
      {/* the line draws itself via stroke-dashoffset */}
      <path
        d={line}
        fill="none"
        stroke="url(#heroLine)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={
          reduce
            ? undefined
            : {
                strokeDasharray: 600,
                strokeDashoffset: active ? 0 : 600,
                transition: "stroke-dashoffset 1600ms cubic-bezier(0.4,0,0.2,1)",
              }
        }
      />
      {/* moving head dot */}
      <circle
        cx={lastPt[0]}
        cy={lastPt[1]}
        r="3"
        fill="#fcd34d"
        opacity={active ? 1 : 0}
        style={{ transition: "opacity 400ms 1500ms" }}
      >
        {!reduce && active && (
          <animate attributeName="r" values="3;5;3" dur="2s" repeatCount="indefinite" />
        )}
      </circle>
    </svg>
  )
}

export function HeroDashboard({ className = "" }: { className?: string }) {
  const reduce = !!useReducedMotion()
  const mounted = useMounted()
  const active = mounted // start animating as soon as it mounts on the client

  return (
    <div
      className={`w-full max-w-sm rounded-2xl border border-white/10 bg-[#0d1526]/70 p-4 shadow-2xl backdrop-blur-xl ${className}`}
      aria-hidden
    >
      {/* faux window chrome */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-red-400/70" />
          <span className="h-2 w-2 rounded-full bg-amber-400/70" />
          <span className="h-2 w-2 rounded-full bg-emerald-400/70" />
        </div>
        <span className="font-mono text-[9px] uppercase tracking-wider text-foreground/35">Live · demo</span>
      </div>

      {/* KPI row */}
      <div className="mb-3 grid grid-cols-3 gap-2">
        <KpiStat icon={<TrendingUp className="h-3 w-3" />} label="Revenue" value={24} suffix="%" prefix="↑" accent="#38bdf8" active={active} />
        <KpiStat icon={<Activity className="h-3 w-3" />} label="Margin" value={68} suffix="%" accent="#fcd34d" active={active} />
        <KpiStat icon={<Users className="h-3 w-3" />} label="Users" value={9} suffix="k" accent="#34d399" active={active} />
      </div>

      {/* line chart */}
      <div className="mb-3 rounded-xl border border-white/10 bg-white/[0.02] p-2.5">
        <div className="mb-1 flex items-center justify-between">
          <span className="font-mono text-[9px] uppercase tracking-wider text-foreground/40">Revenue trend</span>
          <span className="font-mono text-[9px] text-emerald-300/80">▲ trending up</span>
        </div>
        <LineChart active={active} reduce={reduce} />
      </div>

      {/* mini bars */}
      <div className="flex items-end justify-between gap-1.5">
        {BARS.map((v, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex h-10 w-full items-end overflow-hidden rounded-sm bg-white/[0.04]">
              <div
                className="w-full rounded-sm bg-gradient-to-t from-sky-500/70 to-amber-300/70"
                style={{
                  height: active ? `${v}%` : "0%",
                  transition: reduce ? undefined : `height 900ms cubic-bezier(0.4,0,0.2,1) ${300 + i * 100}ms`,
                }}
              />
            </div>
            <span className="font-mono text-[8px] text-foreground/30">Q{i + 1}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
