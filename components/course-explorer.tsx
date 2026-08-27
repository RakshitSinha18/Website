"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, X, Check, ArrowRight } from "lucide-react"
import { COURSES, formatPrice, type Course } from "@/lib/courses"
import Link from "next/link"

/**
 * Interactive course explorer: a horizontal course carousel (drag/keyboard/dots)
 * with a "deep dive" modal that explains each course in depth.
 * Pure React + CSS — no external animation deps, safe for static export.
 */
export function CourseExplorer() {
  const [index, setIndex] = useState(0)
  const [deepDive, setDeepDive] = useState<Course | null>(null)

  const goTo = (i: number) => setIndex(((i % COURSES.length) + COURSES.length) % COURSES.length)
  const next = () => goTo(index + 1)
  const prev = () => goTo(index - 1)

  return (
    <div className="w-full">
      {/* Carousel viewport */}
      <div className="relative">
        <div className="overflow-hidden">
          <div
            className="flex transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
            style={{ transform: `translateX(-${index * 100}%)` }}
          >
            {COURSES.map((course, i) => (
              <div key={course.id} className="w-full shrink-0 px-1">
                <CourseSlide
                  course={course}
                  active={i === index}
                  onDeepDive={() => setDeepDive(course)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Prev / Next */}
        <button
          onClick={prev}
          aria-label="Previous course"
          className="absolute left-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-foreground/20 bg-background/60 text-foreground backdrop-blur-md transition-all hover:scale-110 hover:bg-background/80 md:-left-4"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          onClick={next}
          aria-label="Next course"
          className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-foreground/20 bg-background/60 text-foreground backdrop-blur-md transition-all hover:scale-110 hover:bg-background/80 md:-right-4"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Dots */}
      <div className="mt-5 flex items-center justify-center gap-2">
        {COURSES.map((c, i) => (
          <button
            key={c.id}
            onClick={() => goTo(i)}
            aria-label={`Go to ${c.title}`}
            aria-current={i === index}
            className="p-1"
          >
            <span
              className={`block rounded-full transition-all duration-300 ${
                i === index ? "h-2 w-6 bg-foreground" : "h-2 w-2 bg-foreground/40 hover:bg-foreground/70"
              }`}
            />
          </button>
        ))}
      </div>

      {/* Deep-dive modal */}
      {deepDive && <DeepDive course={deepDive} onClose={() => setDeepDive(null)} />}
    </div>
  )
}

function CourseSlide({
  course,
  active,
  onDeepDive,
}: {
  course: Course
  active: boolean
  onDeepDive: () => void
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-white/10 bg-[#0d1526]/80 p-6 backdrop-blur-xl transition-all duration-500 md:p-8 ${
        active ? "scale-100 opacity-100" : "scale-95 opacity-60"
      }`}
    >
      {/* Accent glow */}
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full opacity-40 blur-3xl"
        style={{ background: `radial-gradient(circle, ${course.accent[0]}, transparent 70%)` }}
      />

      <div className="relative grid gap-6 md:grid-cols-[1.3fr_1fr] md:items-center">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1.5">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: course.accent[0] }}
            />
            <span className="font-mono text-[11px] uppercase tracking-wide text-foreground/60">
              {course.level} · {course.duration}
            </span>
            <PriceBadge course={course} />
          </div>
          <h3 className="mb-1 font-sans text-3xl font-light text-foreground md:text-4xl">{course.title}</h3>
          <p
            className="mb-3 font-sans text-lg font-light"
            style={{ color: course.accent[0] }}
          >
            {course.tagline}
          </p>
          <p className="mb-5 max-w-md text-sm leading-relaxed text-foreground/75 md:text-base">
            {course.summary}
          </p>

          <div className="mb-5 flex flex-wrap gap-1.5">
            {course.tools.map((t) => (
              <span
                key={t}
                className="rounded-full border border-foreground/15 bg-foreground/5 px-2.5 py-0.5 font-mono text-[10px] text-foreground/70"
              >
                {t}
              </span>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onDeepDive}
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-black transition-all hover:scale-[1.03]"
              style={{ background: `linear-gradient(135deg, ${course.accent[0]}, ${course.accent[1]})` }}
            >
              Deep dive <ArrowRight className="h-4 w-4" />
            </button>
            <Link
              href="/login/"
              className="font-sans text-sm font-medium text-foreground/80 underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              Enroll
            </Link>
          </div>
        </div>

        {/* Outcomes preview */}
        <div className="rounded-2xl border border-foreground/10 bg-foreground/5 p-4">
          <p className="mb-2 font-mono text-[11px] uppercase tracking-wide text-foreground/50">You'll be able to</p>
          <ul className="space-y-1.5">
            {course.outcomes.slice(0, 4).map((o) => (
              <li key={o} className="flex items-start gap-2 text-sm text-foreground/80">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: course.accent[0] }} />
                {o}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

function DeepDive({ course, onClose }: { course: Course; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/80 p-0 backdrop-blur-md md:items-center md:p-6"
      onClick={onClose}
    >
      <div
        className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl border border-white/15 bg-[#0d1526] p-6 shadow-2xl md:rounded-3xl md:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ background: course.accent[0] }} />
              <span className="font-mono text-[11px] uppercase tracking-wide text-foreground/60">
                {course.level} · {course.duration}
              </span>
            </div>
            <h3 className="font-sans text-2xl font-light text-foreground md:text-3xl">{course.title}</h3>
            <p className="font-sans text-base" style={{ color: course.accent[0] }}>
              {course.tagline}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-foreground/20 bg-foreground/10 text-foreground transition-colors hover:bg-foreground/20"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mb-6 text-sm leading-relaxed text-foreground/80 md:text-base">{course.summary}</p>

        <Section title="Who it's for">
          <p className="text-sm leading-relaxed text-foreground/75">{course.forWhom}</p>
        </Section>

        <Section title="What you'll be able to do">
          <ul className="space-y-2">
            {course.outcomes.map((o) => (
              <li key={o} className="flex items-start gap-2 text-sm text-foreground/80">
                <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: course.accent[0] }} />
                {o}
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Learning path">
          <LearningPath steps={course.syllabus} accent={course.accent} />
        </Section>

        <div className="mt-6 border-t border-foreground/10 pt-5">
          <div className="mb-4 flex items-baseline gap-2">
            {course.priceFrom != null ? (
              <>
                <span className="font-mono text-xs uppercase tracking-wide text-foreground/50">From</span>
                <span className="font-sans text-2xl font-light text-foreground">
                  {formatPrice(course.priceFrom)}
                </span>
                <span className="font-mono text-xs text-foreground/50">/ session</span>
              </>
            ) : (
              <span className="font-sans text-xl font-light text-foreground">Pricing on request</span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/login/"
              className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium text-black transition-all hover:scale-[1.03]"
              style={{ background: `linear-gradient(135deg, ${course.accent[0]}, ${course.accent[1]})` }}
            >
              Enroll in this course <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href={`mailto:rsinha1369@gmail.com?subject=${encodeURIComponent(`Enquiry: ${course.title}`)}`}
              className="font-sans text-sm font-medium text-foreground/80 underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              Contact about pricing
            </a>
          </div>
          <p className="mt-3 font-mono text-xs text-foreground/50">
            Evening classes · after office hours · final quote depends on scope &amp; format
          </p>
        </div>
      </div>
    </div>
  )
}

// Visual learning-path: syllabus steps as a connected vertical flow diagram.
function LearningPath({ steps, accent }: { steps: string[]; accent: [string, string] }) {
  if (steps.length === 0) return null
  return (
    <ol className="relative ml-1">
      {/* connecting line */}
      <span
        className="absolute bottom-3 left-[11px] top-3 w-px"
        style={{ background: `linear-gradient(${accent[0]}, ${accent[1]})` }}
        aria-hidden
      />
      {steps.map((s, i) => (
        <li key={s} className="relative flex items-start gap-3 pb-4 last:pb-0">
          <span
            className="relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-[11px] text-black ring-4 ring-[#0d1526]"
            style={{ background: `linear-gradient(135deg, ${accent[0]}, ${accent[1]})` }}
          >
            {i + 1}
          </span>
          <div className="pt-0.5">
            <span className="text-sm text-foreground/85">{s}</span>
            {i === 0 && (
              <span className="ml-2 font-mono text-[10px] uppercase tracking-wide text-foreground/40">
                start
              </span>
            )}
            {i === steps.length - 1 && (
              <span className="ml-2 font-mono text-[10px] uppercase tracking-wide" style={{ color: accent[0] }}>
                capstone
              </span>
            )}
          </div>
        </li>
      ))}
    </ol>
  )
}

// Small pill showing the starting price (or "Pricing on request").
function PriceBadge({ course }: { course: Course }) {
  const label =
    course.priceFrom != null ? `From ${formatPrice(course.priceFrom)} / session` : "Pricing on request"
  return (
    <span
      className="rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wide"
      style={{
        borderColor: `${course.accent[0]}55`,
        color: course.accent[0],
        background: `${course.accent[0]}12`,
      }}
    >
      {label}
    </span>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h4 className="mb-2 font-mono text-[11px] uppercase tracking-wide text-foreground/50">{title}</h4>
      {children}
    </div>
  )
}
