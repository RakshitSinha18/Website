"use client"

import { useRef, useState } from "react"
import { ChevronDown } from "lucide-react"
import { motion, useScroll, useTransform, useReducedMotion, useInView } from "framer-motion"
import { SectionKicker } from "@/components/section-kicker"

// Case notes (challenge → approach → outcome) stay qualitative on purpose —
// EDIT: swap in real numbers (users, refresh times, adoption) where you can share them.
interface CaseStudy {
  challenge: string
  approach: string
  outcome: string
}

const EXPERIENCE: {
  number: string
  role: string
  company: string
  detail: string
  year: string
  tags: string[]
  caseStudy?: CaseStudy
}[] = [
  {
    number: "01",
    role: "Senior Business Intelligence Consultant",
    company: "IBM",
    detail: "Designing and delivering enterprise BI solutions — turning complex datasets into actionable insights and dashboards that support strategic business decisions.",
    year: "Present",
    tags: ["Enterprise BI", "Tableau", "Strategy"],
  },
  {
    number: "02",
    role: "Senior Consultant",
    company: "CRG Solutions · IDFC First Bank",
    detail: "Built and supported Tableau dashboards for CSAT, NPS, resolution time & ticket volume; led a team of 4+ consultants and upheld regulatory-grade data accuracy.",
    year: "2024",
    tags: ["Tableau", "Team Lead", "Banking"],
    caseStudy: {
      challenge:
        "A retail bank needed daily visibility into customer-service health — CSAT, NPS, resolution time and ticket volume — with numbers accurate enough to stand up to regulatory scrutiny.",
      approach:
        "Standardised metric definitions across teams, built the dashboards on governed Tableau extracts, and led a 4+ consultant delivery team with a review gate on every release.",
      outcome:
        "Service leaders read CSAT and NPS movements from the dashboard instead of waiting on analyst pulls — it became part of the daily operating review.",
    },
  },
  {
    number: "03",
    role: "BI Developer",
    company: "CRG Solutions · Zee Entertainment",
    detail: "Delivered Tableau & Power BI dashboards across Sales, HR and OTT — with row/user-level security, automated subscriptions and insight into engagement, CTR & churn.",
    year: "2021 — 2024",
    tags: ["Power BI", "Tableau", "OTT Analytics"],
    caseStudy: {
      challenge:
        "Sales, HR and OTT teams each needed self-serve reporting on very different data — streaming engagement, CTR and churn on one side, targets and headcount on the other — without one team ever seeing another's numbers.",
      approach:
        "Delivered Tableau and Power BI dashboards with row- and user-level security baked into the model, plus automated subscriptions so the right slice landed in each inbox on schedule.",
      outcome:
        "Reporting shifted from ad-hoc analyst requests to subscribed, self-serve dashboards across three business functions.",
    },
  },
  {
    number: "04",
    role: "Marketing Data Analyst",
    company: "Qiagen Digital",
    detail: "Built Tableau dashboards for marketing & sales KPIs including ROI and funnel metrics, surfacing business risks and opportunities through KPI monitoring.",
    year: "2020 — 2021",
    tags: ["Marketing KPIs", "ROI", "Funnels"],
    caseStudy: {
      challenge:
        "Marketing spend was tracked channel by channel, with no single view of ROI or where the funnel actually leaked.",
      approach:
        "Built Tableau dashboards that put ROI, funnel-stage conversion and sales KPIs side by side, with monitoring that flagged KPI drift as it happened.",
      outcome:
        "Risks and opportunities surfaced from KPI movement week to week — not at quarter-end reviews.",
    },
  },
  {
    number: "05",
    role: "Data Analyst",
    company: "360 Nautica",
    detail: "Prepared structured datasets, visualized audience trends from box-office and streaming data, and trained internal users on Tableau.",
    year: "2019 — 2020",
    tags: ["Data Prep", "Training", "Media"],
  },
]

export function WorkSection() {
  const reduce = useReducedMotion()
  const containerRef = useRef<HTMLDivElement>(null)
  // Fill the timeline line as the section scrolls through the viewport.
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 80%", "end 60%"],
  })
  const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"])
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section className="flex min-h-[100dvh] w-full items-center px-5 py-24 md:px-12 lg:px-16">
      <div className="mx-auto w-full max-w-5xl">
        <motion.div
          initial={reduce ? false : { opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ type: "spring", stiffness: 90, damping: 18 }}
          className="mb-10 md:mb-14"
        >
          <SectionKicker number="01" label="Experience" />
          <h2 className="mb-2 font-sans text-5xl font-light tracking-tight text-foreground md:text-6xl lg:text-7xl">
            Nine years, one craft
          </h2>
          <p className="font-mono text-sm text-foreground/60 md:text-base">
            / 9+ years across banking, media &amp; analytics · tap a role to expand
          </p>
        </motion.div>

        {/* Timeline */}
        <div ref={containerRef} className="relative pl-8 md:pl-12">
          {/* Track (dim) */}
          <div className="absolute left-[11px] top-1 h-full w-px bg-white/10 md:left-[15px]" />
          {/* Progress fill (sky→amber), grows with scroll */}
          <motion.div
            className="absolute left-[11px] top-1 w-px bg-gradient-to-b from-sky-400 to-amber-400 md:left-[15px]"
            style={{ height: reduce ? "100%" : lineHeight }}
          />

          <div className="space-y-4 md:space-y-5">
            {EXPERIENCE.map((role, i) => (
              <TimelineRole
                key={i}
                role={role}
                index={i}
                open={openIndex === i}
                onToggle={() => setOpenIndex(openIndex === i ? null : i)}
                reduce={!!reduce}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function TimelineRole({
  role,
  index,
  open,
  onToggle,
  reduce,
}: {
  role: (typeof EXPERIENCE)[number]
  index: number
  open: boolean
  onToggle: () => void
  reduce: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.4 })

  return (
    <motion.div
      ref={ref}
      initial={reduce ? false : { opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ type: "spring", stiffness: 120, damping: 18, delay: index * 0.06 }}
      className="relative"
    >
      {/* Dot on the line */}
      <motion.span
        className={`absolute -left-8 top-3.5 flex h-[22px] w-[22px] items-center justify-center rounded-full border-2 md:-left-12 ${
          open ? "border-amber-400 bg-amber-400/20" : "border-sky-400/70 bg-[#0b0f19]"
        }`}
        initial={reduce ? false : { scale: 0 }}
        animate={inView ? { scale: 1 } : {}}
        transition={{ type: "spring", stiffness: 300, damping: 15, delay: index * 0.06 + 0.1 }}
      >
        <span className={`h-2 w-2 rounded-full ${open ? "bg-amber-300" : "bg-sky-400"}`} />
      </motion.span>

      {/* Year marker */}
      <span className="mb-1 block font-mono text-[11px] text-amber-300/70 md:text-xs">{role.year}</span>

      <div
        className={`overflow-hidden rounded-xl border transition-colors ${
          open ? "border-amber-400/25 bg-[#0d1526]/70" : "border-white/10 bg-[#0d1526]/40 hover:border-foreground/25"
        }`}
      >
        <button
          onClick={onToggle}
          aria-expanded={open}
          className="group flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left md:px-5 md:py-4"
        >
          <div className="flex items-center gap-4 md:gap-5">
            <span className={`font-mono text-sm transition-colors md:text-base ${open ? "text-amber-300/80" : "text-foreground/30 group-hover:text-foreground/50"}`}>
              {role.number}
            </span>
            <div>
              <h3 className="font-sans text-lg font-light text-foreground md:text-2xl">{role.role}</h3>
              <p className="font-mono text-xs text-foreground/60 md:text-sm">{role.company}</p>
            </div>
          </div>
          <ChevronDown className={`h-4 w-4 shrink-0 text-foreground/50 transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
        </button>

        <div className="grid transition-all duration-500 ease-out" style={{ gridTemplateRows: open ? "1fr" : "0fr" }}>
          <div className="overflow-hidden">
            <div className="px-4 pb-4 pl-11 md:px-5 md:pb-5 md:pl-16">
              <p className="max-w-2xl text-sm leading-relaxed text-foreground/75 md:text-base">{role.detail}</p>

              {/* Case notes — how this engagement actually played out. */}
              {role.caseStudy && (
                <div className="mt-4 grid max-w-2xl gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-3.5 md:grid-cols-3 md:gap-4">
                  {(
                    [
                      ["Challenge", role.caseStudy.challenge],
                      ["Approach", role.caseStudy.approach],
                      ["Outcome", role.caseStudy.outcome],
                    ] as const
                  ).map(([label, text]) => (
                    <div key={label}>
                      <p className="mb-1 font-mono text-[10px] uppercase tracking-wider text-amber-300/70">
                        {label}
                      </p>
                      <p className="text-xs leading-relaxed text-foreground/70">{text}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-3 flex flex-wrap gap-1.5">
                {role.tags.map((t) => (
                  <span key={t} className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 font-mono text-[10px] text-foreground/60">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
