"use client"

import { useMemo, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

// Evening, after-work-hours slots (1–2 hour classes).
const EVENING_SLOTS = ["18:00", "19:00", "20:00", "21:00"]

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
 * Calendly-style month calendar for booking an evening slot.
 * Calls onSelect(dateISO, slot) when the user picks a day + time.
 * `takenSlots` is a set of "YYYY-MM-DD|HH:MM" strings that are already booked.
 */
export function BookingCalendar({
  onChange,
  takenSlots = new Set<string>(),
}: {
  onChange: (dateISO: string | null, slot: string | null) => void
  takenSlots?: Set<string>
}) {
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
          const isPast = d < today
          const isSelected = selectedDay && fmt(selectedDay) === fmt(d)
          const isToday = fmt(d) === fmt(today)
          return (
            <button
              key={i}
              type="button"
              disabled={isPast}
              onClick={() => pickDay(day)}
              className={`flex h-9 items-center justify-center rounded-lg text-sm transition-all ${
                isSelected
                  ? "bg-foreground text-background"
                  : isPast
                    ? "text-foreground/20"
                    : "text-foreground/80 hover:bg-foreground/10"
              } ${isToday && !isSelected ? "ring-1 ring-inset ring-sky-400/60" : ""}`}
            >
              {day}
            </button>
          )
        })}
      </div>

      {/* Evening slots */}
      {selectedDay && (
        <div className="mt-4">
          <p className="mb-2 font-mono text-[11px] text-foreground/60">
            Evening slots ·{" "}
            {selectedDay.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" })}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {EVENING_SLOTS.map((s) => {
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
