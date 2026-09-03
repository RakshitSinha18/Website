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
  Settings,
  CalendarPlus,
  KeyRound,
  Mail,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/use-auth"
import { BookingCalendar } from "@/components/booking-calendar"
import { useToast } from "@/components/toast"
import { QuoteOfDay } from "@/components/quote-of-day"
import { PageBackdrop, Card, CardTitle, Button, fieldClass, FieldLabel } from "@/components/ui/shell"
import { startPayment, openRazorpay, type Provider } from "@/lib/payments"
import { CreditCard, FileText, Paperclip, Lightbulb } from "lucide-react"
import { IdeasBoard } from "@/components/ideas-board"
import { CourseLearn } from "@/components/course-learn"
import { TestimonialForm } from "@/components/testimonial-form"
import { PracticeDecks } from "@/components/practice-deck"
import { PortalOverview } from "@/components/portal-overview"
import { Brain } from "lucide-react"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal"

interface ClassItem {
  id: string
  title: string
  description: string
  duration: string
  price_paise?: number
}
interface BatchItem {
  id: string
  title: string
  subject: string
  description: string
  schedule: string
  start_date?: string | null
  end_date?: string | null
  price_paise: number
  capacity: number
}
interface Enrollment {
  id: string
  batch_id: string
  status: string
  payment_status: string
}
interface Booking {
  id: string
  class_title: string
  scheduled_at: string
  status: string
  notes: string
  payment_status?: string
  attendance?: string
  meet_link?: string | null
}
interface RoadmapTask {
  id: string
  track: string
  day: number
  title: string
  description: string
}

export default function PortalPage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  const [classes, setClasses] = useState<ClassItem[]>([])
  const [batches, setBatches] = useState<BatchItem[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [profile, setProfile] = useState({ full_name: "", experience: "", goals: "" })
  const [roadmap, setRoadmap] = useState<RoadmapTask[]>([])
  const [done, setDone] = useState<Set<string>>(new Set())
  const [payInfo, setPayInfo] = useState<Record<string, any> | null>(null)
  // Materials (PPT/notes) keyed by class_id, visible for confirmed bookings.
  const [materials, setMaterials] = useState<
    { id: string; class_id: string | null; batch_id: string | null; title: string; kind: string; file_url: string }[]
  >([])

  const [selectedClass, setSelectedClass] = useState("")
  const [date, setDate] = useState("")
  const [slot, setSlot] = useState("")
  const [notes, setNotes] = useState("")
  const { toast } = useToast()
  const reduceMotion = useReducedMotion()
  const [savingProfile, setSavingProfile] = useState(false)
  const [booking, setBooking] = useState(false)

  // Which tab/view is active (tabbed portal).
  const [tab, setTab] = useState<"book" | "classes" | "learn" | "practice" | "ideas" | "roadmap" | "settings">("book")

  // Redirect out if not logged in.
  useEffect(() => {
    if (!loading && !user) router.replace("/login")
  }, [loading, user, router])

  // Handle return from Stripe/Razorpay checkout.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get("paid") === "1") {
      toast("Payment received! Your booking is being confirmed.", "success")
      setTab("classes")
      window.history.replaceState({}, "", "/portal/")
    } else if (params.get("canceled") === "1") {
      toast("Payment canceled — you can try again anytime.", "info")
      window.history.replaceState({}, "", "/portal/")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Load classes, bookings and profile.
  useEffect(() => {
    if (!user || !supabase) return
    // Capture in a const so TypeScript keeps the non-null narrowing inside the closure.
    const sb = supabase
    const load = async () => {
      const [{ data: cls }, { data: bks }, { data: prof }, { data: tasks }, { data: prog }, { data: st }] =
        await Promise.all([
          sb.from("classes").select("id,title,description,duration,price_paise").eq("active", true),
          sb.from("class_bookings").select("id,class_title,scheduled_at,status,notes,payment_status,attendance,meet_link").order("scheduled_at", { ascending: true }),
          sb.from("profiles").select("full_name,experience,goals").eq("id", user.id).single(),
          sb.from("roadmap_tasks").select("id,track,day,title,description").order("day", { ascending: true }),
          sb.from("task_progress").select("task_id,completed").eq("user_id", user.id),
          sb.from("settings").select("*").eq("id", 1).single(),
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

      // Batches (active cohorts) + this student's enrollments.
      const [{ data: bt }, { data: enr }] = await Promise.all([
        sb.from("batches").select("*").eq("active", true).order("start_date", { ascending: true }),
        sb.from("batch_enrollments").select("id,batch_id,status,payment_status").eq("user_id", user.id),
      ])
      if (bt) setBatches(bt as BatchItem[])
      if (enr) setEnrollments(enr as Enrollment[])

      // Materials for classes the student can access (RLS returns only permitted rows).
      const { data: mats } = await sb
        .from("class_materials")
        .select("id,class_id,batch_id,title,kind,file_url")
        .order("created_at", { ascending: true })
      if (mats) setMaterials(mats as typeof materials)
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

  // Best-effort mentor notification. The notify function now requires a
  // signed-in user's JWT (it rejects anonymous calls to stop email abuse).
  const notifyMentor = async (payload: Record<string, unknown>) => {
    if (!supabase) return
    try {
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token
      if (!token) return
      void fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/notify`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      }).catch(() => {})
    } catch {
      /* notification is best-effort */
    }
  }

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
    // Notify the mentor about the new request (best-effort; don't block on it).
    void notifyMentor({
      table: "class_bookings",
      record: {
        name: profile.full_name || user.email,
        email: user.email,
        class_title: cls?.title || "Class",
        scheduled_at,
        notes,
      },
    })
    toast("Class requested! Complete payment to confirm your slot.", "success")
    setNotes("")
    const { data: bks } = await supabase
      .from("class_bookings")
      .select("id,class_title,scheduled_at,status,notes,payment_status,attendance,meet_link")
      .order("scheduled_at", { ascending: true })
    if (bks) setBookings(bks as Booking[])
    // Take the student straight to their bookings, where the payment button lives.
    setTab("classes")
  }

  // Enroll in a batch (creates a 'requested' enrollment; payment confirms it).
  const enrollBatch = async (batch: BatchItem) => {
    if (!supabase || !user) return
    const { error } = await supabase.from("batch_enrollments").insert({
      user_id: user.id,
      batch_id: batch.id,
      status: "requested",
    })
    if (error) {
      toast(/duplicate|unique/i.test(error.message) ? "You've already requested this batch." : error.message, "error")
      return
    }
    toast(`Requested "${batch.title}". Pay to confirm your seat.`, "success")
    // Notify the mentor (best-effort).
    void notifyMentor({
      table: "class_bookings",
      record: { name: profile.full_name || user.email, email: user.email, class_title: `Batch: ${batch.title}`, scheduled_at: batch.start_date, notes: "Batch enrollment request" },
    })
    const { data: enr } = await supabase.from("batch_enrollments").select("id,batch_id,status,payment_status").eq("user_id", user.id)
    if (enr) setEnrollments(enr as Enrollment[])
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

  // Settings → change password: reuse Supabase's reset-email flow.
  const handleChangePassword = async () => {
    if (!supabase || !user?.email) return
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/reset/`,
    })
    toast(
      error ? error.message : "Password reset link sent — check your email.",
      error ? "error" : "success",
    )
  }

  // Reschedule: student picks a new date+slot for a booking they can't make.
  const [reschedulingId, setReschedulingId] = useState<string | null>(null)
  const rescheduleBooking = async (b: Booking, newDate: string, newSlot: string) => {
    if (!supabase || !user) return
    const scheduled_at = new Date(`${newDate}T${newSlot}:00`).toISOString()
    const { error } = await supabase
      .from("class_bookings")
      .update({ scheduled_at })
      .eq("id", b.id)
    if (error) {
      toast(error.message, "error")
      return
    }
    toast("Rescheduled — your new time is saved.", "success")
    setReschedulingId(null)
    // Notify the mentor of the change (best-effort).
    void notifyMentor({
      table: "class_bookings",
      record: { name: profile.full_name || user.email, email: user.email, class_title: `${b.class_title} (RESCHEDULED)`, scheduled_at, notes: "Student rescheduled" },
    })
    const { data: bks } = await supabase
      .from("class_bookings")
      .select("id,class_title,scheduled_at,status,notes,payment_status,attendance,meet_link")
      .order("scheduled_at", { ascending: true })
    if (bks) setBookings(bks as Booking[])
  }

  // RSVP: student confirms they'll attend, or opts out for that day.
  const setAttendance = async (b: Booking, attendance: "attending" | "opted_out") => {
    if (!supabase) return
    const { error } = await supabase.from("class_bookings").update({ attendance }).eq("id", b.id)
    if (error) { toast(error.message, "error"); return }
    toast(attendance === "attending" ? "See you there! Marked as attending." : "Marked as can't-make-it — Rakshit is notified.", "success")
    setBookings((prev) => prev.map((x) => (x.id === b.id ? { ...x, attendance } : x)))
    if (attendance === "opted_out") {
      void notifyMentor({ table: "class_bookings", record: { name: profile.full_name || user?.email, email: user?.email, class_title: `${b.class_title} (CAN'T ATTEND)`, scheduled_at: b.scheduled_at, notes: "Student opted out — may want to reschedule" } })
    }
  }

  // Meeting invite: download an .ics so a confirmed session lands in any calendar.
  const addToCalendar = (b: Booking) => {
    const start = new Date(b.scheduled_at)
    const end = new Date(start.getTime() + 60 * 60 * 1000) // assume 1h
    const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Rakshit Sinha//Evening Classes//EN",
      "BEGIN:VEVENT",
      `UID:${b.id}@sinharakshit.com`,
      `DTSTAMP:${fmt(new Date())}`,
      `DTSTART:${fmt(start)}`,
      `DTEND:${fmt(end)}`,
      `SUMMARY:${b.class_title} — with Rakshit Sinha`,
      `DESCRIPTION:${(b.notes || "1-on-1 evening BI class").replace(/\n/g, " ")}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n")
    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }))
    const a = document.createElement("a")
    a.href = url
    a.download = `${b.class_title.replace(/\s+/g, "-")}.ics`
    a.click()
    URL.revokeObjectURL(url)
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
        <div className="mb-6 flex items-center justify-between gap-4">
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

        {/* At-a-glance: next session + learning progress. */}
        <PortalOverview
          bookings={bookings}
          roadmapDone={done.size}
          roadmapTotal={roadmap.length}
          onGoTo={(t) => setTab(t)}
          discordUrl={payInfo?.discord_invite_url || ""}
        />

        {/* Tab navigation */}
        <nav
          role="tablist"
          aria-label="Portal sections"
          className="mb-6 flex gap-1 overflow-x-auto rounded-xl border border-white/10 bg-white/[0.03] p-1"
        >
          {[
            { id: "book", label: "Book", icon: CalendarClock },
            { id: "classes", label: "My Classes", icon: BookOpen },
            { id: "learn", label: "Learn", icon: GraduationCap },
            { id: "practice", label: "Practice", icon: Brain },
            { id: "ideas", label: "Ideas", icon: Lightbulb },
            { id: "roadmap", label: "Roadmap", icon: Map },
            { id: "settings", label: "Settings", icon: Settings },
          ].map((t) => {
            const active = tab === t.id
            const Icon = t.icon
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t.id as typeof tab)}
                className={`flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                  active
                    ? "bg-white text-[#0b0f19] shadow-sm"
                    : "text-foreground/55 hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" /> {t.label}
              </button>
            )
          })}
        </nav>

        <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
        {tab === "book" && <QuoteOfDay className="mb-6" />}

        {/* ── BOOK TAB ─────────────────────────────────────────── */}
        {tab === "book" && (
        <div className="stagger grid gap-6 md:grid-cols-2">
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
                weeklyAvailability={payInfo?.weekly_availability ?? undefined}
                blockedDates={payInfo?.blocked_dates ?? []}
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

          {/* Available classes — click a card to select it in the booking form. */}
          <Card>
            <CardTitle title="Available classes" hint="Tap a class to select it, then pick a date above." />
            <div className="grid gap-3 sm:grid-cols-1">
              {classes.map((c) => {
                const selected = selectedClass === c.id
                const priced = (c.price_paise ?? 0) > 0
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setSelectedClass(c.id)
                      // Bring the booking form (with the calendar) into view.
                      document.getElementById("class-select")?.scrollIntoView({ behavior: "smooth", block: "center" })
                    }}
                    aria-pressed={selected}
                    className={`w-full rounded-xl border p-4 text-left transition-all hover:-translate-y-0.5 ${
                      selected
                        ? "border-sky-400/50 bg-sky-400/[0.08] ring-1 ring-inset ring-sky-400/40"
                        : "border-white/10 bg-white/[0.03] hover:border-white/25"
                    }`}
                  >
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <h3 className="text-sm font-medium text-foreground">{c.title}</h3>
                      {priced ? (
                        <span className="shrink-0 rounded-full bg-white/10 px-2 py-0.5 font-mono text-[10px] text-foreground/80">
                          ₹{((c.price_paise ?? 0) / 100).toFixed(0)}
                        </span>
                      ) : (
                        <span className="shrink-0 rounded-full bg-white/5 px-2 py-0.5 font-mono text-[10px] text-foreground/45">
                          on request
                        </span>
                      )}
                    </div>
                    <p className="mb-2 text-xs leading-relaxed text-foreground/60">{c.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] text-foreground/45">{c.duration}</span>
                      <span className={`font-mono text-[11px] ${selected ? "text-sky-300" : "text-foreground/40"}`}>
                        {selected ? "✓ selected" : "select →"}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </Card>

          {/* Batches — scheduled cohorts to enroll in. */}
          {batches.length > 0 && (
            <Card className="md:col-span-2">
              <CardTitle icon={<BookOpen className="h-4 w-4" />} title="Batches (group cohorts)" hint="Join a scheduled batch — pay to reserve your seat." />
              <div className="grid gap-3 md:grid-cols-2">
                {batches.map((b) => {
                  const enr = enrollments.find((e) => e.batch_id === b.id)
                  const confirmed = enr?.status === "confirmed"
                  return (
                    <div key={b.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <h3 className="text-sm font-medium text-foreground">{b.title}</h3>
                        <span className="shrink-0 rounded-full bg-white/10 px-2 py-0.5 font-mono text-[10px] text-foreground/80">
                          {b.price_paise > 0 ? `₹${(b.price_paise / 100).toFixed(0)}` : "on request"}
                        </span>
                      </div>
                      {b.subject && <p className="font-mono text-[10px] text-foreground/45">{b.subject}</p>}
                      {b.description && <p className="mt-1 text-xs leading-relaxed text-foreground/60">{b.description}</p>}
                      {b.schedule && <p className="mt-1.5 font-mono text-[11px] text-sky-300/80">{b.schedule}</p>}
                      {(b.start_date || b.end_date) && (
                        <p className="font-mono text-[10px] text-foreground/45">
                          {b.start_date ?? "?"}{b.end_date ? ` → ${b.end_date}` : ""}
                        </p>
                      )}
                      <div className="mt-3">
                        {confirmed ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-3 py-1 font-mono text-[10px] text-emerald-200">✓ enrolled</span>
                        ) : enr ? (
                          <span className="font-mono text-[11px] text-amber-200/80">Requested — pay to confirm (My classes)</span>
                        ) : (
                          <Button onClick={() => enrollBatch(b)} variant="secondary" className="w-full">Request seat</Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}
        </div>
        )}

        {/* ── LEARN TAB ────────────────────────────────────────── */}
        {tab === "learn" && (
        <div className="stagger">
          <Card>
            <CardTitle
              icon={<GraduationCap className="h-4 w-4" />}
              title="Learn"
              hint="Self-paced course lessons — concept, key idea, a walk-through and a hands-on exercise. Progress saves automatically."
            />
            <CourseLearn />
          </Card>
        </div>
        )}

        {/* ── PRACTICE TAB ─────────────────────────────────────── */}
        {tab === "practice" && (
        <div className="stagger">
          <Card>
            <CardTitle
              icon={<Brain className="h-4 w-4" />}
              title="Practice"
              hint="Active-recall flashcards — SQL, DAX, Excel and dashboard judgment. Grade yourself honestly; progress saves automatically."
            />
            <PracticeDecks />
          </Card>
        </div>
        )}

        {/* ── IDEAS TAB ────────────────────────────────────────── */}
        {tab === "ideas" && (
        <div className="stagger">
          <Card><IdeasBoard /></Card>
        </div>
        )}

        {/* ── MY CLASSES TAB ───────────────────────────────────── */}
        {tab === "classes" && (
        <div className="stagger">
          <Card>
            <CardTitle icon={<BookOpen className="h-4 w-4" />} title="My classes" />
            {bookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/15 px-6 py-12 text-center">
                <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-sky-400/15 to-amber-400/10 text-sky-300">
                  <CalendarClock className="h-6 w-6" />
                </span>
                <p className="text-sm font-medium text-foreground">No classes yet</p>
                <p className="mt-1 max-w-xs text-xs leading-relaxed text-foreground/50">
                  Pick a class and an evening slot to get started — your booked sessions and materials will appear here.
                </p>
                <Button onClick={() => setTab("book")} variant="secondary" className="mt-4">
                  <CalendarPlus className="h-4 w-4" /> Book your first class
                </Button>
              </div>
            ) : (
              <RevealGroup className="space-y-3">
                {bookings.map((b) => {
                  const confirmed = b.status === "confirmed"
                  return (
                    <RevealItem
                      key={b.id}
                      className="rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-3 transition-colors hover:border-white/20"
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
                      {/* Meeting invite + materials for confirmed sessions. */}
                      {confirmed ? (
                        <>
                          {b.meet_link && (
                            <a
                              href={b.meet_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/20 px-3 py-1.5 font-mono text-[11px] text-emerald-200 transition-colors hover:bg-emerald-500/30"
                            >
                              <CalendarClock className="h-3.5 w-3.5" /> Join Google Meet
                            </a>
                          )}
                          <div className="mt-2 flex flex-wrap gap-2">
                            <button
                              onClick={() => addToCalendar(b)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-sky-400/30 bg-sky-400/10 px-3 py-1.5 font-mono text-[11px] text-sky-200 transition-colors hover:bg-sky-400/20"
                            >
                              <CalendarPlus className="h-3.5 w-3.5" /> Add to calendar
                            </button>
                            <button
                              onClick={() => setReschedulingId(reschedulingId === b.id ? null : b.id)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.04] px-3 py-1.5 font-mono text-[11px] text-foreground/80 transition-colors hover:bg-white/10"
                            >
                              <CalendarClock className="h-3.5 w-3.5" /> {reschedulingId === b.id ? "Cancel" : "Reschedule"}
                            </button>
                          </div>
                          {/* RSVP — confirm attendance or opt out for the day. */}
                          <div className="mt-2 flex items-center gap-2">
                            <span className="font-mono text-[10px] text-foreground/45">Attending?</span>
                            <button
                              onClick={() => setAttendance(b, "attending")}
                              className={`rounded-full px-2.5 py-1 font-mono text-[10px] transition-colors ${b.attendance === "attending" ? "bg-emerald-500/25 text-emerald-200" : "border border-white/15 text-foreground/60 hover:bg-white/10"}`}
                            >
                              Yes, I&apos;ll be there
                            </button>
                            <button
                              onClick={() => setAttendance(b, "opted_out")}
                              className={`rounded-full px-2.5 py-1 font-mono text-[10px] transition-colors ${b.attendance === "opted_out" ? "bg-amber-500/25 text-amber-200" : "border border-white/15 text-foreground/60 hover:bg-white/10"}`}
                            >
                              Can&apos;t make it
                            </button>
                          </div>
                          {reschedulingId === b.id && (
                            <div className="mt-2 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                              <p className="mb-2 font-mono text-[11px] text-foreground/60">Pick a new date &amp; slot</p>
                              <BookingCalendar
                                takenSlots={takenSlots}
                                weeklyAvailability={payInfo?.weekly_availability ?? undefined}
                                blockedDates={payInfo?.blocked_dates ?? []}
                                onChange={(d, s) => { if (d && s) rescheduleBooking(b, d, s) }}
                              />
                            </div>
                          )}
                          <SessionMaterials
                            materials={materials.filter(
                              (m) => m.class_id === classId(classes, b.class_title),
                            )}
                          />
                        </>
                      ) : (
                        <PayControls
                          booking={b}
                          amountPaise={classPrice(classes, b.class_title)}
                          email={user.email ?? undefined}
                          payInfo={payInfo}
                        />
                      )}
                    </RevealItem>
                  )
                })}
              </RevealGroup>
            )}
          </Card>
          {/* After a session, invite the student to share their experience. */}
          {bookings.some((b) => b.status === "confirmed") && (
            <TestimonialForm defaultName={profile.full_name} />
          )}
        </div>
        )}

        {/* ── ROADMAP TAB ──────────────────────────────────────── */}
        {tab === "roadmap" && (
        <div className="stagger">
          <Card>
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
        </div>
        )}

        {/* ── SETTINGS TAB ─────────────────────────────────────── */}
        {tab === "settings" && (
        <div className="stagger space-y-6">
          {/* Profile */}
          <Card>
            <CardTitle icon={<UserIcon className="h-4 w-4" />} title="Profile" hint="How Rakshit sees you and tailors your roadmap." />
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

          {/* Account */}
          <Card>
            <CardTitle icon={<KeyRound className="h-4 w-4" />} title="Account" hint="Sign-in email and security." />
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-3">
              <Mail className="h-4 w-4 shrink-0 text-foreground/40" />
              <div className="min-w-0">
                <p className="font-mono text-[10px] text-foreground/45">Signed in as</p>
                <p className="truncate text-sm text-foreground">{user.email}</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="secondary" onClick={handleChangePassword}>
                <KeyRound className="h-3.5 w-3.5" /> Change password
              </Button>
              <Button variant="secondary" onClick={handleLogout}>
                <LogOut className="h-3.5 w-3.5" /> Sign out
              </Button>
            </div>
            {/* 2FA is planned — see SECURITY-2FA.md. */}
            <p className="mt-3 flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 font-mono text-[11px] text-foreground/45">
              <ShieldCheck className="h-3.5 w-3.5" /> Two-factor authentication — coming soon.
            </p>
          </Card>

          {/* Preferences */}
          <Card>
            <CardTitle icon={<Settings className="h-4 w-4" />} title="Preferences" />
            <PreferenceToggles />
          </Card>

          {/* Danger zone */}
          <Card className="border-red-400/20">
            <CardTitle icon={<AlertTriangle className="h-4 w-4" />} title="Danger zone" hint="Irreversible actions." />
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-400/20 bg-red-500/[0.04] px-3.5 py-3">
              <div>
                <p className="text-sm text-foreground">Delete account</p>
                <p className="text-xs text-foreground/50">
                  Removes your access. To fully erase your data, email Rakshit — deletion needs
                  admin confirmation.
                </p>
              </div>
              <a
                href="mailto:rsinha1369@gmail.com?subject=Please delete my account"
                className="shrink-0 rounded-lg border border-red-400/40 px-3 py-1.5 font-mono text-[11px] text-red-300 transition-colors hover:bg-red-500/10"
              >
                Request deletion
              </a>
            </div>
          </Card>
        </div>
        )}
        </motion.div>
        </AnimatePresence>
      </div>
    </main>
  )
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

// Look up a booking's price from the loaded classes (fallback 0 → "contact").
function classPrice(classes: ClassItem[], title: string): number {
  return classes.find((c) => c.title === title)?.price_paise ?? 0
}

function classId(classes: ClassItem[], title: string): string | undefined {
  return classes.find((c) => c.title === title)?.id
}

// Downloadable PPT / notes for a confirmed session.
function SessionMaterials({
  materials,
}: {
  materials: { id: string; title: string; kind: string; file_url: string }[]
}) {
  if (materials.length === 0) return null
  const transcripts = materials.filter((m) => m.kind === "transcript")
  const others = materials.filter((m) => m.kind !== "transcript")
  return (
    <div className="mt-3 space-y-3">
      {/* Transcripts — surfaced separately so they're easy to read. */}
      {transcripts.length > 0 && (
        <div className="rounded-lg border border-sky-400/20 bg-sky-400/[0.05] p-2.5">
          <p className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-sky-300/70">
            Transcripts
          </p>
          <ul className="space-y-1">
            {transcripts.map((m) => (
              <li key={m.id}>
                <a
                  href={m.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-sky-200 hover:underline"
                >
                  <BookOpen className="h-3.5 w-3.5" /> Read: {m.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
      {others.length > 0 && (
        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-2.5">
          <p className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-foreground/40">
            Class materials
          </p>
          <ul className="space-y-1">
            {others.map((m) => (
              <li key={m.id}>
                <a
                  href={m.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-sky-300 hover:underline"
                >
                  {m.kind === "ppt" ? <FileText className="h-3.5 w-3.5" /> : <Paperclip className="h-3.5 w-3.5" />}
                  {m.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// Per-booking payment controls: student picks a method, accepts T&C, then pays.
// UPI (manual) is offered only if the mentor configured a UPI ID/QR; otherwise the
// flow defaults to Razorpay (the in-app gateway) until those settings are added.
function PayControls({
  booking,
  amountPaise,
  email,
  payInfo,
}: {
  booking: Booking
  amountPaise: number
  email?: string
  payInfo?: Record<string, any> | null
}) {
  const { toast } = useToast()
  const [agree, setAgree] = useState(false)
  const [busy, setBusy] = useState(false)

  // Is manual UPI available? (mentor added a UPI id or QR and enabled it)
  const upiAvailable = Boolean(payInfo?.upi_enabled && (payInfo?.upi_id || payInfo?.upi_qr_url))
  // Razorpay is the default method until the mentor changes payment settings.
  const [method, setMethod] = useState<"razorpay" | "upi">("razorpay")

  if (!amountPaise) {
    return (
      <p className="mt-2 font-mono text-[11px] text-foreground/45">
        Awaiting confirmation — Rakshit will share payment details.
      </p>
    )
  }

  const pay = async (provider: Provider) => {
    if (!agree) {
      toast("Please accept the Terms & Refund policy first.", "info")
      return
    }
    setBusy(true)
    const res = await startPayment({
      provider,
      bookingId: booking.id,
      amount: amountPaise,
      currency: provider === "razorpay" ? "INR" : "USD",
      title: booking.class_title,
    })
    setBusy(false)
    if (!res.ok) {
      toast(res.error ?? "Payment could not start.", "error")
      return
    }
    if (res.razorpay)
      openRazorpay(res.razorpay, {
        name: booking.class_title,
        email,
        onVerified: () => {
          toast("Payment verified! Your booking is confirmed.", "success")
          window.location.assign("/portal/?paid=1")
        },
        onError: (msg) => toast(msg, "error"),
        onDismiss: () => toast("Payment canceled — you can try again anytime.", "info"),
      })
    // Stripe navigates away on success.
  }

  return (
    <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.02] p-3">
      <p className="mb-2 text-sm text-foreground">
        Pay ₹{(amountPaise / 100).toFixed(0)} to confirm your slot
      </p>
      <label className="mb-3 flex cursor-pointer items-start gap-2 text-[11px] text-foreground/60">
        <input
          type="checkbox"
          checked={agree}
          onChange={(e) => setAgree(e.target.checked)}
          className="mt-0.5 h-3.5 w-3.5 accent-sky-500"
        />
        <span>
          I accept the{" "}
          <a href="/terms/" target="_blank" className="text-sky-300 underline">Terms</a>,{" "}
          <a href="/refund/" target="_blank" className="text-sky-300 underline">Refund policy</a> and{" "}
          <a href="/policy/" target="_blank" className="text-sky-300 underline">Class policy</a>.
        </span>
      </label>
      {/* Method chooser — only shown if UPI is also available; else Razorpay only. */}
      {upiAvailable && (
        <div className="mb-3">
          <p className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-foreground/45">Choose how to pay</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMethod("razorpay")}
              aria-pressed={method === "razorpay"}
              className={`flex-1 rounded-lg border px-3 py-2 text-left transition-all ${method === "razorpay" ? "border-sky-400/50 bg-sky-400/[0.08]" : "border-white/10 bg-white/[0.03] hover:border-white/25"}`}
            >
              <span className="flex items-center gap-1.5 text-xs text-foreground"><CreditCard className="h-3.5 w-3.5" /> Card / UPI (instant)</span>
              <span className="font-mono text-[10px] text-foreground/45">Auto-confirms · Razorpay</span>
            </button>
            <button
              type="button"
              onClick={() => setMethod("upi")}
              aria-pressed={method === "upi"}
              className={`flex-1 rounded-lg border px-3 py-2 text-left transition-all ${method === "upi" ? "border-sky-400/50 bg-sky-400/[0.08]" : "border-white/10 bg-white/[0.03] hover:border-white/25"}`}
            >
              <span className="text-xs text-foreground">Pay via UPI</span>
              <span className="block font-mono text-[10px] text-foreground/45">Manual · mentor confirms</span>
            </button>
          </div>
        </div>
      )}

      {/* Manual UPI details, shown when UPI method is chosen. */}
      {upiAvailable && method === "upi" ? (
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
          <div className="flex items-center gap-3">
            {payInfo?.upi_qr_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={payInfo.upi_qr_url} alt="UPI QR" className="h-16 w-16 rounded-lg border border-white/15 bg-white object-contain p-1" />
            )}
            <div>
              <p className="font-mono text-[10px] text-foreground/45">Pay ₹{(amountPaise / 100).toFixed(0)} to this UPI ID</p>
              {payInfo?.upi_id && <p className="select-all text-sm text-foreground">{payInfo.upi_id}</p>}
              {payInfo?.pay_instructions && <p className="mt-1 text-[11px] text-foreground/55">{payInfo.pay_instructions}</p>}
            </div>
          </div>
          <p className="mt-2 font-mono text-[10px] text-amber-200/80">After paying, Rakshit confirms your booking manually.</p>
        </div>
      ) : (
        <>
          <button
            onClick={() => pay("razorpay")}
            disabled={busy}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-sky-500 px-3 py-2 font-mono text-xs font-medium text-white transition-colors hover:bg-sky-400 disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CreditCard className="h-3.5 w-3.5" />}
            Pay ₹{(amountPaise / 100).toFixed(0)} with Card / UPI
          </button>
          <div className="mt-2.5 flex items-center gap-1.5 font-mono text-[10px] text-emerald-300/80">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Secured by Razorpay{process.env.NEXT_PUBLIC_PAYMENTS_TEST_MODE === "1" ? " · test mode" : ""}</span>
          </div>
        </>
      )}
    </div>
  )
}

// Preferences. Reduce-motion stays device-local; email reminders sync to the
// profile (profiles.email_reminders) so the hourly reminders emailer honours
// the choice — localStorage is just the instant-UI cache.
function PreferenceToggles() {
  const [reducedMotion, setReducedMotion] = useState(false)
  const [emailReminders, setEmailReminders] = useState(true)

  useEffect(() => {
    setReducedMotion(localStorage.getItem("pref:reducedMotion") === "1")
    setEmailReminders(localStorage.getItem("pref:emailReminders") !== "0")
    // The profile value wins over the local cache when reachable.
    void (async () => {
      if (!supabase) return
      const { data } = await supabase.auth.getUser()
      const uid = data.user?.id
      if (!uid) return
      const { data: prof } = await supabase
        .from("profiles")
        .select("email_reminders")
        .eq("id", uid)
        .single()
      if (prof && typeof prof.email_reminders === "boolean") {
        setEmailReminders(prof.email_reminders)
        localStorage.setItem("pref:emailReminders", prof.email_reminders ? "1" : "0")
      }
    })()
  }, [])

  const toggleMotion = (v: boolean) => {
    setReducedMotion(v)
    localStorage.setItem("pref:reducedMotion", v ? "1" : "0")
    document.documentElement.classList.toggle("reduce-motion", v)
  }
  const toggleEmail = (v: boolean) => {
    setEmailReminders(v)
    localStorage.setItem("pref:emailReminders", v ? "1" : "0")
    void (async () => {
      if (!supabase) return
      const { data } = await supabase.auth.getUser()
      const uid = data.user?.id
      if (uid) await supabase.from("profiles").update({ email_reminders: v }).eq("id", uid)
    })()
  }

  const Row = ({
    label,
    hint,
    checked,
    onChange,
  }: {
    label: string
    hint: string
    checked: boolean
    onChange: (v: boolean) => void
  }) => (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-3">
      <span>
        <span className="block text-sm text-foreground">{label}</span>
        <span className="block text-xs text-foreground/50">{hint}</span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 shrink-0 accent-sky-500"
      />
    </label>
  )

  return (
    <div className="space-y-2">
      <Row
        label="Reduce motion"
        hint="Tone down background and entrance animations."
        checked={reducedMotion}
        onChange={toggleMotion}
      />
      <Row
        label="Email reminders"
        hint="Get an email the day before each confirmed session."
        checked={emailReminders}
        onChange={toggleEmail}
      />
    </div>
  )
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
