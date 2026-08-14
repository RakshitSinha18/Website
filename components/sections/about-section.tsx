"use client"

import { MagneticButton } from "@/components/magnetic-button"
import { useReveal } from "@/hooks/use-reveal"
import { useCountUp } from "@/hooks/use-count-up"
import { QuoteOfDay } from "@/components/quote-of-day"

const STATS = [
  { value: 9, suffix: "+", label: "Years", sublabel: "In business intelligence" },
  { value: 7, suffix: "", label: "Companies", sublabel: "Banking, media & pharma" },
  { value: 100, suffix: "+", label: "Dashboards", sublabel: "Shipped & maintained" },
]

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
      className="flex min-h-[100dvh] w-full shrink-0 snap-start items-center px-5 py-24 md:w-screen md:px-12 md:py-0 lg:px-16"
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
              <h2 className="mb-3 font-sans text-3xl font-light leading-[1.1] tracking-tight text-foreground md:mb-4 md:text-6xl lg:text-7xl">
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
                insights that drive real business decisions.
              </p>
              <p className="max-w-md text-sm leading-relaxed text-foreground/90 md:text-lg">
                Outside office hours, I mentor and coach aspiring professionals — helping them strengthen their skills,
                navigate career challenges, and reach their personal and professional goals.
              </p>
              <QuoteOfDay className="mt-5 max-w-md" />
            </div>
          </div>

          {/* Right side - animated stats */}
          <div className="flex flex-col justify-center gap-4 md:gap-5">
            {STATS.map((stat, i) => (
              <StatCard key={stat.label} stat={stat} active={isVisible} delay={200 + i * 150} />
            ))}
          </div>
        </div>

        <div
          className={`mt-8 flex flex-wrap gap-3 transition-all duration-700 md:mt-14 md:gap-4 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"
          }`}
          style={{ transitionDelay: "750ms" }}
        >
          <MagneticButton size="lg" variant="primary" onClick={() => scrollToSection?.(4)}>
            Book a Mentoring Session
          </MagneticButton>
          <MagneticButton size="lg" variant="secondary" onClick={() => scrollToSection?.(1)}>
            View Experience
          </MagneticButton>
        </div>
      </div>
    </section>
  )
}
