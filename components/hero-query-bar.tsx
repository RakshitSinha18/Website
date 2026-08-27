"use client"

import { useEffect, useRef, useState } from "react"
import { useReducedMotion } from "framer-motion"
import { Sparkles, CornerDownLeft } from "lucide-react"

/**
 * A faux "ask the data" query bar for the hero — sample analyst questions type
 * themselves and erase, hinting at the mindset behind the dashboards. Purely
 * decorative (not a real input). Reduced motion shows one static question.
 */
const QUESTIONS = [
  "show revenue by region this quarter",
  "which segment has the best margin?",
  "top 5 products by profit",
  "why did North dip in Q3?",
  "trend of active users, last 12 months",
]

export function HeroQueryBar({ className = "" }: { className?: string }) {
  const reduce = !!useReducedMotion()
  const [text, setText] = useState("")
  const [qIndex, setQIndex] = useState(0)
  const [phase, setPhase] = useState<"typing" | "pausing" | "deleting">("typing")
  const timer = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    if (reduce) {
      setText(QUESTIONS[0])
      return
    }
    const full = QUESTIONS[qIndex]
    let delay = 55

    if (phase === "typing") {
      if (text.length < full.length) {
        timer.current = setTimeout(() => setText(full.slice(0, text.length + 1)), delay)
      } else {
        setPhase("pausing")
      }
    } else if (phase === "pausing") {
      timer.current = setTimeout(() => setPhase("deleting"), 1600)
    } else {
      // deleting
      delay = 28
      if (text.length > 0) {
        timer.current = setTimeout(() => setText(full.slice(0, text.length - 1)), delay)
      } else {
        setQIndex((i) => (i + 1) % QUESTIONS.length)
        setPhase("typing")
      }
    }

    return () => clearTimeout(timer.current)
  }, [text, phase, qIndex, reduce])

  return (
    <div
      className={`group flex w-full max-w-md items-center gap-2 rounded-full border border-white/12 bg-[#0d1526]/60 px-4 py-2.5 backdrop-blur-md transition-colors hover:border-white/25 ${className}`}
      aria-hidden
    >
      <Sparkles className="h-4 w-4 shrink-0 text-sky-300/80" />
      <span className="min-w-0 flex-1 truncate font-mono text-xs text-foreground/75 md:text-sm">
        {text}
        {!reduce && (
          <span className="ml-0.5 inline-block h-3.5 w-px translate-y-0.5 animate-pulse bg-sky-300/80" />
        )}
      </span>
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-foreground/60 transition-colors group-hover:bg-white/15">
        <CornerDownLeft className="h-3 w-3" />
      </span>
    </div>
  )
}
