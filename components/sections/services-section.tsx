"use client"

import { useReveal } from "@/hooks/use-reveal"
import { CourseExplorer } from "@/components/course-explorer"

export function ServicesSection() {
  const { ref, isVisible } = useReveal(0.15)

  return (
    <section
      ref={ref}
      className="flex min-h-[100dvh] w-full items-center px-5 py-24 md:px-12 lg:px-16"
    >
      <div className="mx-auto w-full max-w-6xl">
        <div
          className={`mb-6 transition-all duration-700 md:mb-8 ${
            isVisible ? "translate-y-0 opacity-100" : "-translate-y-12 opacity-0"
          }`}
        >
          <h2 className="mb-2 font-sans text-5xl font-light tracking-tight text-foreground md:text-6xl lg:text-7xl">
            Courses I teach
          </h2>
          <p className="font-mono text-sm text-foreground/60 md:text-base">
            / Evening classes &amp; 1-on-1 mentoring · swipe or tap "Deep dive" to explore
          </p>
        </div>

        <div
          className={`transition-all duration-700 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"
          }`}
          style={{ transitionDelay: "150ms" }}
        >
          <CourseExplorer />
        </div>
      </div>
    </section>
  )
}
