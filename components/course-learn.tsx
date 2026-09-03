"use client"

import { useEffect, useMemo, useState } from "react"
import {
  ChevronLeft,
  ChevronDown,
  Check,
  CircleDot,
  Clock,
  Lightbulb,
  ListChecks,
  Sparkles,
  BookOpen,
  ArrowUpRight,
  GraduationCap,
  Trophy,
  Presentation,
} from "lucide-react"
import { COURSES } from "@/lib/courses"
import { lessonsForCourse, AUTHORED_COURSE_IDS, type Lesson, type SelfCheck } from "@/lib/course-lessons"
import { CourseDecks } from "@/components/course-decks"
import { useAuth } from "@/hooks/use-auth"
import { mergeProgress, pushProgress, removeProgress } from "@/lib/learning-sync"

/**
 * Self-contained in-portal course learning experience — a real teaching tool,
 * no admin required. Students pick a course, work through detailed lessons
 * (concept · key idea · steps · hands-on exercise · resources), and track
 * completion. Progress persists in localStorage for instant UI and is
 * mirrored (best-effort) to Supabase so it follows the student across devices.
 */

const LS_KEY = "learn:progress:v1" // { [courseId]: string[] of completed lesson ids }

type Progress = Record<string, string[]>

function loadProgress(): Progress {
  if (typeof window === "undefined") return {}
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "{}")
  } catch {
    return {}
  }
}
function saveProgress(p: Progress) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(p))
  } catch {
    /* storage may be unavailable — progress is best-effort */
  }
}

export function CourseLearn() {
  const { user } = useAuth()
  const [progress, setProgress] = useState<Progress>({})
  const [activeCourse, setActiveCourse] = useState<string | null>(null)
  const [openLesson, setOpenLesson] = useState<string | null>(null)
  // Two ways through the same material: self-paced lessons, or the session
  // decks used in live classes (slides + speaker notes + journey map).
  const [mode, setMode] = useState<"lessons" | "decks">("lessons")

  useEffect(() => {
    const local = loadProgress()
    setProgress(local)
    // Pull progress from other devices and push anything only-local up.
    if (user) {
      mergeProgress(user.id, "lesson", local).then((merged) => {
        saveProgress(merged)
        setProgress(merged)
      })
    }
  }, [user])

  const done = (courseId: string) => new Set(progress[courseId] || [])

  const toggle = (courseId: string, lessonId: string) => {
    setProgress((prev) => {
      const set = new Set(prev[courseId] || [])
      const removing = set.has(lessonId)
      removing ? set.delete(lessonId) : set.add(lessonId)
      if (user) {
        removing
          ? void removeProgress(user.id, "lesson", courseId, lessonId)
          : void pushProgress(user.id, "lesson", [{ group_id: courseId, item_id: lessonId }])
      }
      const next = { ...prev, [courseId]: [...set] }
      saveProgress(next)
      return next
    })
  }

  // ── Course picker ──────────────────────────────────────────────
  if (!activeCourse) {
    return (
      <div>
        <p className="mb-4 text-sm text-foreground/60">
          Pick a course to start learning. Every lesson is hands-on — concept, the one key idea, a short walk-through,
          and a &ldquo;try it yourself&rdquo; task on real data. Your progress is saved automatically.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {COURSES.map((c) => {
            const lessons = lessonsForCourse(c.id)
            const completed = done(c.id).size
            const pct = lessons.length ? Math.round((completed / lessons.length) * 100) : 0
            const authored = AUTHORED_COURSE_IDS.has(c.id)
            return (
              <button
                key={c.id}
                onClick={() => {
                  setActiveCourse(c.id)
                  setOpenLesson(null)
                  setMode("lessons")
                }}
                className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] p-4 text-left transition-all hover:-translate-y-0.5 hover:border-white/25"
              >
                <div
                  className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-40 blur-2xl"
                  style={{ background: `radial-gradient(circle, ${c.accent[0]}, transparent 70%)` }}
                />
                <div className="relative">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <h3 className="text-sm font-medium text-foreground">{c.title}</h3>
                    {authored ? (
                      <span className="shrink-0 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wide text-emerald-300">
                        In-depth
                      </span>
                    ) : (
                      <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wide text-foreground/45">
                        Guided
                      </span>
                    )}
                  </div>
                  <p className="mb-3 text-xs leading-relaxed text-foreground/55">{c.tagline}</p>
                  <div className="mb-1.5 flex items-center justify-between font-mono text-[10px] text-foreground/45">
                    <span>{lessons.length} lessons</span>
                    <span>{completed}/{lessons.length} done</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${c.accent[0]}, ${c.accent[1]})` }}
                    />
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // ── Lesson list for the chosen course ──────────────────────────
  const course = COURSES.find((c) => c.id === activeCourse)!
  const lessons = lessonsForCourse(activeCourse)
  const completedSet = done(activeCourse)
  const completed = completedSet.size
  const pct = lessons.length ? Math.round((completed / lessons.length) * 100) : 0
  const totalMinutes = lessons.reduce((s, l) => s + l.minutes, 0)
  const allDone = completed === lessons.length && lessons.length > 0

  return (
    <div>
      <button
        onClick={() => setActiveCourse(null)}
        className="mb-4 inline-flex items-center gap-1.5 text-xs text-foreground/55 transition-colors hover:text-foreground"
      >
        <ChevronLeft className="h-3.5 w-3.5" /> All courses
      </button>

      {/* Course header */}
      <div className="mb-5 rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <div className="mb-1 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: course.accent[0] }} />
          <span className="font-mono text-[10px] uppercase tracking-wider text-foreground/45">
            {course.level} · {lessons.length} lessons · ~{totalMinutes} min
          </span>
        </div>
        <h3 className="text-lg font-medium text-foreground">{course.title}</h3>
        <p className="mt-1 text-xs leading-relaxed text-foreground/60">{course.summary}</p>

        <div className="mt-3 flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${course.accent[0]}, ${course.accent[1]})` }}
            />
          </div>
          <span className="font-mono text-[11px] text-foreground/60">{pct}%</span>
        </div>
      </div>

      {/* Lessons vs. session decks (slides + notes + journey map) */}
      <div className="mb-4 inline-flex rounded-lg border border-white/10 bg-white/[0.03] p-1">
        {(
          [
            { key: "lessons", label: "Lessons", Icon: BookOpen },
            { key: "decks", label: "Session decks", Icon: Presentation },
          ] as const
        ).map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => setMode(key)}
            aria-pressed={mode === key}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              mode === key ? "bg-white/10 text-foreground" : "text-foreground/55 hover:text-foreground"
            }`}
          >
            <Icon className="h-3.5 w-3.5" /> {label}
          </button>
        ))}
      </div>

      {mode === "decks" ? (
        <CourseDecks courseId={activeCourse} />
      ) : (
        <>
          {allDone && (
            <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-3">
              <Trophy className="h-4 w-4 text-emerald-300" />
              <p className="text-xs text-emerald-100">
                Course complete — every lesson done. Book a 1-on-1 to go deeper on anything that&apos;s still fuzzy.
              </p>
            </div>
          )}

          {/* Lessons */}
          <ol className="space-y-2.5">
            {lessons.map((lesson, i) => (
              <LessonRow
                key={lesson.id}
                index={i}
                lesson={lesson}
                accent={course.accent}
                complete={completedSet.has(lesson.id)}
                open={openLesson === lesson.id}
                onToggleOpen={() => setOpenLesson(openLesson === lesson.id ? null : lesson.id)}
                onToggleComplete={() => toggle(activeCourse, lesson.id)}
              />
            ))}
          </ol>
        </>
      )}
    </div>
  )
}

function LessonRow({
  index,
  lesson,
  accent,
  complete,
  open,
  onToggleOpen,
  onToggleComplete,
}: {
  index: number
  lesson: Lesson
  accent: [string, string]
  complete: boolean
  open: boolean
  onToggleOpen: () => void
  onToggleComplete: () => void
}) {
  return (
    <li
      className={`overflow-hidden rounded-xl border transition-colors ${
        complete ? "border-emerald-400/25 bg-emerald-400/[0.06]" : "border-white/10 bg-white/[0.03]"
      }`}
    >
      {/* Header row */}
      <div className="flex items-center gap-3 px-3.5 py-3">
        <button
          onClick={onToggleComplete}
          aria-pressed={complete}
          aria-label={complete ? "Mark lesson incomplete" : "Mark lesson complete"}
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] transition-colors ${
            complete ? "border-emerald-400 bg-emerald-400 text-black" : "border-white/30 text-foreground/50 hover:border-white/60"
          }`}
        >
          {complete ? <Check className="h-3.5 w-3.5" /> : index + 1}
        </button>

        <button onClick={onToggleOpen} aria-expanded={open} className="flex flex-1 items-center justify-between gap-3 text-left">
          <div>
            <span className={`block text-sm ${complete ? "text-foreground/70" : "text-foreground"}`}>{lesson.title}</span>
            <span className="mt-0.5 flex items-center gap-1 font-mono text-[10px] text-foreground/45">
              <Clock className="h-3 w-3" /> ~{lesson.minutes} min
            </span>
          </div>
          <ChevronDown className={`h-4 w-4 shrink-0 text-foreground/50 transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* Expandable teaching content */}
      <div className="grid transition-all duration-300 ease-out" style={{ gridTemplateRows: open ? "1fr" : "0fr" }}>
        <div className="overflow-hidden">
          <div className="space-y-4 px-3.5 pb-4 pl-12">
            {/* Concept */}
            <Block icon={<BookOpen className="h-3.5 w-3.5" />} label="Concept" accent={accent[0]}>
              <p className="text-xs leading-relaxed text-foreground/75">{lesson.concept}</p>
            </Block>

            {/* Key idea */}
            <div
              className="rounded-lg border px-3 py-2.5"
              style={{ borderColor: `${accent[0]}40`, background: `${accent[0]}0f` }}
            >
              <div className="mb-1 flex items-center gap-1.5">
                <Lightbulb className="h-3.5 w-3.5" style={{ color: accent[0] }} />
                <span className="font-mono text-[10px] uppercase tracking-wider" style={{ color: accent[0] }}>
                  Key idea
                </span>
              </div>
              <p className="text-xs font-medium leading-relaxed text-foreground/85">{lesson.keyIdea}</p>
            </div>

            {/* Steps */}
            <Block icon={<ListChecks className="h-3.5 w-3.5" />} label="How it works" accent={accent[0]}>
              <ol className="space-y-1.5">
                {lesson.steps.map((s, i) => (
                  <li key={i} className="flex gap-2 text-xs leading-relaxed text-foreground/70">
                    <span className="font-mono text-foreground/40">{i + 1}.</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ol>
            </Block>

            {/* Exercise */}
            <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5">
              <div className="mb-1 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                <span className="font-mono text-[10px] uppercase tracking-wider text-amber-300/80">Try it yourself</span>
              </div>
              <p className="text-xs leading-relaxed text-foreground/75">{lesson.exercise}</p>
            </div>

            {/* Self-check — active recall */}
            {lesson.check && <SelfCheckBlock check={lesson.check} accent={accent[0]} />}

            {/* Resources */}
            {lesson.resources && lesson.resources.length > 0 && (
              <div>
                <p className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-foreground/40">Resources</p>
                <div className="flex flex-wrap gap-2">
                  {lesson.resources.map((r) => (
                    <a
                      key={r.href + r.label}
                      href={r.href}
                      target={r.external ? "_blank" : undefined}
                      rel={r.external ? "noopener noreferrer" : undefined}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-[11px] text-foreground/75 transition-colors hover:border-white/25 hover:text-foreground"
                    >
                      {r.label} <ArrowUpRight className="h-3 w-3" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Complete toggle at the bottom for convenience */}
            <button
              onClick={onToggleComplete}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                complete
                  ? "bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30"
                  : "border border-white/15 bg-white/[0.04] text-foreground/80 hover:bg-white/10"
              }`}
            >
              {complete ? <><Check className="h-3.5 w-3.5" /> Completed</> : <><CircleDot className="h-3.5 w-3.5" /> Mark complete</>}
            </button>
          </div>
        </div>
      </div>
    </li>
  )
}

function SelfCheckBlock({ check, accent }: { check: SelfCheck; accent: string }) {
  const [picked, setPicked] = useState<number | null>(null)
  const answered = picked !== null
  const correct = picked === check.answer

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5">
      <div className="mb-2 flex items-center gap-1.5">
        <ListChecks className="h-3.5 w-3.5" style={{ color: accent }} />
        <span className="font-mono text-[10px] uppercase tracking-wider text-foreground/40">Self-check</span>
      </div>
      <p className="mb-2.5 text-xs font-medium text-foreground/85">{check.question}</p>
      <div className="space-y-1.5">
        {check.options.map((opt, i) => {
          const isAnswer = i === check.answer
          const isPicked = i === picked
          // Colour once answered: correct=green, wrong pick=red, others dim.
          let cls = "border-white/10 bg-white/[0.03] text-foreground/75 hover:border-white/25"
          if (answered) {
            if (isAnswer) cls = "border-emerald-400/40 bg-emerald-400/10 text-emerald-100"
            else if (isPicked) cls = "border-red-400/40 bg-red-400/10 text-red-200"
            else cls = "border-white/10 bg-white/[0.02] text-foreground/40"
          }
          return (
            <button
              key={i}
              disabled={answered}
              onClick={() => setPicked(i)}
              className={`flex w-full items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left text-xs transition-colors disabled:cursor-default ${cls}`}
            >
              <span className="font-mono text-[10px] text-foreground/40">{String.fromCharCode(65 + i)}</span>
              <span>{opt}</span>
              {answered && isAnswer && <Check className="ml-auto h-3.5 w-3.5 text-emerald-300" />}
            </button>
          )
        })}
      </div>
      {answered && (
        <div className="mt-2.5 rounded-lg bg-white/[0.03] px-2.5 py-2">
          <p className="text-[11px] leading-relaxed text-foreground/70">
            <span className={correct ? "font-medium text-emerald-300" : "font-medium text-amber-300"}>
              {correct ? "Correct. " : "Not quite. "}
            </span>
            {check.why}
          </p>
          {!correct && (
            <button
              onClick={() => setPicked(null)}
              className="mt-1.5 font-mono text-[10px] text-sky-300 underline-offset-2 hover:underline"
            >
              Try again
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function Block({ icon, label, accent, children }: { icon: React.ReactNode; label: string; accent: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 flex items-center gap-1.5">
        <span style={{ color: accent }}>{icon}</span>
        <span className="font-mono text-[10px] uppercase tracking-wider text-foreground/40">{label}</span>
      </div>
      {children}
    </div>
  )
}
