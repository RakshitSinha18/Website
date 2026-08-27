"use client"

import { Download, FileSpreadsheet, Table2, ArrowUpRight } from "lucide-react"

/**
 * Free, downloadable resources — the starter dataset and the Advanced Excel
 * KPI/matrix workbook I use to teach. Small gestures that make the site useful.
 */
export function ResourceCard({ className = "" }: { className?: string }) {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ""
  const csv = `${basePath}/data-slice-and-dice-template.csv`
  const guide = `${basePath}/data-slice-and-dice-guide.md`
  const xlsx = `${basePath}/advanced-excel-kpi-matrix-demo.xlsx`

  return (
    <div className={`grid gap-3 sm:grid-cols-2 ${className}`}>
      {/* Resource 1 — tidy dataset (all tools) */}
      <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#0d1526]/60 p-5 backdrop-blur-md transition-colors hover:border-foreground/25">
        <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br from-sky-500/20 to-emerald-500/10 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />
        <div className="relative">
          <div className="mb-2 flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-400/15 text-sky-300">
              <Table2 className="h-[18px] w-[18px]" />
            </span>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-foreground/40">Free resource</p>
              <p className="font-sans text-sm font-light text-foreground md:text-base">Slice &amp; dice dataset</p>
            </div>
          </div>
          <p className="mb-4 text-xs leading-relaxed text-foreground/60 md:text-sm">
            A tidy, pivot-ready sample dataset (600 rows · dimensions + measures) — the exact shape I aim for before
            building anything. Works in Excel, Power BI, Tableau or SQL.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={csv}
              download
              className="inline-flex items-center gap-2 rounded-full bg-foreground/95 px-4 py-2 text-sm font-medium text-background transition-all hover:-translate-y-0.5 hover:bg-foreground"
            >
              <Download className="h-4 w-4" /> CSV
            </a>
            <a
              href={guide}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-sans text-sm text-foreground/70 underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              How to use it <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Resource 2 — Advanced Excel KPI / matrix workbook */}
      <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#0d1526]/60 p-5 backdrop-blur-md transition-colors hover:border-foreground/25">
        <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br from-emerald-500/20 to-amber-500/10 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />
        <div className="relative">
          <div className="mb-2 flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-400/15 text-emerald-300">
              <FileSpreadsheet className="h-[18px] w-[18px]" />
            </span>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-foreground/40">Free workbook</p>
              <p className="font-sans text-sm font-light text-foreground md:text-base">Advanced Excel: KPIs &amp; matrix</p>
            </div>
          </div>
          <p className="mb-4 text-xs leading-relaxed text-foreground/60 md:text-sm">
            A worked <span className="text-foreground/80">.xlsx</span> showing how a KPI dashboard (target vs actual,
            variance, RAG status), a SUMIFS matrix and a PivotTable actually work — with a formula cheat-sheet. Live
            formulas, not screenshots.
          </p>
          <a
            href={xlsx}
            download
            className="inline-flex items-center gap-2 rounded-full bg-foreground/95 px-4 py-2 text-sm font-medium text-background transition-all hover:-translate-y-0.5 hover:bg-foreground"
          >
            <Download className="h-4 w-4" /> Download workbook
          </a>
        </div>
      </div>
    </div>
  )
}
