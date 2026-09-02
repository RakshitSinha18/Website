"use client"

import Link from "next/link"
import { ArrowRight, UserPlus, CreditCard, MonitorPlay } from "lucide-react"

/**
 * "Who this is for" + "How it works" — qualification and process, the two
 * trust sections high-converting mentor pages share. Everything here describes
 * real product behaviour (portal signup, Razorpay confirmation, Meet sessions,
 * materials/flashcards in the portal) — keep it that way when editing.
 */

const AUDIENCES = [
  {
    label: "Switching into data",
    detail:
      "Coming from any background and starting from scratch — begin with Excel and SQL foundations and build toward your first analyst role.",
  },
  {
    label: "Working analysts levelling up",
    detail:
      "Already shipping reports and ready to go deeper on Power BI, Tableau and T-SQL — including the judgment calls behind tool choices.",
  },
  {
    label: "Students & fresh graduates",
    detail:
      "Building interview confidence and a portfolio that shows real work — with practice decks and honest feedback along the way.",
  },
]

const STEPS = [
  {
    Icon: UserPlus,
    title: "Create a free account",
    detail: "Pick a course and request an evening slot that fits your week.",
  },
  {
    Icon: CreditCard,
    title: "Confirm your seat",
    detail: "Pay securely by UPI or card — your booking confirms automatically.",
  },
  {
    Icon: MonitorPlay,
    title: "Learn & practice",
    detail: "Join on Google Meet. Lessons, materials and flashcards stay with you in the portal.",
  },
]

export function MentoringPath({ className = "" }: { className?: string }) {
  return (
    <div className={className}>
      {/* Who this is for — the right visitor should feel seen. */}
      <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.2em] text-foreground/50 md:text-xs">
        Who this is for
      </p>
      <div className="grid gap-3 md:grid-cols-3">
        {AUDIENCES.map((a) => (
          <div
            key={a.label}
            className="rounded-2xl border border-foreground/15 bg-foreground/5 p-4 backdrop-blur-md transition-colors hover:border-foreground/30 md:p-5"
          >
            <h3 className="mb-1.5 font-sans text-base font-medium text-foreground">{a.label}</h3>
            <p className="text-sm leading-relaxed text-foreground/70">{a.detail}</p>
          </div>
        ))}
      </div>

      {/* How it works — three concrete steps, no mystery before the first session. */}
      <p className="mb-4 mt-8 font-mono text-[11px] uppercase tracking-[0.2em] text-foreground/50 md:mt-10 md:text-xs">
        How it works
      </p>
      <ol className="grid gap-3 md:grid-cols-3">
        {STEPS.map((s, i) => (
          <li
            key={s.title}
            className="relative rounded-2xl border border-foreground/15 bg-foreground/5 p-4 backdrop-blur-md md:p-5"
          >
            <div className="mb-2 flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-foreground/20 bg-foreground/10">
                <s.Icon className="h-4 w-4 text-foreground/90" />
              </span>
              <span className="font-mono text-xs text-foreground/50">Step {i + 1}</span>
            </div>
            <h3 className="mb-1 font-sans text-base font-medium text-foreground">{s.title}</h3>
            <p className="text-sm leading-relaxed text-foreground/70">{s.detail}</p>
          </li>
        ))}
      </ol>

      {/* The one CTA this page repeats. */}
      <div className="mt-8 flex flex-col items-center gap-2 md:mt-10">
        <Link
          href="/login/"
          className="inline-flex items-center gap-2 rounded-full bg-foreground/95 px-6 py-3 font-sans text-sm font-medium text-background transition-all hover:-translate-y-0.5 hover:bg-foreground"
        >
          Book your first session <ArrowRight className="h-4 w-4" />
        </Link>
        <p className="font-mono text-[11px] text-foreground/50">
          Free account · evening slots · pay only when you book
        </p>
      </div>
    </div>
  )
}
