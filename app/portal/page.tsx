"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  CalendarClock,
  LogOut,
  User as UserIcon,
  BookOpen,
  CheckCircle2,
  Clock,
  Map,
  ArrowLeft,
  Loader2,
  Check,
  GraduationCap,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/use-auth"
import { BookingCalendar } from "@/components/booking-calendar"
import { useToast } from "@/components/toast"
import { QuoteOfDay } from "@/components/quote-of-day"
import { PageBackdrop, Card, CardTitle, Button, fieldClass, FieldLabel } from "@/components/ui/shell"

interface ClassItem {
  id: string
  title: string
  description: string
  duration: string
}
interface Booking {
  id: string
  class_title: string
  scheduled_at: string
  status: string
  notes: string
  payment_status?: string
}
interface RoadmapTask {
  id: string
  track: string
  day: number
  title: string
  description: string
}

// After-work-hours slots only (1–2 hour evening classes).
const EVENING_SLOTS = ["18:00", "19:00", "20:00", "21:00"]

export default function PortalPage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  const [classes, setClasses] = useState<ClassItem[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [profile, setProfile] = useState({ full_name: "", experience: "", goals: "" })
  const [roadmap, setRoadmap] = useState<RoadmapTask[]>([])
  const [done, setDone] = useState<Set<string>>(new Set())
  const [payInfo, setPayInfo] = useState<Record<string, any> | null>(null)

  const [selectedClass, setSelectedClass] = useState("")
  const [date, setDate] = useState("")
  const [slot, setSlot] = useState("")
  const [notes, setNotes] = useState("")
  const { toast } = useToast()
  const [savingProfile, setSavingProfile] = useState(false)
  const [booking, setBooking] = useState(false)

  // Redirect out if not logged in.
  useEffect(() => {
    if (!loading && !user) router.replace("/login")
  }, [loading, user, router])

  // Load classes, bookings and profile.
  useEffect(() => {
    if (!user || !supabase) return
    const load = async () => {
      const [{ data: cls }, { data: bks }, { data: prof }, { data: tasks }, { data: prog }, { data: st }] =
        await Promise.all([
          supabase.from("classes").select("id,title,description,duration").eq("active", true),
          supabase.from("class_bookings").select("id,class_title,scheduled_at,status,notes,payment_status").order("scheduled_at", { ascending: true }),
          supabase.from("profiles").select("full_name,experience,goals").eq("id", user.id).single(),
          supabase.from("roadmap_tasks").select("id,track,day,title,description").order("day", { ascending: true }),
          supabase.from("task_progress").select("task_id,completed").eq("user_id", user.id),
          supabase.from("settings").select("*").eq("id", 1).single(),
        ])
      if (st) setPayInfo(st)
      if (cls) {
        setClasses(cls)
        if (cls[0]) setSelectedClass((s) => s || cls[0].id)
      }
      if (bks) setBookings(bks as Booking[])
      if (prof) setProfile({ full_name: prof.full_name || "", experience: prof.experience || "", goals: prof.goals || "" })
      if (tasks) setRoadmap(tasks as RoadmapTask[])
      if (prog) setDone(new Set(prog.filter((p: { completed: boolean }) => p.completed).map((p: { task_id: string }) => p.task_id)))
    }
    load()
  }, [user])

  const toggleTask = async (taskId: string) => {
    if (!supabase || !user) return
    const isDone = done.has(taskId)
    // Optimistic update
    setDone((prev) => {
      const next = new Set(prev)
      isDone ? next.delete(taskId) : next.add(taskId)
      return next
    })
    await supabase.from("task_progress").upsert({
      user_id: user.id,
      task_id: taskId,
      completed: !isDone,
      updated_at: new Date().toISOString(),
    })
  }

  const minDate = useMemo(() => new Date().toISOString().split("T")[0], [])

  // Which day+slot combos this student already has, so the calendar can grey them out.
  const takenSlots = useMemo(() => {
    const set = new Set<string>()
    for (const b of bookings) {
      const d = new Date(b.scheduled_at)
      const day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
      const time = `${String(d.getHours()).padStart(2, "0")}:00`
      set.add(`${day}|${time}`)
    }
    return set
  }, [bookings])

  const handleBook = async () => {
    if (!supabase || !user) return
    if (!selectedClass || !date || !slot) {
      toast("Pick a class, a date and an evening slot.", "info")
      return
    }
    const cls = classes.find((c) => c.id === selectedClass)
    const scheduled_at = new Date(`${date}T${slot}:00`).toISOString()

    setBooking(true)
    const { error } = await supabase.from("class_bookings").insert({
      user_id: user.id,
      class_id: selectedClass,
      class_title: cls?.title || "Class",
      scheduled_at,
      notes,
    })
    setBooking(false)

    if (error) {
      toast(error.message, "error")
      return
    }
    toast("Class requested! Pay via UPI, then Rakshit confirms your evening slot.", "success")
    setNotes("")
    const { data: bks } = await supabase
      .from("class_bookings")
      .select("id,class_title,scheduled_at,status,notes,payment_status")
      .order("scheduled_at", { ascending: true })
    if (bks) setBookings(bks as Booking[])
  }

  const handleSaveProfile = async () => {
    if (!supabase || !user) return
    setSavingProfile(true)
    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      full_name: profile.full_name,
      experience: profile.experience,
      goals: profile.goals,
      updated_at: new Date().toISOString(),
    })
    setSavingProfile(false)
    toast(error ? error.message : "Profile saved.", error ? "error" : "success")
  }

  const handleLogout = async () => {
    await supabase?.auth.signOut()
    router.replace("/")
  }

  if (loading || !user) {
    return (
      <main className="relative min-h-[100dvh] text-foreground">
        <PageBackdrop />
        <div className="relative z-10 mx-auto max-w-5xl px-5 py-8 md:py-12">
          <div className="mb-8 h-10 w-48 animate-pulse rounded-lg bg-white/10" />
          <div className="grid gap-6 md:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-48 animate-pulse rounded-2xl border border-white/10 bg-white/[0.03]"
                style={{ animationDelay: `${i * 120}ms` }}
              />
            ))}
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="relative min-h-[100dvh] text-foreground">
      <PageBackdrop />

      <div className="relative z-10 mx-auto max-w-5xl px-5 py-8 md:py-12">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-foreground/50 transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> sinharakshit.com
            </Link>
            <h1 className="mt-1.5 flex items-center gap-2.5 text-2xl font-medium tracking-tight text-foreground md:text-3xl">
              <GraduationCap className="h-6 w-6 text-sky-400" />
              Student Portal
            </h1>
            <p className="mt-0.5 text-xs text-foreground/50">{user.email}</p>
          </div>
          <Button variant="secondary" onClick={handleLogout} className="shrink-0">
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </Button>
        </div>

        <QuoteOfDay className="mb-6" />

        <div className="grid gap-6 md:grid-cols-2">
          {/* Book a class */}
          <Card>
            <CardTitle
              icon={<CalendarClock className="h-4 w-4" />}
              title="Book an evening class"
              hint="Classes run after office hours · 1–2 hours per session"
            />

            <FieldLabel htmlFor="class-select">Class</FieldLabel>
            <select
              id="class-select"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className={`${fieldClass} mb-4`}
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title} · {c.duration}
                </option>
              ))}
            </select>

            <FieldLabel>Pick a date &amp; evening slot</FieldLabel>
            <div className="mb-4 rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <BookingCalendar
                takenSlots={takenSlots}
                onChange={(d, s) => {
                  setDate(d || "")
                  setSlot(s || "")
                }}
              />
            </div>

            <FieldLabel htmlFor="notes">Notes (optional)</FieldLabel>
            <textarea
              id="notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What would you like to focus on?"
              className={`${fieldClass} mb-4`}
            />

            <Button onClick={handleBook} disabled={booking} className="w-full">
              {booking && <Loader2 className="h-4 w-4 animate-spin" />}
              {booking ? "Requesting…" : "Request class"}
            </Button>

            {/* Payment methods */}
            {payInfo && <PaymentMethods p={payInfo} />}
          </Card>

          {/* My bookings */}
          <Card>
            <CardTitle icon={<BookOpen className="h-4 w-4" />} title="My classes" />
            {bookings.length === 0 ? (
              <p className="text-sm text-foreground/50">No classes booked yet.</p>
            ) : (
              <ul className="space-y-3">
                {bookings.map((b) => (
                  <li
                    key={b.id}
                    className="rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm text-foreground">{b.class_title}</span>
                      <StatusBadge status={b.status} />
                    </div>
                    <p className="mt-1 font-mono text-[11px] text-foreground/55">
                      {new Date(b.scheduled_at).toLocaleString([], {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Available classes */}
          <Card className="md:col-span-2">
            <CardTitle title="Available classes" />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {classes.map((c) => (
                <div
                  key={c.id}
                  className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
                >
                  <h3 className="mb-1 text-sm font-medium text-foreground">{c.title}</h3>
                  <p className="mb-2 text-xs leading-relaxed text-foreground/60">{c.description}</p>
                  <span className="font-mono text-[11px] text-foreground/45">{c.duration}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Learning roadmap */}
          <Card className="md:col-span-2">
            <CardTitle
              icon={<Map className="h-4 w-4" />}
              title="My learning roadmap"
              hint={`${roadmap.length > 0 ? roadmap[0].track : "Your"} track · ${done.size}/${roadmap.length} completed`}
            />

            {/* Progress bar */}
            <div className="mb-5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-400 to-amber-400 transition-all duration-500"
                style={{ width: roadmap.length ? `${(done.size / roadmap.length) * 100}%` : "0%" }}
              />
            </div>

            <ol className="space-y-2">
              {roadmap.map((task) => {
                const complete = done.has(task.id)
                return (
                  <li key={task.id}>
                    <button
                      onClick={() => toggleTask(task.id)}
                      className={`flex w-full items-start gap-3 rounded-xl border px-3.5 py-3 text-left transition-all ${
                        complete
                          ? "border-emerald-400/30 bg-emerald-400/10"
                          : "border-white/10 bg-white/[0.03] hover:border-white/25"
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-mono ${
                          complete
                            ? "border-emerald-400 bg-emerald-400 text-black"
                            : "border-white/30 text-foreground/50"
                        }`}
                      >
                        {complete ? <Check className="h-3 w-3" /> : task.day}
                      </span>
                      <span>
                        <span
                          className={`block text-sm ${
                            complete ? "text-foreground/60 line-through" : "text-foreground"
                          }`}
                        >
                          Day {task.day}: {task.title}
                        </span>
                        <span className="block text-xs leading-relaxed text-foreground/55">
                          {task.description}
                        </span>
                      </span>
                    </button>
                  </li>
                )
              })}
              {roadmap.length === 0 && (
                <p className="text-sm text-foreground/50">
                  Your roadmap will appear here once Rakshit adds your track.
                </p>
              )}
            </ol>
          </Card>

          {/* Profile */}
          <Card className="md:col-span-2">
            <CardTitle icon={<UserIcon className="h-4 w-4" />} title="My profile" />
            <div className="grid gap-3 md:grid-cols-3">
              <input
                value={profile.full_name}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                placeholder="Full name"
                aria-label="Full name"
                className={fieldClass}
              />
              <select
                value={profile.experience}
                onChange={(e) => setProfile({ ...profile, experience: e.target.value })}
                aria-label="Experience level"
                className={fieldClass}
              >
                <option value="">Experience level…</option>
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
              <input
                value={profile.goals}
                onChange={(e) => setProfile({ ...profile, goals: e.target.value })}
                placeholder="Your goals"
                aria-label="Your goals"
                className={fieldClass}
              />
            </div>
            <Button
              variant="secondary"
              onClick={handleSaveProfile}
              disabled={savingProfile}
              className="mt-4"
            >
              {savingProfile && <Loader2 className="h-4 w-4 animate-spin" />}
              {savingProfile ? "Saving…" : "Save profile"}
            </Button>
          </Card>
        </div>
      </div>
    </main>
  )
}

function formatSlot(s: string) {
  const [h] = s.split(":").map(Number)
  const end = h + 1
  const to12 = (n: number) => `${((n + 11) % 12) + 1}:00 ${n >= 12 ? "PM" : "AM"}`
  return `${to12(h)} – ${to12(end)}`
}

// Shows every payment method the mentor has enabled (UPI, PayPal, link, bank).
function PaymentMethods({ p }: { p: Record<string, any> }) {
  const upi = p.upi_enabled && (p.upi_id || p.upi_qr_url)
  const paypal = p.paypal_enabled && (p.paypal_email || p.paypal_me_link)
  const link = p.link_enabled && p.payment_link
  const bank = p.bank_enabled && p.bank_details
  const any = upi || paypal || link || bank
  if (!any) return null

  return (
    <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
      <p className="mb-3 text-[11px] text-foreground/65">
        Pay to confirm — Rakshit confirms once received.
        {p.currency_note ? ` (${p.currency_note})` : ""}
      </p>
      <div className="space-y-3">
        {upi && (
          <div className="flex items-center gap-3">
            {p.upi_qr_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.upi_qr_url} alt="UPI QR" className="h-16 w-16 rounded-lg border border-white/15 bg-white object-contain p-1" />
            )}
            <div>
              <p className="font-mono text-[10px] text-foreground/45">UPI (India)</p>
              {p.upi_id && <p className="select-all text-sm text-foreground">{p.upi_id}</p>}
            </div>
          </div>
        )}
        {paypal && (
          <div>
            <p className="font-mono text-[10px] text-foreground/45">PayPal</p>
            {p.paypal_me_link ? (
              <a href={ensureHttp(p.paypal_me_link)} target="_blank" rel="noopener noreferrer" className="text-sm text-sky-300 hover:underline">
                {p.paypal_me_link}
              </a>
            ) : (
              <p className="select-all text-sm text-foreground">{p.paypal_email}</p>
            )}
          </div>
        )}
        {link && (
          <a
            href={ensureHttp(p.payment_link)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-semibold text-[#0b0f19] transition-colors hover:bg-white/90"
          >
            {p.payment_link_label || "Pay online"} →
          </a>
        )}
        {bank && (
          <div>
            <p className="font-mono text-[10px] text-foreground/45">Bank transfer / wire</p>
            <p className="whitespace-pre-line text-xs text-foreground/75">{p.bank_details}</p>
          </div>
        )}
      </div>
      {p.pay_instructions && (
        <p className="mt-3 border-t border-white/10 pt-2 font-mono text-[10px] text-foreground/45">
          {p.pay_instructions}
        </p>
      )}
    </div>
  )
}

function ensureHttp(url: string) {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`
}

function StatusBadge({ status }: { status: string }) {
  const confirmed = status === "confirmed"
  return (
    <span
      className={`flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px] ${
        confirmed ? "bg-emerald-500/20 text-emerald-200" : "bg-amber-500/20 text-amber-200"
      }`}
    >
      {confirmed ? <CheckCircle2 className="h-2.5 w-2.5" /> : <Clock className="h-2.5 w-2.5" />}
      {status}
    </span>
  )
}
