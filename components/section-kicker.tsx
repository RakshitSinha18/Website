/**
 * Editorial section kicker — a small numbered label that sits above a section
 * heading, e.g.  "01 —— Experience".  Gives the page a consistent, magazine-like
 * rhythm across sections. Server-safe (no client hooks).
 */
export function SectionKicker({ number, label }: { number: string; label: string }) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <span className="font-mono text-xs tabular-nums text-foreground/40">{number}</span>
      <span className="h-px w-8 bg-foreground/20" />
      <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-foreground/55">{label}</span>
    </div>
  )
}
