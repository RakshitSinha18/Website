"use client"

import { MagneticButton } from "@/components/magnetic-button"
import { useReveal } from "@/hooks/use-reveal"
import { useCountUp } from "@/hooks/use-count-up"
import { QuoteOfDay } from "@/components/quote-of-day"
import { ResourceCard } from "@/components/resource-card"
import { SectionKicker } from "@/components/section-kicker"

const STATS = [
  { value: 9, suffix: "+", label: "Years", sublabel: "In business intelligence" },
  { value: 7, suffix: "", label: "Companies", sublabel: "Banking, media & pharma" },
  { value: 100, suffix: "+", label: "Dashboards", sublabel: "Shipped & maintained" },
]

// Tool proficiency — a data professional's portfolio staple.
// Qualitative tiers (no invented percentages); the bar width mirrors the tier.
const TIER_WIDTH: Record<string, string> = {
  Expert: "100%",
  Advanced: "80%",
  Proficient: "60%",
}
const SKILLS = [
  { name: "Tableau", tier: "Expert" },
  { name: "SQL / T-SQL", tier: "Expert" },
  { name: "Power BI (DAX · Power Query)", tier: "Advanced" },
  { name: "Advanced Excel", tier: "Advanced" },
  { name: "Base SAS 9.4", tier: "Proficient" },
]

// "What matters most" — the craft behind the tools. This is what Rakshit
// actually optimises for on every dashboard and every mentoring session.
const FOCUS = [
  {
    title: "The right question first",
    body: "A dashboard is only as good as the decision it drives. I start from the business question, not the chart.",
  },
  {
    title: "Data models that hold up",
    body: "Clean star schemas, correct grain, DAX and LOD that stay fast and honest as the data grows.",
  },
  {
    title: "Clarity over decoration",
    body: "Fewer, sharper visuals people trust and act on — not vanity metrics or dashboard clutter.",
  },
]

function FocusGrid({ active }: { active: boolean }) {
  return (
    <div className="mt-6 grid gap-3 sm:grid-cols-3">
      {FOCUS.map((f, i) => (
        <div
          key={f.title}
          className={`rounded-2xl border border-white/10 bg-[#0d1526]/60 p-4 backdrop-blur-md transition-all duration-700 ${
            active ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
          style={{ transitionDelay: `${550 + i * 120}ms` }}
        >
          <p className="mb-1 font-sans text-sm font-light text-foreground md:text-base">{f.title}</p>
          <p className="text-xs leading-relaxed text-foreground/65 md:text-sm">{f.body}</p>
        </div>
      ))}
    </div>
  )
}

function SkillMatrix({ active }: { active: boolean }) {
  return (
    <div
      className={`mt-6 rounded-2xl border border-white/10 bg-[#0d1526]/60 p-4 backdrop-blur-md transition-all duration-700 md:p-5 ${
        active ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
      }`}
      style={{ transitionDelay: "400ms" }}
    >
      <p className="mb-3 font-mono text-[10px] uppercase tracking-wider text-foreground/40">
        Core toolkit
      </p>
      <ul className="space-y-2.5">
        {SKILLS.map((s, i) => (
          <li key={s.name}>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm text-foreground/90">{s.name}</span>
              <span className="font-mono text-[10px] uppercase tracking-wider text-foreground/50">
                {s.tier}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-400 to-amber-300 transition-[width] duration-1000 ease-out"
                style={{
                  width: active ? TIER_WIDTH[s.tier] : "0%",
                  transitionDelay: `${500 + i * 120}ms`,
                }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

function StatCard({
  stat,
  active,
  delay,
}: {
  stat: (typeof STATS)[number]
  active: boolean
  delay: number
}) {
  const n = useCountUp(stat.value, active)
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-[#0d1526]/60 p-4 backdrop-blur-md transition-all duration-700 hover:border-foreground/30 md:p-6 ${
        active ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br from-sky-500/20 to-amber-500/10 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />
      <div className="relative flex items-baseline gap-3 md:gap-5">
        <div className="bg-gradient-to-br from-white to-white/60 bg-clip-text text-4xl font-light tabular-nums text-transparent md:text-6xl lg:text-7xl">
          {n}
          {stat.suffix}
        </div>
        <div>
          <div className="font-sans text-base font-light text-foreground md:text-xl">{stat.label}</div>
          <div className="font-mono text-xs text-foreground/70">{stat.sublabel}</div>
        </div>
      </div>
    </div>
  )
}

export function AboutSection({ scrollToSection }: { scrollToSection?: (index: number) => void }) {
  const { ref, isVisible } = useReveal(0.3)

  return (
    <section
      ref={ref}
      className="flex min-h-[100dvh] w-full items-center px-5 py-24 md:px-12 lg:px-16"
    >
      <div className="mx-auto w-full max-w-7xl">
        <div className="grid gap-8 md:grid-cols-2 md:gap-16 lg:gap-24">
          {/* Left side - Story */}
          <div>
            <div
              className={`mb-6 transition-all duration-700 md:mb-10 ${
                isVisible ? "translate-y-0 opacity-100" : "-translate-y-12 opacity-0"
              }`}
            >
              <SectionKicker number="02" label="About" />
              <h2 className="mb-3 font-sans text-2xl font-light leading-[1.1] tracking-tight text-foreground md:mb-4 md:text-4xl lg:text-5xl">
                Data by day,
                <br />
                <span className="text-foreground/40">mentoring</span>
                <br />
                after hours
              </h2>
            </div>

            <div
              className={`space-y-3 transition-all duration-700 md:space-y-4 ${
                isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
              }`}
              style={{ transitionDelay: "200ms" }}
            >
              <p className="max-w-md text-sm leading-relaxed text-foreground/90 md:text-lg">
                I&apos;m a Senior Business Intelligence professional who turns complex information into meaningful
                insights that drive real business decisions — mostly in{" "}
                <span className="text-foreground">Tableau and Power BI</span>, backed by solid SQL and data modelling.
              </p>
              <p className="max-w-md text-sm leading-relaxed text-foreground/90 md:text-lg">
                Outside office hours, I mentor and coach aspiring professionals — helping them strengthen their skills,
                navigate career challenges, and reach their personal and professional goals.
              </p>
              <QuoteOfDay className="mt-5 max-w-md" />
              <div className="max-w-md">
                <SkillMatrix active={isVisible} />
              </div>
            </div>
          </div>

          {/* Right side - animated stats */}
          <div className="flex flex-col justify-center gap-4 md:gap-5">
            {STATS.map((stat, i) => (
              <StatCard key={stat.label} stat={stat} active={isVisible} delay={200 + i * 150} />
            ))}
          </div>
        </div>

        {/* What matters most — the craft behind the tools. */}
        <div className="mt-10 md:mt-16">
          <p
            className={`mb-1 font-mono text-[11px] uppercase tracking-wider text-foreground/40 transition-all duration-700 ${
              isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            }`}
            style={{ transitionDelay: "500ms" }}
          >
            What matters most
          </p>
          <FocusGrid active={isVisible} />
          <ResourceCard
            className={`mt-4 transition-all duration-700 ${
              isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            }`}
          />
        </div>

        <div
          className={`mt-8 flex flex-wrap gap-3 transition-all duration-700 md:mt-14 md:gap-4 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"
          }`}
          style={{ transitionDelay: "750ms" }}
        >
          <MagneticButton size="lg" variant="ghost" onClick={() => scrollToSection?.(4)}>
            Let&apos;s have a chat
          </MagneticButton>
          <MagneticButton size="lg" variant="ghost" onClick={() => scrollToSection?.(5)}>
            See what I teach
          </MagneticButton>
        </div>
      </div>
    </section>
  )
}
