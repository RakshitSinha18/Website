"use client"

import { useMemo, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

// Fallback slots if the mentor hasn't configured a weekly schedule yet.
const DEFAULT_SLOTS = ["18:00", "19:00", "20:00", "21:00"]

// Rakshit's weekly recurring availability, keyed by weekday (0=Sun … 6=Sat).
// Each value is an array of "HH:MM" start times he's open that weekday.
export type WeeklyAvailability = Record<string, string[]>

const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

function to12(h: number) {
  return `${((h + 11) % 12) + 1}:00 ${h >= 12 ? "PM" : "AM"}`
}
function slotLabel(s: string) {
  const [h] = s.split(":").map(Number)
  return `${to12(h)} – ${to12(h + 1)}`
}

/**
 * Calendly-style month calendar for booking a slot.
 * Calls onChange(dateISO, slot) when the user picks a day + time.
 *
 * `takenSlots`         — set of "YYYY-MM-DD|HH:MM" strings already booked (greyed out).
 * `weeklyAvailability` — mentor's recurring schedule by weekday; only these days/slots
 *                        are offered. If empty/undefined, every day falls back to
 *                        DEFAULT_SLOTS (preserves old behaviour before setup).
 * `blockedDates`       — specific "YYYY-MM-DD" dates that are closed (holidays).
 */
export function BookingCalendar({
  onChange,
  takenSlots = new Set<string>(),
  weeklyAvailability,
  blockedDates = [],
}: {
  onChange: (dateISO: string | null, slot: string | null) => void
  takenSlots?: Set<string>
  weeklyAvailability?: WeeklyAvailability
  blockedDates?: string[]
}) {
  // Has the mentor configured any weekly availability at all?
  const hasSchedule = useMemo(
    () => Boolean(weeklyAvailability && Object.values(weeklyAvailability).some((s) => s?.length)),
    [weeklyAvailability],
  )
  const blocked = useMemo(() => new Set(blockedDates), [blockedDates])

  // Slots offered on a given date: the mentor's weekday slots (or the default set
  // when no schedule exists). Blocked dates return no slots.
  const slotsForDate = (dateISO: string, weekday: number): string[] => {
    if (blocked.has(dateISO)) return []
    if (!hasSchedule) return DEFAULT_SLOTS
    return weeklyAvailability?.[String(weekday)] ?? []
  }
  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const [view, setView] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)

  const year = view.getFullYear()
  const month = view.getMonth()
  const firstWeekday = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const canGoPrev = new Date(year, month, 1) > new Date(today.getFullYear(), today.getMonth(), 1)

  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`

  const pickDay = (day: number) => {
    const d = new Date(year, month, day)
    setSelectedDay(d)
    setSelectedSlot(null)
    onChange(null, null)
  }
  const pickSlot = (slot: string) => {
    setSelectedSlot(slot)
    if (selectedDay) onChange(fmt(selectedDay), slot)
  }

  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  return (
    <div>
      {/* Month header */}
      <div className="mb-3 flex items-center justify-between">
        <span className="font-sans text-sm text-foreground md:text-base">
          {MONTHS[month]} {year}
        </span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => canGoPrev && setView(new Date(year, month - 1, 1))}
            disabled={!canGoPrev}
            aria-label="Previous month"
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-foreground/20 text-foreground transition-colors hover:bg-foreground/10 disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setView(new Date(year, month + 1, 1))}
            aria-label="Next month"
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-foreground/20 text-foreground transition-colors hover:bg-foreground/10"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Day grid */}
      <div className="mb-1 grid grid-cols-7 gap-1">
        {DAY_LABELS.map((d) => (
          <div key={d} className="py-1 text-center font-mono text-[10px] text-foreground/40">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />
          const d = new Date(year, month, day)
          const iso = fmt(d)
          const isPast = d < today
          // A day is unavailable if it's a holiday or the mentor has no slots that weekday.
          const noSlots = slotsForDate(iso, d.getDay()).length === 0
          const disabled = isPast || noSlots
          const isSelected = selectedDay && fmt(selectedDay) === iso
          const isToday = iso === fmt(today)
          return (
            <button
              key={i}
              type="button"
              disabled={disabled}
              onClick={() => pickDay(day)}
              title={!isPast && noSlots ? "Not available" : undefined}
              className={`flex h-9 items-center justify-center rounded-lg text-sm transition-all ${
                isSelected
                  ? "bg-foreground text-background"
                  : disabled
                    ? "text-foreground/20"
                    : "text-foreground/80 hover:bg-foreground/10"
              } ${isToday && !isSelected ? "ring-1 ring-inset ring-sky-400/60" : ""}`}
            >
              {day}
            </button>
          )
        })}
      </div>

      {/* Slots for the selected day */}
      {selectedDay && (
        <div className="mt-4">
          <p className="mb-2 font-mono text-[11px] text-foreground/60">
            Available slots ·{" "}
            {selectedDay.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" })}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {slotsForDate(fmt(selectedDay), selectedDay.getDay()).map((s) => {
              const taken = takenSlots.has(`${fmt(selectedDay)}|${s}`)
              const active = selectedSlot === s
              return (
                <button
                  key={s}
                  type="button"
                  disabled={taken}
                  onClick={() => pickSlot(s)}
                  className={`rounded-lg border px-2 py-2 text-xs transition-all ${
                    active
                      ? "border-transparent bg-gradient-to-r from-sky-500 to-amber-400 text-black"
                      : taken
                        ? "border-foreground/10 text-foreground/25 line-through"
                        : "border-foreground/20 text-foreground/80 hover:border-foreground/40"
                  }`}
                >
                  {slotLabel(s)}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
