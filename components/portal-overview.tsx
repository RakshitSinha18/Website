"use client"

import { useEffect, useState } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { CalendarClock, GraduationCap, Brain, Map, Video, MessagesSquare } from "lucide-react"
import { COURSES } from "@/lib/courses"
import { lessonsForCourse } from "@/lib/course-lessons"
import { PRACTICE_DECKS } from "@/lib/practice-decks"

interface OverviewBooking {
  class_title: string
  scheduled_at: string
  status: string
  meet_link?: string | null
}

// "When is it" in words a student actually thinks in.
function relativeDay(d: Date): string {
  const now = new Date()
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const days = Math.round((startOf(d) - startOf(now)) / 86_400_000)
  const time = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
  if (days === 0) return `today at ${time}`
  if (days === 1) return `tomorrow at ${time}`
  if (days < 7) return `${d.toLocaleDateString([], { weekday: "long" })} at ${time}`
  return d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" }) + ` at ${time}`
}

/**
 * At-a-glance strip at the top of the portal: the next confirmed session
 * (with a Join link when it exists) plus lightweight progress stats pulled
 * from the same localStorage the Learn and Practice tabs use.
 */
export function PortalOverview({
  bookings,
  roadmapDone,
  roadmapTotal,
  onGoTo,
  discordUrl,
}: {
  bookings: OverviewBooking[]
  roadmapDone: number
  roadmapTotal: number
  onGoTo: (tab: "learn" | "practice" | "roadmap" | "classes") => void
  // Set from admin Settings; the community banner renders only when non-empty.
  discordUrl?: string
}) {
  const reduce = useReducedMotion() ?? false
  // Learn/Practice progress live in localStorage — read after mount.
  const [lessonsDone, setLessonsDone] = useState(0)
  const [cardsMastered, setCardsMastered] = useState(0)

  useEffect(() => {
    try {
      const learn = JSON.parse(localStorage.getItem("learn:progress:v1") || "{}") as Record<string, string[]>
      setLessonsDone(Object.values(learn).reduce((s, arr) => s + arr.length, 0))
    } catch { /* fine — shows 0 */ }
    try {
      const known = JSON.parse(localStorage.getItem("practice:known:v1") || "{}") as Record<string, string[]>
      setCardsMastered(Object.values(known).reduce((s, arr) => s + arr.length, 0))
    } catch { /* fine — shows 0 */ }
  }, [])

  const totalLessons = COURSES.reduce((s, c) => s + lessonsForCourse(c.id).length, 0)
  const totalCards = PRACTICE_DECKS.reduce((s, d) => s + d.cards.length, 0)

  const next = bookings
    .filter((b) => b.status === "confirmed" && new Date(b.scheduled_at).getTime() > Date.now())
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())[0]

  const stats: { icon: typeof GraduationCap; label: string; value: string; tab: "learn" | "practice" | "roadmap" }[] = [
    { icon: GraduationCap, label: "Lessons done", value: `${lessonsDone}/${totalLessons}`, tab: "learn" },
    { icon: Brain, label: "Cards mastered", value: `${cardsMastered}/${totalCards}`, tab: "practice" },
    ...(roadmapTotal > 0
      ? [{ icon: Map, label: "Roadmap", value: `${roadmapDone}/${roadmapTotal}`, tab: "roadmap" as const }]
      : []),
  ]

  return (
    <div className="mb-6 space-y-3">
      {/* Next confirmed session — the one thing a student most wants to know. */}
      {next && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-sky-400/25 bg-sky-400/[0.07] px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-400/15 text-sky-300">
              <CalendarClock className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-medium text-foreground">{next.class_title}</p>
              <p className="font-mono text-[11px] text-sky-200/80">
                Next session {relativeDay(new Date(next.scheduled_at))}
              </p>
            </div>
          </div>
          {next.meet_link ? (
            <a
              href={next.meet_link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/20 px-3.5 py-2 font-mono text-[11px] text-emerald-200 transition-colors hover:bg-emerald-500/30"
            >
              <Video className="h-3.5 w-3.5" /> Join Google Meet
            </a>
          ) : (
            <button
              onClick={() => onGoTo("classes")}
              className="font-mono text-[11px] text-sky-300 underline-offset-2 hover:underline"
            >
              View details →
            </button>
          )}
        </div>
      )}

      {/* Progress chips — tap to jump to the matching tab. */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
        {stats.map((s) => (
          <button
            key={s.label}
            onClick={() => onGoTo(s.tab)}
            className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-left transition-colors hover:border-white/25"
          >
            <s.icon className="h-4 w-4 shrink-0 text-foreground/45" />
            <span className="min-w-0">
              <span className="block truncate font-mono text-[10px] uppercase tracking-wider text-foreground/45">
                {s.label}
              </span>
              <span className="block text-sm font-medium tabular-nums text-foreground">{s.value}</span>
            </span>
          </button>
        ))}
      </div>

      {/* Student community — appears once the admin sets a Discord invite. */}
      {discordUrl && /^https?:\/\//i.test(discordUrl) && (
        <motion.a
          initial={reduce ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 90, damping: 16, delay: 0.15 }}
          href={discordUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-indigo-400/25 bg-indigo-400/[0.07] px-4 py-3 transition-colors hover:border-indigo-400/50"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-400/15 text-indigo-300">
              <MessagesSquare className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-medium text-foreground">Student community</p>
              <p className="font-mono text-[11px] text-indigo-200/80">
                Ask questions between sessions and share your work
              </p>
            </div>
          </div>
          <span className="rounded-lg bg-indigo-400/15 px-3.5 py-2 font-mono text-[11px] text-indigo-200">
            Join on Discord →
          </span>
        </motion.a>
      )}
    </div>
  )
}
