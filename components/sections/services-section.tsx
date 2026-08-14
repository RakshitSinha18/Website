"use client"

import { useReveal } from "@/hooks/use-reveal"

const CORE_SKILLS = [
  {
    title: "T-SQL",
    description: "Writing performant queries, stored procedures and data models across SQL Server & Oracle.",
    direction: "top",
  },
  {
    title: "Tableau",
    description: "Desktop & Server dashboards with row/user-level security, alerts and automated subscriptions.",
    direction: "right",
  },
  {
    title: "Advanced Excel",
    description: "Complex formulas, pivots and automated reporting workflows for fast, reliable analysis.",
    direction: "left",
  },
  {
    title: "Base SAS Programming 9.4",
    description: "Certified Base SAS programmer — data preparation, analysis and reporting at scale.",
    direction: "bottom",
  },
]

const SUPPORTING = [
  "Python",
  "PySpark",
  "Power BI",
  "SQL Server",
  "Oracle 11G",
  "Snowflake",
  "AWS (Basic)",
  "Salesforce",
  "Google Analytics",
]

export function ServicesSection() {
  const { ref, isVisible } = useReveal(0.3)

  return (
    <section
      ref={ref}
      className="flex min-h-[100dvh] w-full shrink-0 snap-start items-center px-5 py-24 md:w-screen md:px-12 md:py-0 lg:px-16"
    >
      <div className="mx-auto w-full max-w-7xl">
        <div
          className={`mb-8 transition-all duration-700 md:mb-12 ${
            isVisible ? "translate-y-0 opacity-100" : "-translate-y-12 opacity-0"
          }`}
        >
          <h2 className="mb-2 font-sans text-5xl font-light tracking-tight text-foreground md:text-6xl lg:text-7xl">
            Skills
          </h2>
          <p className="font-mono text-sm text-foreground/60 md:text-base">/ The toolkit behind the insights</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 md:gap-x-16 md:gap-y-10 lg:gap-x-24">
          {CORE_SKILLS.map((service, i) => (
            <ServiceCard key={i} service={service} index={i} isVisible={isVisible} />
          ))}
        </div>

        <div
          className={`mt-8 transition-all duration-700 md:mt-12 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"
          }`}
          style={{ transitionDelay: "650ms" }}
        >
          <p className="mb-3 font-mono text-xs text-foreground/50">/ Also works with</p>
          <div className="flex flex-wrap gap-2">
            {SUPPORTING.map((tool) => (
              <span
                key={tool}
                className="rounded-full border border-foreground/15 bg-foreground/5 px-3 py-1 font-mono text-xs text-foreground/80 backdrop-blur-sm transition-colors hover:border-foreground/30 hover:text-foreground"
              >
                {tool}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function ServiceCard({
  service,
  index,
  isVisible,
}: {
  service: { title: string; description: string; direction: string }
  index: number
  isVisible: boolean
}) {
  const getRevealClass = () => {
    if (!isVisible) {
      switch (service.direction) {
        case "left":
          return "-translate-x-16 opacity-0"
        case "right":
          return "translate-x-16 opacity-0"
        case "top":
          return "-translate-y-16 opacity-0"
        case "bottom":
          return "translate-y-16 opacity-0"
        default:
          return "translate-y-12 opacity-0"
      }
    }
    return "translate-x-0 translate-y-0 opacity-100"
  }

  return (
    <div
      className={`group transition-all duration-700 ${getRevealClass()}`}
      style={{
        transitionDelay: `${index * 150}ms`,
      }}
    >
      <div className="mb-3 flex items-center gap-3">
        <div className="h-px w-8 bg-foreground/30 transition-all duration-300 group-hover:w-12 group-hover:bg-foreground/50" />
        <span className="font-mono text-xs text-foreground/60">0{index + 1}</span>
      </div>
      <h3 className="mb-2 font-sans text-2xl font-light text-foreground md:text-3xl">{service.title}</h3>
      <p className="max-w-sm text-sm leading-relaxed text-foreground/80 md:text-base">{service.description}</p>
    </div>
  )
}
