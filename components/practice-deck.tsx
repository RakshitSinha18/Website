"use client"

import { useEffect, useMemo, useState } from "react"
import { ChevronLeft, Check, RotateCcw, Trophy, Eye, Brain, ArrowRight } from "lucide-react"
import { PRACTICE_DECKS, type PracticeDeck } from "@/lib/practice-decks"

/**
 * Practice tab — active-recall flashcards. Read the prompt, answer out loud
 * (or on paper), reveal, then grade yourself honestly. "Knew it" retires the
 * card; "Review again" keeps it in rotation. Progress persists per user in
 * localStorage, like the Learn tab.
 */

const LS_KEY = "practice:known:v1" // { [deckId]: string[] of mastered card ids }

type Known = Record<string, string[]>

function loadKnown(): Known {
  if (typeof window === "undefined") return {}
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "{}")
  } catch {
    return {}
  }
}
function saveKnown(k: Known) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(k))
  } catch {
    /* storage may be unavailable — progress is best-effort */
  }
}

export function PracticeDecks() {
  const [known, setKnown] = useState<Known>({})
  const [activeDeck, setActiveDeck] = useState<string | null>(null)

  useEffect(() => {
    setKnown(loadKnown())
  }, [])

  const knownSet = (deckId: string) => new Set(known[deckId] || [])

  const markKnown = (deckId: string, cardId: string) => {
    setKnown((prev) => {
      const set = new Set(prev[deckId] || [])
      set.add(cardId)
      const next = { ...prev, [deckId]: [...set] }
      saveKnown(next)
      return next
    })
  }

  const resetDeck = (deckId: string) => {
    setKnown((prev) => {
      const next = { ...prev, [deckId]: [] }
      saveKnown(next)
      return next
    })
  }

  // ── Deck picker ────────────────────────────────────────────────
  if (!activeDeck) {
    return (
      <div>
        <p className="mb-4 text-sm text-foreground/60">
          Pick a deck and drill. Say the answer before you reveal it — honest self-grading is what makes
          flashcards work. Mastered cards stay put; &ldquo;review again&rdquo; cards keep coming back.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {PRACTICE_DECKS.map((d) => {
            const mastered = knownSet(d.id).size
            const pct = Math.round((mastered / d.cards.length) * 100)
            return (
              <button
                key={d.id}
                onClick={() => setActiveDeck(d.id)}
                className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] p-4 text-left transition-all hover:-translate-y-0.5 hover:border-white/25"
              >
                <div
                  className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-40 blur-2xl"
                  style={{ background: `radial-gradient(circle, ${d.accent[0]}, transparent 70%)` }}
                />
                <div className="relative">
                  <h3 className="mb-1 text-sm font-medium text-foreground">{d.title}</h3>
                  <p className="mb-3 text-xs leading-relaxed text-foreground/55">{d.blurb}</p>
                  <div className="mb-1.5 flex items-center justify-between font-mono text-[10px] text-foreground/45">
                    <span>{d.cards.length} cards</span>
                    <span>{mastered}/{d.cards.length} mastered</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${d.accent[0]}, ${d.accent[1]})` }}
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

  const deck = PRACTICE_DECKS.find((d) => d.id === activeDeck)!
  return (
    <DeckSession
      deck={deck}
      known={knownSet(deck.id)}
      onKnown={(cardId) => markKnown(deck.id, cardId)}
      onReset={() => resetDeck(deck.id)}
      onBack={() => setActiveDeck(null)}
    />
  )
}

function DeckSession({
  deck,
  known,
  onKnown,
  onReset,
  onBack,
}: {
  deck: PracticeDeck
  known: Set<string>
  onKnown: (cardId: string) => void
  onReset: () => void
  onBack: () => void
}) {
  // Cards still in rotation this session, in deck order.
  const remaining = useMemo(() => deck.cards.filter((c) => !known.has(c.id)), [deck, known])
  const [cursor, setCursor] = useState(0)
  const [revealed, setRevealed] = useState(false)

  const mastered = deck.cards.length - remaining.length
  const pct = Math.round((mastered / deck.cards.length) * 100)
  const card = remaining.length > 0 ? remaining[cursor % remaining.length] : null

  const advance = () => {
    setRevealed(false)
    // Same index now points at the next card after a "knew it" removal;
    // for "review again" we step forward explicitly.
    setCursor((i) => (remaining.length > 1 ? (i + 1) % remaining.length : 0))
  }

  const grade = (knewIt: boolean) => {
    if (!card) return
    if (knewIt) {
      onKnown(card.id) // removal shifts the list; keep cursor in range
      setRevealed(false)
      setCursor((i) => (remaining.length - 1 > 0 ? i % (remaining.length - 1) : 0))
    } else {
      advance()
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs text-foreground/55 transition-colors hover:text-foreground"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> All decks
        </button>
        <button
          onClick={onReset}
          className="inline-flex items-center gap-1.5 font-mono text-[11px] text-foreground/45 transition-colors hover:text-foreground"
        >
          <RotateCcw className="h-3 w-3" /> Reset deck
        </button>
      </div>

      {/* Deck header + progress */}
      <div className="mb-5 rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <div className="mb-1 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: deck.accent[0] }} />
          <span className="font-mono text-[10px] uppercase tracking-wider text-foreground/45">
            {deck.cards.length} cards · {mastered} mastered
          </span>
        </div>
        <h3 className="text-lg font-medium text-foreground">{deck.title}</h3>
        <div className="mt-3 flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${deck.accent[0]}, ${deck.accent[1]})` }}
            />
          </div>
          <span className="font-mono text-[11px] text-foreground/60">{pct}%</span>
        </div>
      </div>

      {card ? (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
          <div className="mb-3 flex items-center gap-1.5">
            <Brain className="h-3.5 w-3.5" style={{ color: deck.accent[0] }} />
            <span className="font-mono text-[10px] uppercase tracking-wider text-foreground/40">
              Prompt · {remaining.length} left in rotation
            </span>
          </div>
          <p className="text-sm font-medium leading-relaxed text-foreground/90 md:text-base">{card.front}</p>

          {revealed ? (
            <>
              <div
                className="mt-4 rounded-lg border px-3.5 py-3"
                style={{ borderColor: `${deck.accent[0]}40`, background: `${deck.accent[0]}0f` }}
              >
                <p className="mb-1 font-mono text-[10px] uppercase tracking-wider" style={{ color: deck.accent[0] }}>
                  Answer
                </p>
                <p className="text-xs leading-relaxed text-foreground/80 md:text-sm">{card.back}</p>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={() => grade(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/20 px-4 py-2 text-xs font-medium text-emerald-200 transition-colors hover:bg-emerald-500/30"
                >
                  <Check className="h-3.5 w-3.5" /> Knew it
                </button>
                <button
                  onClick={() => grade(false)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.04] px-4 py-2 text-xs font-medium text-foreground/80 transition-colors hover:bg-white/10"
                >
                  <ArrowRight className="h-3.5 w-3.5" /> Review again
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={() => setRevealed(true)}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.04] px-4 py-2 text-xs font-medium text-foreground/85 transition-colors hover:bg-white/10"
            >
              <Eye className="h-3.5 w-3.5" /> Reveal answer
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-6 py-10 text-center">
          <Trophy className="mb-2 h-6 w-6 text-emerald-300" />
          <p className="text-sm font-medium text-emerald-100">Deck mastered — every card retired.</p>
          <p className="mt-1 max-w-sm text-xs leading-relaxed text-emerald-100/70">
            Come back in a few days and reset the deck — spaced repetition beats one perfect run.
          </p>
          <button
            onClick={onReset}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/30 px-4 py-2 font-mono text-[11px] text-emerald-200 transition-colors hover:bg-emerald-400/10"
          >
            <RotateCcw className="h-3 w-3" /> Start over
          </button>
        </div>
      )}
    </div>
  )
}
