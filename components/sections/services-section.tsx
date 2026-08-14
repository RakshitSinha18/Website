"use client"

import { useReveal } from "@/hooks/use-reveal"
import { BarChart3, Database, Table2, Code2, LineChart, GraduationCap } from "lucide-react"
import Link from "next/link"

const COURSES = [
  {
    icon: BarChart3,
    title: "Data Analytics",
    level: "Beginner → Advanced",
    description: "End-to-end analytics: framing questions, cleaning data, finding insights and telling the story.",
    topics: ["Analytics mindset", "Data cleaning", "KPIs & metrics", "Storytelling"],
    accent: "from-sky-500/30 to-blue-600/10",
  },
  {
    icon: Table2,
    title: "Tableau & Dashboards",
    level: "Beginner → Advanced",
    description: "Design, build and publish interactive dashboards on Tableau Desktop & Server.",
    topics: ["Calculated fields", "LOD expressions", "Row-level security", "Publishing"],
    accent: "from-orange-500/30 to-amber-600/10",
  },
  {
    icon: Database,
    title: "SQL & T-SQL",
    level: "Foundations → Pro",
    description: "Query, join and model data confidently across SQL Server and Oracle.",
    topics: ["Joins & subqueries", "Window functions", "Stored procedures", "Optimization"],
    accent: "from-indigo-500/30 to-violet-600/10",
  },
  {
    icon: LineChart,
    title: "Advanced Excel",
    level: "Analyst track",
    description: "Formulas, pivots and automated reporting workflows for fast, reliable analysis.",
    topics: ["Lookups & arrays", "PivotTables", "Power Query", "Dashboards"],
    accent: "from-emerald-500/30 to-teal-600/10",
  },
  {
    icon: Code2,
    title: "Base SAS 9.4",
    level: "Certified path",
    description: "Data steps, procedures and reporting with Base SAS from a certified programmer.",
    topics: ["DATA step", "PROC SQL", "Macros", "Reporting"],
    accent: "from-rose-500/30 to-red-600/10",
  },
  {
    icon: GraduationCap,
    title: "BI Career Coaching",
    level: "1-on-1 mentoring",
    description: "Portfolio, interview prep and a roadmap for breaking into business intelligence.",
    topics: ["Portfolio review", "Mock interviews", "Resume", "Roadmap"],
    accent: "from-fuchsia-500/30 to-purple-600/10",
  },
]

export function ServicesSection() {
  const { ref, isVisible } = useReveal(0.2)

  return (
    <section
      ref={ref}
      className="flex min-h-[100dvh] w-full shrink-0 snap-start items-center px-5 py-24 md:w-screen md:px-12 md:py-0 lg:px-16"
    >
      <div className="mx-auto w-full max-w-7xl">
        <div
          className={`mb-6 transition-all duration-700 md:mb-10 ${
            isVisible ? "translate-y-0 opacity-100" : "-translate-y-12 opacity-0"
          }`}
        >
          <h2 className="mb-2 font-sans text-5xl font-light tracking-tight text-foreground md:text-6xl lg:text-7xl">
            Courses I teach
          </h2>
          <p className="font-mono text-sm text-foreground/60 md:text-base">
            / Evening classes &amp; 1-on-1 mentoring · after office hours
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {COURSES.map((course, i) => (
            <CourseCard key={course.title} course={course} index={i} isVisible={isVisible} />
          ))}
        </div>

        <div
          className={`mt-6 flex flex-wrap items-center gap-3 transition-all duration-700 md:mt-8 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
          style={{ transitionDelay: "500ms" }}
        >
          <Link
            href="/login"
            className="rounded-full bg-foreground/95 px-6 py-3 text-sm font-medium text-background transition-all hover:scale-[1.03] hover:bg-foreground"
          >
            Enroll — Student Login
          </Link>
          <span className="font-mono text-xs text-foreground/50">
            Register free · build your learning roadmap · book evening sessions
          </span>
        </div>
      </div>
    </section>
  )
}

function CourseCard({
  course,
  index,
  isVisible,
}: {
  course: (typeof COURSES)[number]
  index: number
  isVisible: boolean
}) {
  const Icon = course.icon
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border border-foreground/15 bg-background/40 p-5 backdrop-blur-xl transition-all duration-700 hover:-translate-y-1 hover:border-foreground/30 ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
      }`}
      style={{ transitionDelay: `${index * 90}ms` }}
    >
      {/* Accent glow on hover */}
      <div
        className={`pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br ${course.accent} opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100`}
      />

      <div className="relative">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-foreground/15 bg-foreground/10 text-foreground transition-transform duration-300 group-hover:scale-110">
            <Icon className="h-5 w-5" />
          </div>
          <span className="font-mono text-[10px] uppercase tracking-wide text-foreground/50">{course.level}</span>
        </div>

        <h3 className="mb-1.5 font-sans text-xl font-light text-foreground">{course.title}</h3>
        <p className="mb-3 text-sm leading-relaxed text-foreground/70">{course.description}</p>

        <div className="flex flex-wrap gap-1.5">
          {course.topics.map((t) => (
            <span
              key={t}
              className="rounded-full border border-foreground/10 bg-foreground/5 px-2.5 py-0.5 font-mono text-[10px] text-foreground/70"
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
