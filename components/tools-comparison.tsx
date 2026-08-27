"use client"

import { useState } from "react"
import { Check, Minus } from "lucide-react"

/**
 * "Which tool, when?" — a practitioner's comparison of the three tools a
 * business-analytics professional reaches for most: Power BI, Tableau and
 * Advanced Excel. Written from real day-to-day judgment, not marketing.
 *
 * Rated on a simple 0–3 scale so readers can compare at a glance; the notes
 * explain the *why*, which is where the real value is.
 */

type Score = 0 | 1 | 2 | 3

interface Row {
  capability: string
  note: string
  powerbi: Score
  tableau: Score
  excel: Score
}

const TOOLS = [
  { key: "powerbi", name: "Power BI", accent: "#f59e0b" },
  { key: "tableau", name: "Tableau", accent: "#38bdf8" },
  { key: "excel", name: "Advanced Excel", accent: "#34d399" },
] as const

const ROWS: Row[] = [
  {
    capability: "Handling large / modelled data",
    note: "Millions of rows, star schemas, a single source of truth.",
    powerbi: 3,
    tableau: 3,
    excel: 1,
  },
  {
    capability: "Ad-hoc slice & dice",
    note: "Grab a file, pivot it, answer a question in five minutes.",
    powerbi: 2,
    tableau: 2,
    excel: 3,
  },
  {
    capability: "Interactive dashboards",
    note: "Filters, drill-downs, and visuals a business actually uses.",
    powerbi: 3,
    tableau: 3,
    excel: 1,
  },
  {
    capability: "Visual polish & storytelling",
    note: "Where design nuance changes whether a chart lands.",
    powerbi: 2,
    tableau: 3,
    excel: 1,
  },
  {
    capability: "Calculation depth",
    note: "DAX / LOD / array formulas for the hard questions.",
    powerbi: 3,
    tableau: 3,
    excel: 2,
  },
  {
    capability: "Governance & sharing at scale",
    note: "Row-level security, scheduled refresh, org-wide publishing.",
    powerbi: 3,
    tableau: 3,
    excel: 1,
  },
  {
    capability: "Everyone already has it",
    note: "Zero setup, zero licence friction, universal file format.",
    powerbi: 1,
    tableau: 1,
    excel: 3,
  },
]

// When to reach for each — the one-liner a mentor actually gives.
const VERDICTS: Record<string, { when: string }> = {
  powerbi: { when: "Governed, refreshable reporting across an org — modelling + DAX at scale." },
  tableau: { when: "Exploratory analysis and dashboards where visual craft matters most." },
  excel: { when: "Fast, ad-hoc analysis and prototyping — the analyst's everyday power tool." },
}

function ScoreDots({ score, accent }: { score: Score; accent: string }) {
  return (
    <div className="flex items-center justify-center gap-1" aria-label={`${score} of 3`}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full transition-colors"
          style={{ background: i < score ? accent : "rgba(255,255,255,0.14)" }}
        />
      ))}
    </div>
  )
}

export function ToolsComparison() {
  const [highlight, setHighlight] = useState<string | null>(null)

  return (
    <div className="rounded-3xl border border-white/10 bg-[#0d1526]/60 p-5 backdrop-blur-xl md:p-7">
      <div className="mb-5 md:mb-6">
        <p className="mb-1 font-mono text-[11px] uppercase tracking-wider text-foreground/40">
          A practitioner&apos;s take
        </p>
        <h3 className="font-sans text-2xl font-light tracking-tight text-foreground md:text-3xl">
          Which tool, when?
        </h3>
        <p className="mt-1 max-w-xl text-sm text-foreground/60">
          Power BI, Tableau and Advanced Excel all overlap — the skill is knowing which one a problem actually calls
          for. Here&apos;s how I choose.
        </p>
      </div>

      {/* Header row */}
      <div className="grid grid-cols-[1.6fr_repeat(3,1fr)] items-end gap-2 border-b border-white/10 pb-3">
        <span className="font-mono text-[10px] uppercase tracking-wider text-foreground/40">Capability</span>
        {TOOLS.map((t) => (
          <button
            key={t.key}
            onMouseEnter={() => setHighlight(t.key)}
            onMouseLeave={() => setHighlight(null)}
            onFocus={() => setHighlight(t.key)}
            onBlur={() => setHighlight(null)}
            className="flex flex-col items-center gap-1 rounded-lg px-1 py-1 text-center transition-colors"
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: t.accent, boxShadow: `0 0 12px ${t.accent}66` }}
            />
            <span
              className="text-[11px] font-medium leading-tight text-foreground/80 md:text-xs"
              style={{ color: highlight === t.key ? t.accent : undefined }}
            >
              {t.name}
            </span>
          </button>
        ))}
      </div>

      {/* Rows */}
      <div className="divide-y divide-white/5">
        {ROWS.map((row) => (
          <div key={row.capability} className="grid grid-cols-[1.6fr_repeat(3,1fr)] items-center gap-2 py-3">
            <div className="pr-2">
              <p className="text-sm text-foreground/90">{row.capability}</p>
              <p className="mt-0.5 hidden text-xs leading-snug text-foreground/45 sm:block">{row.note}</p>
            </div>
            {TOOLS.map((t) => {
              const score = row[t.key as keyof Row] as Score
              const dimmed = highlight !== null && highlight !== t.key
              return (
                <div
                  key={t.key}
                  className="flex items-center justify-center transition-opacity"
                  style={{ opacity: dimmed ? 0.3 : 1 }}
                >
                  {score === 0 ? (
                    <Minus className="h-3.5 w-3.5 text-foreground/25" />
                  ) : (
                    <ScoreDots score={score} accent={t.accent} />
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* Verdicts */}
      <div className="mt-5 grid gap-3 border-t border-white/10 pt-5 sm:grid-cols-3">
        {TOOLS.map((t) => (
          <div
            key={t.key}
            className="rounded-2xl border border-white/10 bg-white/[0.02] p-3.5"
            onMouseEnter={() => setHighlight(t.key)}
            onMouseLeave={() => setHighlight(null)}
          >
            <div className="mb-1.5 flex items-center gap-2">
              <Check className="h-3.5 w-3.5" style={{ color: t.accent }} />
              <span className="text-sm font-medium" style={{ color: t.accent }}>
                Reach for {t.name}
              </span>
            </div>
            <p className="text-xs leading-relaxed text-foreground/65">{VERDICTS[t.key].when}</p>
          </div>
        ))}
      </div>

      <p className="mt-4 text-xs italic leading-relaxed text-foreground/45">
        My honest rule: model and govern in Power BI or Tableau, but never underestimate Excel — it&apos;s still the
        fastest way to interrogate a fresh dataset before it earns a dashboard.
      </p>
    </div>
  )
}
