"use client"

import { useEffect, useState } from "react"
import { Check, Loader2, Plus, Sprout, Trash2, Pencil } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { ALL_LEARN_COURSES } from "@/lib/course-lessons"
import { decksForCourse, phaseOf } from "@/lib/course-decks"
import { Card, CardTitle, Button, fieldClass, FieldLabel } from "@/components/ui/shell"
import { useToast } from "@/components/toast"

/* ── Student journey map (admin Students tab) ─────────────────────
   Where each student is on every course they've touched: sessions done,
   current phase, and the tools that course teaches — the mentor's
   pre-session glance. */

export function StudentJourneyMap({ rows }: { rows: { kind: string; group_id: string }[] }) {
  const touched = ALL_LEARN_COURSES.filter((c) =>
    rows.some((r) => r.group_id === c.id && (r.kind === "deck" || r.kind === "lesson")),
  )
  if (touched.length === 0) return null

  return (
    <div className="mt-2.5 space-y-1.5">
      {touched.map((c) => {
        const total = decksForCourse(c.id).length
        const decksDone = rows.filter((r) => r.kind === "deck" && r.group_id === c.id).length
        const lessonsDone = rows.filter((r) => r.kind === "lesson" && r.group_id === c.id).length
        const complete = decksDone >= total
        const phase = complete ? "Complete" : phaseOf(decksDone, total)
        const pct = total ? Math.round((Math.max(decksDone, lessonsDone) / total) * 100) : 0
        return (
          <div key={c.id} className="flex items-center gap-2.5">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: c.accent[0] }} />
            <span className="w-32 shrink-0 truncate text-[11px] text-foreground/70">{c.title}</span>
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full"
                style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${c.accent[0]}, ${c.accent[1]})` }}
              />
            </div>
            <span className="shrink-0 font-mono text-[10px] text-foreground/50">
              S{Math.min(decksDone, total)}/{total} · {phase}
            </span>
            <span className="hidden max-w-[180px] shrink-0 truncate font-mono text-[10px] text-foreground/35 lg:block">
              {c.tools.slice(0, 3).join(" · ")}
            </span>
          </div>
        )
      })}
    </div>
  )
}

/* ── Mentor growth (admin Growth tab) ─────────────────────────────
   The mentor's own learning journey for the year, phased by quarter.
   Lifecycle mirrors the teaching philosophy: planned → learning →
   teaching → done — you haven't finished learning it until you've
   taught it. */

interface GoalRow {
  id: string
  year: number
  quarter: number
  title: string
  notes: string
  status: "planned" | "learning" | "teaching" | "done"
}

const STATUS_FLOW: GoalRow["status"][] = ["planned", "learning", "teaching", "done"]
const STATUS_STYLE: Record<GoalRow["status"], string> = {
  planned: "border-white/20 bg-white/[0.05] text-foreground/60",
  learning: "border-sky-400/40 bg-sky-400/10 text-sky-200",
  teaching: "border-amber-400/40 bg-amber-400/10 text-amber-200",
  done: "border-emerald-400/40 bg-emerald-400/10 text-emerald-200",
}

export function MentorGrowth() {
  const { toast } = useToast()
  const year = new Date().getFullYear()
  const currentQuarter = Math.floor(new Date().getMonth() / 3) + 1
  const [goals, setGoals] = useState<GoalRow[]>([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState("")
  const [quarter, setQuarter] = useState(currentQuarter)
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)
  const [editingNotes, setEditingNotes] = useState<string | null>(null)
  const [notesDraft, setNotesDraft] = useState("")

  const load = async () => {
    if (!supabase) return
    const { data } = await supabase
      .from("mentor_goals")
      .select("*")
      .eq("year", year)
      .order("quarter", { ascending: true })
      .order("created_at", { ascending: true })
    if (data) setGoals(data as GoalRow[])
    setLoading(false)
  }
  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const addGoal = async () => {
    if (!supabase || !title.trim()) return
    setSaving(true)
    const { error } = await supabase
      .from("mentor_goals")
      .insert({ year, quarter, title: title.trim(), notes: notes.trim() })
    setSaving(false)
    if (error) return toast(error.message, "error")
    setTitle("")
    setNotes("")
    toast("Goal added to your journey.", "success")
    load()
  }

  const cycleStatus = async (g: GoalRow) => {
    if (!supabase) return
    const next = STATUS_FLOW[(STATUS_FLOW.indexOf(g.status) + 1) % STATUS_FLOW.length]
    setGoals((prev) => prev.map((x) => (x.id === g.id ? { ...x, status: next } : x)))
    await supabase.from("mentor_goals").update({ status: next, updated_at: new Date().toISOString() }).eq("id", g.id)
  }

  const saveNotes = async (g: GoalRow) => {
    if (!supabase) return
    setGoals((prev) => prev.map((x) => (x.id === g.id ? { ...x, notes: notesDraft } : x)))
    setEditingNotes(null)
    await supabase.from("mentor_goals").update({ notes: notesDraft, updated_at: new Date().toISOString() }).eq("id", g.id)
  }

  const remove = async (id: string) => {
    if (!supabase) return
    setGoals((prev) => prev.filter((x) => x.id !== id))
    await supabase.from("mentor_goals").delete().eq("id", id)
  }

  const doneCount = goals.filter((g) => g.status === "done").length

  return (
    <>
      <Card className="mb-6">
        <CardTitle
          icon={<Sprout className="h-4 w-4" />}
          title={`Your learning journey — ${year}`}
          hint="Evolution is teaching and learning at the same time. Phase your own goals across the year; a goal isn't done when you've learned it — it's done when you've taught it."
        />

        {/* Year mapped by quarter */}
        <div className="mb-5 grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((q) => {
            const inQ = goals.filter((g) => g.quarter === q)
            const doneQ = inQ.filter((g) => g.status === "done").length
            const isNow = q === currentQuarter
            return (
              <div
                key={q}
                className={`rounded-lg border px-3 py-2 text-center ${
                  isNow ? "border-sky-400/40 bg-sky-400/10" : "border-white/10 bg-white/[0.03]"
                }`}
              >
                <p className={`font-mono text-[10px] uppercase tracking-wider ${isNow ? "text-sky-300" : "text-foreground/45"}`}>
                  Q{q}{isNow ? " · now" : ""}
                </p>
                <p className="mt-0.5 text-sm text-foreground/80">
                  {inQ.length === 0 ? "—" : `${doneQ}/${inQ.length} done`}
                </p>
              </div>
            )
          })}
        </div>

        {/* Add a goal */}
        <div className="grid gap-3 md:grid-cols-[1fr_110px]">
          <div>
            <FieldLabel htmlFor="growth-title">What do you want to learn?</FieldLabel>
            <input
              id="growth-title"
              className={fieldClass}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Microsoft Fabric, Python for analytics, storytelling with data"
            />
          </div>
          <div>
            <FieldLabel htmlFor="growth-quarter">Quarter</FieldLabel>
            <select id="growth-quarter" className={fieldClass} value={quarter} onChange={(e) => setQuarter(Number(e.target.value))}>
              {[1, 2, 3, 4].map((q) => (
                <option key={q} value={q}>Q{q}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-3">
          <FieldLabel htmlFor="growth-notes">Notes — why this, and how you&apos;ll teach it</FieldLabel>
          <textarea
            id="growth-notes"
            className={`${fieldClass} min-h-[70px]`}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Why it matters for students, what you'll build with it, where it could become a session or article…"
          />
        </div>
        <Button className="mt-3" onClick={addGoal} disabled={saving || !title.trim()}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add to journey
        </Button>
      </Card>

      <Card>
        <CardTitle
          icon={<Check className="h-4 w-4" />}
          title={`Goals (${doneCount}/${goals.length} taught & done)`}
          hint="Click the status to advance it: planned → learning → teaching → done."
        />
        {loading ? (
          <p className="text-sm text-foreground/50">Loading…</p>
        ) : goals.length === 0 ? (
          <p className="text-sm text-foreground/50">
            No goals yet. Add the first thing you want to learn this year — then phase the rest of the year above.
          </p>
        ) : (
          <ul className="space-y-2">
            {goals.map((g) => (
              <li key={g.id} className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="rounded-full bg-white/10 px-2 py-0.5 font-mono text-[10px] text-foreground/60">Q{g.quarter}</span>
                    <p className={`truncate text-sm ${g.status === "done" ? "text-foreground/60 line-through" : "text-foreground"}`}>
                      {g.title}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => cycleStatus(g)}
                      title="Advance status"
                      className={`rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide transition-colors ${STATUS_STYLE[g.status]}`}
                    >
                      {g.status}
                    </button>
                    <button
                      onClick={() => {
                        setEditingNotes(editingNotes === g.id ? null : g.id)
                        setNotesDraft(g.notes)
                      }}
                      aria-label="Edit notes"
                      className="rounded-lg border border-white/10 p-1.5 text-foreground/50 transition-colors hover:text-foreground"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => remove(g.id)}
                      aria-label="Delete goal"
                      className="rounded-lg border border-white/10 p-1.5 text-foreground/50 transition-colors hover:border-red-400/40 hover:text-red-300"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                {editingNotes === g.id ? (
                  <div className="mt-2">
                    <textarea
                      className={`${fieldClass} min-h-[60px]`}
                      value={notesDraft}
                      onChange={(e) => setNotesDraft(e.target.value)}
                      placeholder="Notes…"
                    />
                    <Button variant="secondary" className="mt-2 !px-3 !py-1.5 text-xs" onClick={() => saveNotes(g)}>
                      Save notes
                    </Button>
                  </div>
                ) : (
                  g.notes && <p className="mt-1.5 text-xs leading-relaxed text-foreground/60">{g.notes}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  )
}
