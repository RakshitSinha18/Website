"use client"

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

  return (
    <section
      ref={ref}
      className="flex min-h-[100dvh] w-full shrink-0 snap-start items-center px-5 py-24 md:w-screen md:px-12 md:py-0 lg:px-16"
    >
      <div className="mx-auto w-full max-w-7xl">
        <div
          className={`mb-8 transition-all duration-700 md:mb-12 ${
            isVisible ? "translate-x-0 opacity-100" : "-translate-x-12 opacity-0"
          }`}
        >
          <h2 className="mb-2 font-sans text-5xl font-light tracking-tight text-foreground md:text-6xl lg:text-7xl">
            Experience
          </h2>
          <p className="font-mono text-sm text-foreground/60 md:text-base">/ 9+ years across banking, media & analytics</p>
        </div>

        <div className="space-y-3 md:space-y-5">
          {EXPERIENCE.map((role, i) => (
            <RoleCard key={i} role={role} index={i} isVisible={isVisible} />
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
}: {
  role: { number: string; role: string; company: string; detail: string; year: string; direction: string }
  index: number
  isVisible: boolean
}) {
  const getRevealClass = () => {
    if (!isVisible) {
      return role.direction === "left" ? "-translate-x-16 opacity-0" : "translate-x-16 opacity-0"
    }
    return "translate-x-0 opacity-100"
  }

  return (
    <div
      className={`group flex items-start justify-between gap-4 border-b border-foreground/10 py-4 transition-all duration-700 hover:border-foreground/25 md:py-5 ${getRevealClass()}`}
      style={{
        transitionDelay: `${index * 120}ms`,
      }}
    >
      <div className="flex items-baseline gap-4 md:gap-8">
        <span className="font-mono text-sm text-foreground/30 transition-colors group-hover:text-foreground/50 md:text-base">
          {role.number}
        </span>
        <div>
          <h3 className="mb-1 font-sans text-xl font-light text-foreground transition-transform duration-300 group-hover:translate-x-1 md:text-2xl lg:text-3xl">
            {role.role}
          </h3>
          <p className="mb-1.5 font-mono text-xs text-foreground/60 md:text-sm">{role.company}</p>
          <p className="max-w-xl text-xs leading-relaxed text-foreground/70 md:text-sm">{role.detail}</p>
        </div>
      </div>
      <span className="shrink-0 whitespace-nowrap font-mono text-xs text-foreground/40 md:text-sm">{role.year}</span>
    </div>
  )
}
