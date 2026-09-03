/**
 * Per-session presentation decks for every course — the in-portal teaching
 * companion to the Learn tab's lessons.
 *
 * One lesson = one live session = one deck. Decks are DERIVED from the lesson
 * content in lib/course-lessons.ts, so the flagship courses (Power BI, Tableau,
 * SQL) get rich, fully-authored slides automatically and every other course
 * still gets a complete, presentable deck. Author once, teach twice.
 *
 * Each slide carries two extra layers beyond what's projected:
 *   - notes:    speaker notes — what the mentor says/does while this slide is up
 *   - thinking: the mental model behind the slide ("How I think about it")
 *
 * Sessions are also mapped onto a learning JOURNEY — four phases from first
 * contact to shipping real work — which the portal renders as a journey map.
 */

import { lessonsForCourse, type Lesson } from "@/lib/course-lessons"

export const JOURNEY_PHASES = ["Foundations", "Core skills", "Applied", "Ship it"] as const
export type JourneyPhase = (typeof JOURNEY_PHASES)[number]

/** One line of narrative per phase — shown on the journey map. */
export const PHASE_STORY: Record<JourneyPhase, string> = {
  Foundations: "Get oriented — the landscape, the vocabulary, the mental model.",
  "Core skills": "Build the muscle — the techniques you'll use every working day.",
  Applied: "Put it to work — real data, real questions, real analysis.",
  "Ship it": "Make it stick — polish, share, and prove you can do it end-to-end.",
}

export interface DeckSlide {
  kind: "title" | "content" | "exercise" | "recap"
  title: string
  bullets: string[]
  /** Speaker notes — the mentor's voice: what to say and do on this slide. */
  notes: string
  /** The mental model behind the slide — shown as "How I think about it". */
  thinking?: string
}

export interface SessionDeck {
  id: string // `${courseId}-s${session}` — stable, used as the progress key
  session: number // 1-based
  title: string
  objective: string
  phase: JourneyPhase
  minutes: number // rough live-session length
  slides: DeckSlide[]
}

/** Which journey phase a session falls in, by its position in the course. */
export function phaseOf(index: number, total: number): JourneyPhase {
  const f = (index + 1) / total
  if (f <= 0.25) return "Foundations"
  if (f <= 0.6) return "Core skills"
  if (f <= 0.85) return "Applied"
  return "Ship it"
}

/** Split prose into clean sentence bullets (avoids regex lookbehind for old Safari). */
function sentences(text: string): string[] {
  return text
    .split(/\.\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => (/[.?!]$/.test(s) ? s : `${s}.`))
}

function deckFromLesson(courseId: string, lesson: Lesson, index: number, all: Lesson[]): SessionDeck {
  const total = all.length
  const session = index + 1
  const next = all[index + 1]
  const phase = phaseOf(index, total)
  const objective = lesson.keyIdea

  const slides: DeckSlide[] = []

  // 1 — Title: the hook + the agenda.
  slides.push({
    kind: "title",
    title: lesson.title,
    bullets: [
      `Session ${session} of ${total} · ${phase}`,
      "Why this matters",
      "How it works — step by step",
      "Hands-on: try it yourself",
      "Recap & self-check",
    ],
    notes: `Open with the goal, not the tool: by the end of tonight — ${objective} Ask what everyone already knows about "${lesson.title}" and calibrate the pace to the answers.`,
    thinking: objective,
  })

  // 2 — Why this matters: the concept, one sentence per bullet.
  slides.push({
    kind: "content",
    title: "Why this matters",
    bullets: sentences(lesson.concept),
    notes: lesson.concept,
    thinking: objective,
  })

  // 3(+) — How it works: the steps, split across two slides when long.
  const stepChunks = lesson.steps.length > 5
    ? [lesson.steps.slice(0, Math.ceil(lesson.steps.length / 2)), lesson.steps.slice(Math.ceil(lesson.steps.length / 2))]
    : [lesson.steps]
  stepChunks.forEach((chunk, ci) => {
    slides.push({
      kind: "content",
      title: stepChunks.length > 1 ? `How it works (${ci + 1} of ${stepChunks.length})` : "How it works",
      bullets: chunk,
      notes:
        "Live-demo every step slowly and have students mirror it on their own machine before moving to the next — watching is not learning. Keep one thread visible the whole time: " +
        lesson.keyIdea,
    })
  })

  // Exercise — quiet hands-on time.
  slides.push({
    kind: "exercise",
    title: "Try it yourself",
    bullets: [lesson.exercise],
    notes:
      "Give 10–15 minutes of quiet hands-on time — resist the urge to rescue early. Circulate and watch HOW people attempt it; the goal is the attempt, not a perfect answer. Wrap by having one student walk the group through their approach.",
    thinking: lesson.check?.why,
  })

  // Recap — key idea, self-check as a group poll, bridge to the next session.
  const recapBullets = [lesson.keyIdea]
  if (lesson.check) recapBullets.push(`Quick check: ${lesson.check.question}`)
  recapBullets.push(next ? `Next session: ${next.title}` : "Course complete — book a 1-on-1 to go deeper.")
  slides.push({
    kind: "recap",
    title: "Recap",
    bullets: recapBullets,
    notes: lesson.check
      ? `Run the self-check as a hands-up poll before revealing the answer, then explain: ${lesson.check.why}`
      : "Close by restating the key idea in your own words, then preview what's next so tonight's work has a destination.",
    thinking: lesson.keyIdea,
  })

  return {
    id: `${courseId}-s${session}`,
    session,
    title: lesson.title,
    objective,
    phase,
    // Evening-class length: lesson depth drives it — longer lessons get the longer slot.
    minutes: lesson.minutes >= 14 ? 60 : 45,
    slides,
  }
}

/** All session decks for a course, in teaching order. Never empty. */
export function decksForCourse(courseId: string): SessionDeck[] {
  const lessons = lessonsForCourse(courseId)
  return lessons.map((l, i) => deckFromLesson(courseId, l, i, lessons))
}
