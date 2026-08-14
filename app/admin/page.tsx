"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { LogOut, Check, Mail, ShieldCheck, CalendarClock, Inbox, BookOpen, Plus, IndianRupee } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/use-auth"
import { isAdminEmail } from "@/lib/config"
import { useToast } from "@/components/toast"

interface ClassBooking {
  id: string
  user_id: string
  class_title: string
  scheduled_at: string
  notes: string
  status: string
  payment_status: string
}
interface SessionRequest {
  id: string
  name: string
  email: string
  topic: string
  message: string
  status: string
  created_at: string
}

interface ClassRow {
  id: string
  title: string
  description: string
  duration: string
  active: boolean
}
interface RoadmapRow {
  id: string
  track: string
  day: number
  title: string
  description: string
}

export default function AdminPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [classBookings, setClassBookings] = useState<ClassBooking[]>([])
  const [requests, setRequests] = useState<SessionRequest[]>([])
  const [classes, setClasses] = useState<ClassRow[]>([])
  const [roadmap, setRoadmap] = useState<RoadmapRow[]>([])
  const { toast } = useToast()
  // Small shim so existing setMsg(...) calls become toasts (error if it looks like one).
  const setMsg = (text: string) => {
    if (!text) return
    const isErr = /error|failed|invalid|denied|not found|violates/i.test(text)
    toast(text, isErr ? "error" : "success")
  }
  const [busyId, setBusyId] = useState<string | null>(null)

  // New-item drafts
  const [newClass, setNewClass] = useState({ title: "", description: "", duration: "1–2 hours" })
  const [newTask, setNewTask] = useState({ track: "Data Analytics", day: "", title: "", description: "" })

  // Payment settings (UPI)
  const [upiId, setUpiId] = useState("")
  const [upiQrUrl, setUpiQrUrl] = useState("")
  const [savingUpi, setSavingUpi] = useState(false)

  const allowed = !loading && user && isAdminEmail(user.email)

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.replace("/login")
    } else if (!isAdminEmail(user.email)) {
      // Signed in but not the mentor → send to student portal.
      router.replace("/portal")
    }
  }, [loading, user, router])

  useEffect(() => {
    if (!allowed || !supabase) return
    load()
  }, [allowed])

  const load = async () => {
    if (!supabase) return
    const [{ data: cb }, { data: sr }, { data: cl }, { data: rm }] = await Promise.all([
      supabase.from("class_bookings").select("*").order("scheduled_at", { ascending: true }),
      supabase.from("session_bookings").select("*").order("created_at", { ascending: false }),
      supabase.from("classes").select("*").order("created_at", { ascending: true }),
      supabase.from("roadmap_tasks").select("*").order("day", { ascending: true }),
    ])
    if (cb) setClassBookings(cb as ClassBooking[])
    if (sr) setRequests(sr as SessionRequest[])
    if (cl) setClasses(cl as ClassRow[])
    if (rm) setRoadmap(rm as RoadmapRow[])

    const { data: st } = await supabase.from("settings").select("upi_id,upi_qr_url").eq("id", 1).single()
    if (st) {
      setUpiId(st.upi_id || "")
      setUpiQrUrl(st.upi_qr_url || "")
    }
  }

  const saveUpi = async () => {
    if (!supabase) return
    setSavingUpi(true)
    const { error } = await supabase.from("settings").update({ upi_id: upiId, updated_at: new Date().toISOString() }).eq("id", 1)
    setSavingUpi(false)
    setMsg(error ? error.message : "UPI ID saved.")
  }

  const uploadQr = async (file: File) => {
    if (!supabase) return
    setMsg("Uploading QR…")
    const path = `qr-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "")}`
    const { error: upErr } = await supabase.storage.from("payment").upload(path, file, { upsert: true })
    if (upErr) {
      setMsg(upErr.message)
      return
    }
    const { data: pub } = supabase.storage.from("payment").getPublicUrl(path)
    const url = pub.publicUrl
    const { error } = await supabase.from("settings").update({ upi_qr_url: url, updated_at: new Date().toISOString() }).eq("id", 1)
    if (error) {
      setMsg(error.message)
      return
    }
    setUpiQrUrl(url)
    setMsg("QR code uploaded.")
  }

  // --- Class catalog editing ---
  const addClass = async () => {
    if (!supabase || !newClass.title.trim()) return
    const { error } = await supabase.from("classes").insert({ ...newClass, active: true })
    setMsg(error ? error.message : `Added course “${newClass.title}”.`)
    if (!error) {
      setNewClass({ title: "", description: "", duration: "1–2 hours" })
      load()
    }
  }
  const removeClass = async (id: string) => {
    if (!supabase) return
    const { error } = await supabase.from("classes").delete().eq("id", id)
    setMsg(error ? error.message : "Course removed.")
    if (!error) load()
  }

  // --- Roadmap editing ---
  const addTask = async () => {
    if (!supabase || !newTask.title.trim() || !newTask.day) return
    const { error } = await supabase.from("roadmap_tasks").insert({
      track: newTask.track,
      day: Number(newTask.day),
      title: newTask.title,
      description: newTask.description,
    })
    setMsg(error ? error.message : `Added roadmap task “${newTask.title}”.`)
    if (!error) {
      setNewTask({ track: "Data Analytics", day: "", title: "", description: "" })
      load()
    }
  }
  const removeTask = async (id: string) => {
    if (!supabase) return
    const { error } = await supabase.from("roadmap_tasks").delete().eq("id", id)
    setMsg(error ? error.message : "Roadmap task removed.")
    if (!error) load()
  }

  // Rakshit marks the student as paid and confirms the session in one step.
  const confirmPaid = async (b: ClassBooking) => {
    if (!supabase) return
    setBusyId(b.id)
    setMsg("")
    const { error } = await supabase
      .from("class_bookings")
      .update({ status: "confirmed", payment_status: "paid" })
      .eq("id", b.id)
    setBusyId(null)
    if (error) {
      setMsg(error.message)
      return
    }
    setClassBookings((prev) =>
      prev.map((x) => (x.id === b.id ? { ...x, status: "confirmed", payment_status: "paid" } : x)),
    )
    setMsg(`Confirmed ${b.class_title} as paid. Student is notified with the session link.`)
  }

  const handleLogout = async () => {
    await supabase?.auth.signOut()
    router.replace("/")
  }

  if (loading || !allowed) {
    return (
      <main className="relative flex min-h-[100dvh] items-center justify-center">
        <div className="animated-gradient fixed inset-0 z-0">
          <div className="absolute inset-0 bg-black/45" />
        </div>
        <p className="relative z-10 font-mono text-sm text-foreground/70">Checking access…</p>
      </main>
    )
  }

  return (
    <main className="relative min-h-[100dvh]">
      <div className="animated-gradient floating-orbs fixed inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-black/45" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-5 py-8 md:py-12">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link href="/" className="font-mono text-xs text-foreground/60 hover:text-foreground">
              ← sinharakshit.com
            </Link>
            <h1 className="mt-1 flex items-center gap-2 font-sans text-2xl font-light text-foreground md:text-3xl">
              <ShieldCheck className="h-6 w-6 text-sky-300" /> Mentor Dashboard
            </h1>
            <p className="font-mono text-xs text-foreground/60">Signed in as {user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-full border border-foreground/20 bg-foreground/10 px-4 py-2 font-mono text-xs text-foreground transition-colors hover:bg-foreground/20"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>


        {/* Payment settings (UPI) */}
        <section className="mb-6 rounded-2xl border border-foreground/15 bg-background/60 p-5 backdrop-blur-xl md:p-6">
          <div className="mb-4 flex items-center gap-2">
            <IndianRupee className="h-4 w-4 text-foreground/70" />
            <h2 className="font-sans text-lg font-light text-foreground">Payment (UPI)</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-start">
            <div>
              <label className="mb-1 block font-mono text-xs text-foreground/60">Your UPI ID</label>
              <div className="flex gap-2">
                <input
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="rakshit@upi"
                  className="flex-1 rounded-lg border border-foreground/20 bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-foreground/40 focus:border-foreground/50 focus:outline-none"
                />
                <button
                  onClick={saveUpi}
                  disabled={savingUpi}
                  className="rounded-lg bg-foreground/95 px-4 py-2 font-mono text-xs text-background transition-colors hover:bg-foreground disabled:opacity-50"
                >
                  {savingUpi ? "Saving…" : "Save"}
                </button>
              </div>
              <label className="mt-4 mb-1 block font-mono text-xs text-foreground/60">Or upload a UPI QR code</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && uploadQr(e.target.files[0])}
                className="block w-full text-xs text-foreground/70 file:mr-3 file:rounded-full file:border-0 file:bg-foreground/15 file:px-4 file:py-1.5 file:font-mono file:text-xs file:text-foreground hover:file:bg-foreground/25"
              />
              <p className="mt-2 font-mono text-[11px] text-foreground/50">
                Students see this when booking. They pay you, then you confirm below.
              </p>
            </div>
            {upiQrUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={upiQrUrl}
                alt="UPI QR"
                className="h-28 w-28 rounded-xl border border-foreground/15 bg-white object-contain p-1"
              />
            )}
          </div>
        </section>

        {/* Class bookings */}
        <section className="mb-6 rounded-2xl border border-foreground/15 bg-background/60 p-5 backdrop-blur-xl md:p-6">
          <div className="mb-4 flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-foreground/70" />
            <h2 className="font-sans text-lg font-light text-foreground">Class bookings</h2>
            <span className="ml-1 rounded-full bg-foreground/10 px-2 py-0.5 font-mono text-[10px] text-foreground/70">
              {classBookings.length}
            </span>
          </div>
          {classBookings.length === 0 ? (
            <EmptyRow label="No class bookings yet." />
          ) : (
            <ul className="space-y-2">
              {classBookings.map((b) => (
                <li
                  key={b.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-foreground/10 bg-foreground/5 px-4 py-3"
                >
                  <div>
                    <p className="font-sans text-sm text-foreground">{b.class_title}</p>
                    <p className="font-mono text-[11px] text-foreground/60">
                      {new Date(b.scheduled_at).toLocaleString([], {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {b.notes ? ` · “${b.notes}”` : ""}
                    </p>
                  </div>
                  {b.status === "confirmed" ? (
                    <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-3 py-1 font-mono text-[10px] text-emerald-200">
                      <Check className="h-3 w-3" /> paid &amp; confirmed
                    </span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-amber-500/20 px-2.5 py-1 font-mono text-[10px] text-amber-200">
                        awaiting UPI payment
                      </span>
                      <button
                        onClick={() => confirmPaid(b)}
                        disabled={busyId === b.id}
                        className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-sky-500 to-amber-400 px-4 py-1.5 font-mono text-[11px] font-medium text-black transition-all hover:scale-105 disabled:opacity-50"
                      >
                        {busyId === b.id ? "Confirming…" : "Mark paid & confirm"}
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Session requests (from public form) */}
        <section className="rounded-2xl border border-foreground/15 bg-background/60 p-5 backdrop-blur-xl md:p-6">
          <div className="mb-4 flex items-center gap-2">
            <Inbox className="h-4 w-4 text-foreground/70" />
            <h2 className="font-sans text-lg font-light text-foreground">Session requests</h2>
            <span className="ml-1 rounded-full bg-foreground/10 px-2 py-0.5 font-mono text-[10px] text-foreground/70">
              {requests.length}
            </span>
          </div>
          {requests.length === 0 ? (
            <EmptyRow label="No session requests yet." />
          ) : (
            <ul className="space-y-2">
              {requests.map((r) => (
                <li key={r.id} className="rounded-xl border border-foreground/10 bg-foreground/5 px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-sans text-sm text-foreground">
                      {r.name} <span className="font-mono text-[11px] text-foreground/50">· {r.topic}</span>
                    </p>
                    <a
                      href={`mailto:${r.email}?subject=Re: your mentoring session`}
                      className="flex items-center gap-1.5 font-mono text-[11px] text-sky-300 hover:underline"
                    >
                      <Mail className="h-3 w-3" /> {r.email}
                    </a>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-foreground/70">{r.message}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Manage courses */}
        <section className="mt-6 rounded-2xl border border-foreground/15 bg-background/60 p-5 backdrop-blur-xl md:p-6">
          <div className="mb-4 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-foreground/70" />
            <h2 className="font-sans text-lg font-light text-foreground">Manage courses</h2>
          </div>

          <ul className="mb-4 space-y-2">
            {classes.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-foreground/10 bg-foreground/5 px-4 py-2.5"
              >
                <div>
                  <p className="font-sans text-sm text-foreground">{c.title}</p>
                  <p className="font-mono text-[11px] text-foreground/50">{c.duration}</p>
                </div>
                <button
                  onClick={() => removeClass(c.id)}
                  className="rounded-full border border-red-400/30 px-3 py-1 font-mono text-[10px] text-red-300/90 transition-colors hover:bg-red-500/10"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>

          <div className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
            <input
              value={newClass.title}
              onChange={(e) => setNewClass({ ...newClass, title: e.target.value })}
              placeholder="New course title"
              className="rounded-lg border border-foreground/20 bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-foreground/40 focus:border-foreground/50 focus:outline-none"
            />
            <input
              value={newClass.duration}
              onChange={(e) => setNewClass({ ...newClass, duration: e.target.value })}
              placeholder="Duration"
              className="rounded-lg border border-foreground/20 bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-foreground/40 focus:border-foreground/50 focus:outline-none"
            />
            <button
              onClick={addClass}
              className="flex items-center justify-center gap-1.5 rounded-lg bg-foreground/95 px-4 py-2 font-mono text-xs text-background transition-colors hover:bg-foreground"
            >
              <Plus className="h-3.5 w-3.5" /> Add
            </button>
          </div>
        </section>

        {/* Manage roadmap */}
        <section className="mt-6 rounded-2xl border border-foreground/15 bg-background/60 p-5 backdrop-blur-xl md:p-6">
          <div className="mb-4 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-foreground/70" />
            <h2 className="font-sans text-lg font-light text-foreground">Manage learning roadmap</h2>
          </div>

          <ul className="mb-4 space-y-2">
            {roadmap.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-foreground/10 bg-foreground/5 px-4 py-2.5"
              >
                <div>
                  <p className="font-sans text-sm text-foreground">
                    <span className="font-mono text-[11px] text-foreground/50">Day {t.day} · </span>
                    {t.title}
                  </p>
                  <p className="font-mono text-[11px] text-foreground/50">{t.track}</p>
                </div>
                <button
                  onClick={() => removeTask(t.id)}
                  className="rounded-full border border-red-400/30 px-3 py-1 font-mono text-[10px] text-red-300/90 transition-colors hover:bg-red-500/10"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>

          <div className="grid gap-2 md:grid-cols-[auto_1fr_1fr_auto]">
            <input
              type="number"
              value={newTask.day}
              onChange={(e) => setNewTask({ ...newTask, day: e.target.value })}
              placeholder="Day"
              className="w-20 rounded-lg border border-foreground/20 bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-foreground/40 focus:border-foreground/50 focus:outline-none"
            />
            <input
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              placeholder="Task title"
              className="rounded-lg border border-foreground/20 bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-foreground/40 focus:border-foreground/50 focus:outline-none"
            />
            <input
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              placeholder="Short description"
              className="rounded-lg border border-foreground/20 bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-foreground/40 focus:border-foreground/50 focus:outline-none"
            />
            <button
              onClick={addTask}
              className="flex items-center justify-center gap-1.5 rounded-lg bg-foreground/95 px-4 py-2 font-mono text-xs text-background transition-colors hover:bg-foreground"
            >
              <Plus className="h-3.5 w-3.5" /> Add
            </button>
          </div>
        </section>
      </div>
    </main>
  )
}

function EmptyRow({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-dashed border-foreground/15 px-4 py-6 text-center font-mono text-xs text-foreground/50">
      {label}
    </div>
  )
}
