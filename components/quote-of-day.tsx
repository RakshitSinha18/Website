"use client"

import { useEffect, useState } from "react"
import { Quote as QuoteIcon } from "lucide-react"
import { quoteOfTheDay, type Quote } from "@/lib/quotes"

/**
 * "Quote of the day" — shows a rotating daily quote, led by Bruce Lee's
 * "be like water" (learn and adapt to the shape you're put into).
 * Computed client-side so it always reflects the viewer's current day.
 */
export function QuoteOfDay({ className = "" }: { className?: string }) {
  const [quote, setQuote] = useState<Quote | null>(null)

  useEffect(() => {
    setQuote(quoteOfTheDay())
  }, [])

  if (!quote) return null

  return (
    <figure
      className={`relative overflow-hidden rounded-2xl border border-white/10 bg-[#0d1526]/70 p-5 backdrop-blur-md md:p-6 ${className}`}
    >
      {/* soft liquid accent */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br from-sky-500/30 to-transparent blur-2xl" />
      <div className="relative">
        <div className="mb-2 flex items-center gap-2">
          <QuoteIcon className="h-4 w-4 text-sky-300" />
          <span className="font-mono text-[10px] uppercase tracking-wide text-foreground/50">Quote of the day</span>
        </div>
        <blockquote className="text-pretty text-sm leading-relaxed text-foreground/90 md:text-base">
          “{quote.text}”
        </blockquote>
        <figcaption className="mt-2 font-mono text-xs text-foreground/60">— {quote.author}</figcaption>
      </div>
    </figure>
  )
}
