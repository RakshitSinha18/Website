"use client"

import { useEffect, useMemo, useState } from "react"
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Clock,
  Lightbulb,
  MessageSquareText,
  Presentation,
  Sparkles,
  Map as MapIcon,
} from "lucide-react"
import { COURSES } from "@/lib/courses"
import { decksForCourse, JOURNEY_PHASES, PHASE_STORY, type SessionDeck, type DeckSlide } from "@/lib/course-decks"
import { useAuth } from "@/hooks/use-auth"
import { mergeProgress, pushProgress } from "@/lib/learning-sync"

/**
 * Session decks + journey map for a course. Each live session has a
 * presentable slide deck; every slide carries speaker notes and the mentor's
 * mental model ("How I think about it"). Students use it to preview or replay
 * a session; the mentor can present straight from it.
 *
 * A session counts as done once its last slide has been reached. Progress
 * lives in localStorage for instant UI and mirrors to Supabase (kind "deck")
 * so it follows the student across devices — same pattern as Learn/Practice.
 */

const LS_KEY = "decks:done:v1" // { [courseId]: string[] of completed deck ids }

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

export function CourseDecks({ courseId }: { courseId: string }) {
  const { user } = useAuth()
  const course = COURSES.find((c) => c.id === courseId)!
  const decks = useMemo(() => decksForCourse(courseId), [courseId])
  const [progress, setProgress] = useState<Progress>({})
  const [openDeck, setOpenDeck] = useState<string | null>(null)

  useEffect(() => {
    const local = loadProgress()
    setProgress(local)
    if (user) {
      mergeProgress(user.id, "deck", local).then((merged) => {
        saveProgress(merged)
        setProgress(merged)
      })
    }
  }, [user])

  const doneSet = new Set(progress[courseId] || [])

  const markDone = (deckId: string) => {
    if (doneSet.has(deckId)) return
    setProgress((prev) => {
      const set = new Set(prev[courseId] || [])
      set.add(deckId)
      if (user) void pushProgress(user.id, "deck", [{ group_id: courseId, item_id: deckId }])
      const next = { ...prev, [courseId]: [...set] }
      saveProgress(next)
      return next
    })
  }

  const active = decks.find((d) => d.id === openDeck)
  if (active) {
    return (
      <DeckViewer
        deck={active}
        accent={course.accent}
        done={doneSet.has(active.id)}
        onDone={() => markDone(active.id)}
        onBack={() => setOpenDeck(null)}
        onNext={
          active.session < decks.length ? () => setOpenDeck(decks[active.session].id) : undefined
        }
      />
    )
  }

  // Which phase the student is "in" — the phase of the first unfinished session.
  const current = decks.find((d) => !doneSet.has(d.id))

  return (
    <div>
      {/* ── Journey map ─────────────────────────────────────────── */}
      <div className="mb-5 rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <div className="mb-3 flex items-center gap-1.5">
          <MapIcon className="h-3.5 w-3.5" style={{ color: course.accent[0] }} />
          <span className="font-mono text-[10px] uppercase tracking-wider text-foreground/45">Your journey</span>
        </div>

        {/* Stops — one per session, grouped by phase colour intensity. */}
        <div className="flex items-center">
          {decks.map((d, i) => {
            const isDone = doneSet.has(d.id)
            const isCurrent = current?.id === d.id
            return (
              <div key={d.id} className={`flex items-center ${i < decks.length - 1 ? "flex-1" : ""}`}>
                <button
                  onClick={() => setOpenDeck(d.id)}
                  aria-label={`Session ${d.session}: ${d.title}${isDone ? " (done)" : ""}`}
                  title={`S${d.session} · ${d.title}`}
                  className="group relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[10px] font-medium transition-all hover:scale-110"
                  style={
                    isDone
                      ? { borderColor: course.accent[0], background: course.accent[0], color: "#000" }
                      : isCurrent
                        ? { borderColor: course.accent[0], color: course.accent[0], boxShadow: `0 0 0 3px ${course.accent[0]}25` }
                        : { borderColor: "rgba(255,255,255,0.25)", color: "rgba(255,255,255,0.5)" }
                  }
                >
                  {isDone ? <Check className="h-3.5 w-3.5" /> : d.session}
                </button>
                {i < decks.length - 1 && (
                  <div className="mx-1 h-px flex-1" style={{ background: isDone ? course.accent[0] : "rgba(255,255,255,0.12)" }} />
                )}
              </div>
            )
          })}
        </div>

        {/* Phase legend — where each phase begins along the journey. */}
        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-4">
          {JOURNEY_PHASES.map((ph) => {
            const inPhase = decks.filter((d) => d.phase === ph)
            if (inPhase.length === 0) return null
            const isHere = current?.phase === ph
            return (
              <div key={ph}>
                <p
                  className="font-mono text-[10px] uppercase tracking-wider"
                  style={{ color: isHere ? course.accent[0] : "rgba(255,255,255,0.4)" }}
                >
                  {ph} · S{inPhase[0].session}
                  {inPhase.length > 1 ? `–${inPhase[inPhase.length - 1].session}` : ""}
                </p>
              </div>
            )
          })}
        </div>

        {/* Narrative for the phase the student is in right now. */}
        <p className="mt-2 text-xs leading-relaxed text-foreground/60">
          {current ? (
            <>
              <span className="font-medium" style={{ color: course.accent[0] }}>
                You are in {current.phase.toLowerCase()}.
              </span>{" "}
              {PHASE_STORY[current.phase]}
            </>
          ) : (
            "Journey complete — every session done. Book a 1-on-1 to go deeper on anything still fuzzy."
          )}
        </p>
      </div>

      {/* ── Session list ────────────────────────────────────────── */}
      <ol className="space-y-2.5">
        {decks.map((d) => {
          const isDone = doneSet.has(d.id)
          return (
            <li key={d.id}>
              <button
                onClick={() => setOpenDeck(d.id)}
                className={`flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-all hover:-translate-y-0.5 hover:border-white/25 ${
                  isDone ? "border-emerald-400/25 bg-emerald-400/[0.06]" : "border-white/10 bg-white/[0.03]"
                }`}
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] ${
                    isDone ? "border-emerald-400 bg-emerald-400 text-black" : "border-white/30 text-foreground/50"
                  }`}
                >
                  {isDone ? <Check className="h-3.5 w-3.5" /> : d.session}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block truncate text-sm ${isDone ? "text-foreground/70" : "text-foreground"}`}>{d.title}</span>
                  <span className="mt-0.5 block truncate text-[11px] text-foreground/50">{d.objective}</span>
                  <span className="mt-1 flex items-center gap-2.5 font-mono text-[10px] text-foreground/45">
                    <span className="inline-flex items-center gap-1"><Presentation className="h-3 w-3" /> {d.slides.length} slides</span>
                    <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> ~{d.minutes} min live</span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-1.5 py-px uppercase tracking-wide">{d.phase}</span>
                  </span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-foreground/40" />
              </button>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

// ── Deck viewer — presentable slides + notes/thinking panel ──────
function DeckViewer({
  deck,
  accent,
  done,
  onDone,
  onBack,
  onNext,
}: {
  deck: SessionDeck
  accent: [string, string]
  done: boolean
  onDone: () => void
  onBack: () => void
  onNext?: () => void
}) {
  const [idx, setIdx] = useState(0)
  const [showNotes, setShowNotes] = useState(false)
  const slide = deck.slides[idx]
  const last = idx === deck.slides.length - 1

  // Reaching the final slide completes the session.
  useEffect(() => {
    if (last) onDone()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [last])

  // Arrow-key navigation (ignored while typing in a field).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return
      if (e.key === "ArrowRight") setIdx((i) => Math.min(i + 1, deck.slides.length - 1))
      else if (e.key === "ArrowLeft") setIdx((i) => Math.max(i - 1, 0))
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [deck.slides.length])

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs text-foreground/55 transition-colors hover:text-foreground"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> All sessions
        </button>
        <div className="flex items-center gap-2 font-mono text-[10px] text-foreground/45">
          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 uppercase tracking-wide">{deck.phase}</span>
          <span>
            S{deck.session} · slide {idx + 1}/{deck.slides.length}
          </span>
          {done && (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 uppercase tracking-wide text-emerald-300">
              <Check className="h-3 w-3" /> Done
            </span>
          )}
        </div>
      </div>

      {/* Slide canvas */}
      <SlideCanvas slide={slide} deck={deck} accent={accent} />

      {/* Controls */}
      <div className="mt-3 flex items-center justify-between gap-3">
        <button
          onClick={() => setIdx((i) => Math.max(i - 1, 0))}
          disabled={idx === 0}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.04] px-3 py-1.5 text-xs text-foreground/80 transition-colors hover:bg-white/10 disabled:pointer-events-none disabled:opacity-40"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Prev
        </button>

        {/* Progress dots */}
        <div className="flex items-center gap-1.5">
          {deck.slides.map((s, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              aria-label={`Slide ${i + 1}: ${s.title}`}
              className="rounded-full transition-all"
              style={{
                width: i === idx ? 16 : 6,
                height: 6,
                background: i === idx ? accent[0] : i < idx ? `${accent[0]}80` : "rgba(255,255,255,0.2)",
              }}
            />
          ))}
        </div>

        {last && onNext ? (
          <button
            onClick={onNext}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.04] px-3 py-1.5 text-xs text-foreground/80 transition-colors hover:bg-white/10"
          >
            Next session <ChevronRight className="h-3.5 w-3.5" />
          </button>
        ) : (
          <button
            onClick={() => setIdx((i) => Math.min(i + 1, deck.slides.length - 1))}
            disabled={last}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.04] px-3 py-1.5 text-xs text-foreground/80 transition-colors hover:bg-white/10 disabled:pointer-events-none disabled:opacity-40"
          >
            Next <ChevronRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Notes + thinking */}
      <button
        onClick={() => setShowNotes((v) => !v)}
        aria-expanded={showNotes}
        className={`mt-3 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
          showNotes ? "bg-white/10 text-foreground" : "border border-white/15 bg-white/[0.04] text-foreground/70 hover:bg-white/10"
        }`}
      >
        <MessageSquareText className="h-3.5 w-3.5" /> {showNotes ? "Hide notes" : "Notes & thinking"}
      </button>
      {showNotes && (
        <div className="mt-2.5 space-y-2.5">
          <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5">
            <p className="mb-1 font-mono text-[10px] uppercase tracking-wider text-foreground/40">Speaker notes</p>
            <p className="text-xs leading-relaxed text-foreground/75">{slide.notes}</p>
          </div>
          {slide.thinking && (
            <div className="rounded-lg border px-3 py-2.5" style={{ borderColor: `${accent[0]}40`, background: `${accent[0]}0f` }}>
              <div className="mb-1 flex items-center gap-1.5">
                <Lightbulb className="h-3.5 w-3.5" style={{ color: accent[0] }} />
                <span className="font-mono text-[10px] uppercase tracking-wider" style={{ color: accent[0] }}>
                  How I think about it
                </span>
              </div>
              <p className="text-xs font-medium leading-relaxed text-foreground/85">{slide.thinking}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function SlideCanvas({ slide, deck, accent }: { slide: DeckSlide; deck: SessionDeck; accent: [string, string] }) {
  if (slide.kind === "title") {
    return (
      <div className="relative flex min-h-[280px] flex-col items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] px-6 py-8 text-center md:min-h-[340px]">
        <div
          className="pointer-events-none absolute inset-0 opacity-25"
          style={{ background: `radial-gradient(70% 60% at 50% 0%, ${accent[0]}55, transparent 70%)` }}
        />
        <p className="relative mb-2 font-mono text-[10px] uppercase tracking-[0.25em] text-foreground/50">{deck.slides[0].bullets[0]}</p>
        <h3
          className="relative mb-3 bg-gradient-to-r bg-clip-text text-2xl font-light tracking-tight text-transparent md:text-4xl"
          style={{ backgroundImage: `linear-gradient(90deg, ${accent[0]}, ${accent[1]})` }}
        >
          {slide.title}
        </h3>
        <p className="relative mb-5 max-w-md text-xs leading-relaxed text-foreground/70 md:text-sm">{deck.objective}</p>
        <div className="relative flex flex-wrap items-center justify-center gap-2">
          {slide.bullets.slice(1).map((b) => (
            <span key={b} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[10px] text-foreground/60">
              {b}
            </span>
          ))}
        </div>
      </div>
    )
  }

  const isExercise = slide.kind === "exercise"
  const isRecap = slide.kind === "recap"
  const edge = isExercise ? "#fbbf24" : isRecap ? "#34d399" : accent[0]

  return (
    <div className="relative min-h-[280px] overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] p-6 md:min-h-[340px] md:p-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${edge}, transparent)` }} />
      <div className="mb-4 flex items-center gap-2">
        {isExercise && <Sparkles className="h-4 w-4 text-amber-300" />}
        <h3 className="text-lg font-medium tracking-tight text-foreground md:text-2xl">{slide.title}</h3>
      </div>
      <ul className="space-y-2.5">
        {slide.bullets.map((b, i) => (
          <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-foreground/80 md:text-base">
            <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full md:mt-2" style={{ background: edge }} />
            <span>{b}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
