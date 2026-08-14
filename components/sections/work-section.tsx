"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { useReveal } from "@/hooks/use-reveal"

const EXPERIENCE = [
  {
    number: "01",
    role: "Senior Business Intelligence Consultant",
    company: "IBM",
    detail: "Designing and delivering enterprise BI solutions — turning complex datasets into actionable insights and dashboards that support strategic business decisions.",
    year: "Present",
    direction: "left",
  },
  {
    number: "02",
    role: "Senior Consultant",
    company: "CRG Solutions · IDFC First Bank",
    detail: "Built and supported Tableau dashboards for CSAT, NPS, resolution time & ticket volume; led a team of 4+ consultants and upheld regulatory-grade data accuracy.",
    year: "2024",
    direction: "right",
  },
  {
    number: "03",
    role: "BI Developer",
    company: "CRG Solutions · Zee Entertainment",
    detail: "Delivered Tableau & Power BI dashboards across Sales, HR and OTT — with row/user-level security, automated subscriptions and insight into engagement, CTR & churn.",
    year: "2021 — 2024",
    direction: "left",
  },
  {
    number: "04",
    role: "Marketing Data Analyst",
    company: "Qiagen Digital",
    detail: "Built Tableau dashboards for marketing & sales KPIs including ROI and funnel metrics, surfacing business risks and opportunities through KPI monitoring.",
    year: "2020 — 2021",
    direction: "right",
  },
  {
    number: "05",
    role: "Data Analyst",
    company: "360 Nautica",
    detail: "Prepared structured datasets, visualized audience trends from box-office and streaming data, and trained internal users on Tableau.",
    year: "2019 — 2020",
    direction: "left",
  },
]

export function WorkSection() {
  const { ref, isVisible } = useReveal(0.3)
  // Current role (IBM) expanded by default; others collapse (progressive disclosure).
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section
      ref={ref}
      className="flex min-h-[100dvh] w-full shrink-0 snap-start items-center px-5 py-24 md:w-screen md:px-12 md:py-0 lg:px-16"
    >
      <div className="mx-auto w-full max-w-7xl">
        <div
          className={`mb-8 transition-all duration-700 md:mb-10 ${
            isVisible ? "translate-x-0 opacity-100" : "-translate-x-12 opacity-0"
          }`}
        >
          <h2 className="mb-2 font-sans text-5xl font-light tracking-tight text-foreground md:text-6xl lg:text-7xl">
            Experience
          </h2>
          <p className="font-mono text-sm text-foreground/60 md:text-base">
            / 9+ years across banking, media &amp; analytics · tap a role to expand
          </p>
        </div>

        <div className="space-y-2 md:space-y-3">
          {EXPERIENCE.map((role, i) => (
            <RoleCard
              key={i}
              role={role}
              index={i}
              isVisible={isVisible}
              open={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? null : i)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

function RoleCard({
  role,
  index,
  isVisible,
  open,
  onToggle,
}: {
  role: { number: string; role: string; company: string; detail: string; year: string; direction: string }
  index: number
  isVisible: boolean
  open: boolean
  onToggle: () => void
}) {
  const revealClass = !isVisible
    ? role.direction === "left"
      ? "-translate-x-16 opacity-0"
      : "translate-x-16 opacity-0"
    : "translate-x-0 opacity-100"

  return (
    <div
      className={`overflow-hidden rounded-xl border transition-all duration-700 ${
        open ? "border-foreground/25 bg-background/30" : "border-foreground/10 bg-background/10 hover:border-foreground/20"
      } ${revealClass}`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <button
        onClick={onToggle}
        aria-expanded={open}
        className="group flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left md:px-5 md:py-4"
      >
        <div className="flex items-center gap-4 md:gap-6">
          <span
            className={`font-mono text-sm transition-colors md:text-base ${
              open ? "text-sky-300/80" : "text-foreground/30 group-hover:text-foreground/50"
            }`}
          >
            {role.number}
          </span>
          <div>
            <h3 className="font-sans text-lg font-light text-foreground md:text-2xl lg:text-3xl">{role.role}</h3>
            <p className="font-mono text-xs text-foreground/60 md:text-sm">{role.company}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="whitespace-nowrap font-mono text-xs text-foreground/40 md:text-sm">{role.year}</span>
          <ChevronDown
            className={`h-4 w-4 text-foreground/50 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {/* Expandable detail */}
      <div
        className="grid transition-all duration-500 ease-out"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <p className="max-w-2xl px-4 pb-4 pl-11 text-sm leading-relaxed text-foreground/75 md:px-5 md:pb-5 md:pl-16 md:text-base">
            {role.detail}
          </p>
        </div>
      </div>
    </div>
  )
}
