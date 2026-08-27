"use client"

import { useEffect, useRef, useState } from "react"
import { useReducedMotion } from "framer-motion"
import { TrendingUp, Activity, Users, RefreshCw } from "lucide-react"
import { useCountUp } from "@/hooks/use-count-up"

/**
 * A small, self-animating "mini BI dashboard" for the hero — on-brand signal
 * that Rakshit builds dashboards. It counts KPIs up, draws a line chart, and
 * fills mini bars, then quietly *auto-refreshes* every few seconds (a brief
 * "Refreshing…" state, then new numbers re-animate) so it feels like a live
 * report. Purely decorative, fully reduced-motion aware (no auto-cycle), and
 * cheap (SVG + rAF count-up), so it stays out of the way of the hero content.
 */

// A few believable "snapshots" the dashboard cycles through on refresh.
interface Snapshot {
  revenue: number
  margin: number
  users: number
  series: number[]
  bars: number[]
  trendUp: boolean
}

const SNAPSHOTS: Snapshot[] = [
  { revenue: 24, margin: 68, users: 9, series: [22, 30, 26, 44, 40, 58, 52, 70, 66, 82, 88, 96], bars: [40, 62, 48, 78, 90], trendUp: true },
  { revenue: 18, margin: 71, users: 11, series: [30, 34, 42, 38, 52, 48, 60, 64, 72, 70, 84, 92], bars: [52, 44, 70, 66, 88], trendUp: true },
  { revenue: 31, margin: 64, users: 8, series: [18, 26, 24, 36, 46, 42, 56, 62, 60, 74, 80, 90], bars: [36, 58, 54, 82, 76], trendUp: true },
]

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
  cycle,
}: {
  icon: React.ReactNode
  label: string
  value: number
  suffix?: string
  prefix?: string
  accent: string
  active: boolean
  cycle: number
}) {
  // Re-mounting via `key={cycle}` (in the parent) restarts the count-up, so the
  // number visibly re-tallies to the new value on each refresh.
  const n = useCountUp(value, active, 1200)
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

function LineChart({ series, active, reduce, cycle }: { series: number[]; active: boolean; reduce: boolean; cycle: number }) {
  const w = 260
  const h = 70
  const max = Math.max(...series)
  const pts = series.map((v, i) => {
    const x = (i / (series.length - 1)) * w
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
      {/* area fill — the path morphs smoothly between snapshots */}
      <path
        d={area}
        fill="url(#heroArea)"
        opacity={active ? 1 : 0}
        style={{ transition: "opacity 700ms 400ms, d 800ms cubic-bezier(0.4,0,0.2,1)" }}
      />
      {/* the line: draws itself on first paint, then morphs on refresh */}
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
            : cycle === 0
              ? {
                  strokeDasharray: 600,
                  strokeDashoffset: active ? 0 : 600,
                  transition: "stroke-dashoffset 1600ms cubic-bezier(0.4,0,0.2,1)",
                }
              : { transition: "d 800ms cubic-bezier(0.4,0,0.2,1)" }
        }
      />
      {/* moving head dot */}
      <circle
        cx={lastPt[0]}
        cy={lastPt[1]}
        r="3"
        fill="#fcd34d"
        opacity={active ? 1 : 0}
        style={{ transition: "opacity 400ms 900ms, cx 800ms cubic-bezier(0.4,0,0.2,1), cy 800ms cubic-bezier(0.4,0,0.2,1)" }}
      >
        {!reduce && active && <animate attributeName="r" values="3;5;3" dur="2s" repeatCount="indefinite" />}
      </circle>
    </svg>
  )
}

export function HeroDashboard({ className = "" }: { className?: string }) {
  const reduce = !!useReducedMotion()
  const mounted = useMounted()
  const active = mounted

  const [cycle, setCycle] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  // Auto-refresh loop: every ~7s show "Refreshing…" briefly, then advance the
  // snapshot so KPIs/chart/bars re-animate. Disabled under reduced motion.
  useEffect(() => {
    if (!mounted || reduce) return
    let stopped = false

    const schedule = () => {
      const t1 = setTimeout(() => {
        if (stopped) return
        setRefreshing(true)
        const t2 = setTimeout(() => {
          if (stopped) return
          setCycle((c) => c + 1)
          setRefreshing(false)
          schedule()
        }, 650) // "refreshing" pause before new data lands
        timers.current.push(t2)
      }, 7000)
      timers.current.push(t1)
    }
    schedule()

    return () => {
      stopped = true
      timers.current.forEach(clearTimeout)
      timers.current = []
    }
  }, [mounted, reduce])

  const snap = SNAPSHOTS[cycle % SNAPSHOTS.length]

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
        <span className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-foreground/35">
          <RefreshCw className={`h-2.5 w-2.5 ${refreshing ? "animate-spin text-sky-300/80" : ""}`} />
          {refreshing ? "Refreshing…" : "Live"}
        </span>
      </div>

      {/* content dims briefly while "refreshing" for a real data-load feel */}
      <div className="transition-opacity duration-300" style={{ opacity: refreshing ? 0.45 : 1 }}>
        {/* KPI row — key={cycle} restarts the count-up on each refresh */}
        <div className="mb-3 grid grid-cols-3 gap-2">
          <KpiStat key={`rev-${cycle}`} cycle={cycle} icon={<TrendingUp className="h-3 w-3" />} label="Revenue" value={snap.revenue} suffix="%" prefix="↑" accent="#38bdf8" active={active} />
          <KpiStat key={`mar-${cycle}`} cycle={cycle} icon={<Activity className="h-3 w-3" />} label="Margin" value={snap.margin} suffix="%" accent="#fcd34d" active={active} />
          <KpiStat key={`usr-${cycle}`} cycle={cycle} icon={<Users className="h-3 w-3" />} label="Users" value={snap.users} suffix="k" accent="#34d399" active={active} />
        </div>

        {/* line chart */}
        <div className="mb-3 rounded-xl border border-white/10 bg-white/[0.02] p-2.5">
          <div className="mb-1 flex items-center justify-between">
            <span className="font-mono text-[9px] uppercase tracking-wider text-foreground/40">Revenue trend</span>
            <span className="font-mono text-[9px] text-emerald-300/80">▲ trending up</span>
          </div>
          <LineChart series={snap.series} active={active} reduce={reduce} cycle={cycle} />
        </div>

        {/* mini bars */}
        <div className="flex items-end justify-between gap-1.5">
          {snap.bars.map((v, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <div className="flex h-10 w-full items-end overflow-hidden rounded-sm bg-white/[0.04]">
                <div
                  className="w-full rounded-sm bg-gradient-to-t from-sky-500/70 to-amber-300/70"
                  style={{
                    height: active ? `${v}%` : "0%",
                    transition: reduce
                      ? undefined
                      : `height 800ms cubic-bezier(0.4,0,0.2,1) ${cycle === 0 ? 300 + i * 100 : i * 60}ms`,
                  }}
                />
              </div>
              <span className="font-mono text-[8px] text-foreground/30">Q{i + 1}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
