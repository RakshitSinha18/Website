"use client"

import type React from "react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { LogOut, Check, Mail, ShieldCheck, CalendarClock, Inbox, BookOpen, Plus, IndianRupee, ArrowLeft, Loader2, Trash2, Map } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/use-auth"
import { isAdminEmail } from "@/lib/config"
import { useToast } from "@/components/toast"
import { PageBackdrop, Card, CardTitle, Button, fieldClass, FieldLabel } from "@/components/ui/shell"

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

  // Payment settings (UPI + PayPal + link + bank)
  const [pay, setPay] = useState({
    upi_id: "",
    upi_qr_url: "",
    upi_enabled: true,
    paypal_email: "",
    paypal_me_link: "",
    paypal_enabled: false,
    payment_link: "",
    payment_link_label: "Pay online",
    link_enabled: false,
    bank_details: "",
    bank_enabled: false,
    pay_instructions: "",
    currency_note: "",
  })
  const [savingPay, setSavingPay] = useState(false)

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

    const { data: st } = await supabase.from("settings").select("*").eq("id", 1).single()
    if (st) {
      setPay((p) => ({
        ...p,
        upi_id: st.upi_id || "",
        upi_qr_url: st.upi_qr_url || "",
        upi_enabled: st.upi_enabled ?? true,
        paypal_email: st.paypal_email || "",
        paypal_me_link: st.paypal_me_link || "",
        paypal_enabled: st.paypal_enabled ?? false,
        payment_link: st.payment_link || "",
        payment_link_label: st.payment_link_label || "Pay online",
        link_enabled: st.link_enabled ?? false,
        bank_details: st.bank_details || "",
        bank_enabled: st.bank_enabled ?? false,
        pay_instructions: st.pay_instructions || "",
        currency_note: st.currency_note || "",
      }))
    }
  }

  const savePayments = async () => {
    if (!supabase) return
    setSavingPay(true)
    const { error } = await supabase
      .from("settings")
      .update({ ...pay, updated_at: new Date().toISOString() })
      .eq("id", 1)
    setSavingPay(false)
    setMsg(error ? error.message : "Payment settings saved.")
  }

  const uploadQr = async (file: File) => {
    if (!supabase) return
    setMsg("Uploading QR…")
    const path = `qr-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "")}`
    const { error: upErr } = await supabase.storage.from("payment").upload(path, file, { upsert: true })
    if (upErr) {
      setMsg(
        /bucket/i.test(upErr.message)
          ? "Create a public Storage bucket named 'payment' first (Storage → New bucket)."
          : upErr.message,
      )
      return
    }
    const { data: pub } = supabase.storage.from("payment").getPublicUrl(path)
    const url = pub.publicUrl
    const { error } = await supabase.from("settings").update({ upi_qr_url: url, updated_at: new Date().toISOString() }).eq("id", 1)
    if (error) {
      setMsg(error.message)
      return
    }
    setPay((p) => ({ ...p, upi_qr_url: url }))
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
      <main className="relative flex min-h-[100dvh] items-center justify-center text-foreground">
        <PageBackdrop />
        <p className="relative z-10 flex items-center gap-2 text-sm text-foreground/70">
          <Loader2 className="h-4 w-4 animate-spin" /> Checking access…
        </p>
      </main>
    )
  }

  return (
    <main className="relative min-h-[100dvh] text-foreground">
      <PageBackdrop />

      <div className="relative z-10 mx-auto max-w-5xl px-5 py-8 md:py-12">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-foreground/50 transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> sinharakshit.com
            </Link>
            <h1 className="mt-1.5 flex items-center gap-2.5 text-2xl font-medium tracking-tight text-foreground md:text-3xl">
              <ShieldCheck className="h-6 w-6 text-sky-400" /> Admin Dashboard
            </h1>
            <p className="mt-0.5 text-xs text-foreground/50">Signed in as {user?.email}</p>
          </div>
          <Button variant="secondary" onClick={handleLogout} className="shrink-0">
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </Button>
        </div>


        {/* Payment settings — UPI (India) + PayPal + link + bank (international) */}
        <Card className="mb-6">
          <CardTitle
            icon={<IndianRupee className="h-4 w-4" />}
            title="Payment methods"
            hint="Enable the ways students can pay. They pay you directly, then you confirm below. No gateway fees."
          />

          <div className="space-y-4">
            {/* UPI */}
            <PayBlock
              label="UPI (India)"
              enabled={pay.upi_enabled}
              onToggle={(v) => setPay({ ...pay, upi_enabled: v })}
            >
              <input
                value={pay.upi_id}
                onChange={(e) => setPay({ ...pay, upi_id: e.target.value })}
                placeholder="rakshit@upi"
                className={inputCls}
              />
              <div className="mt-2 flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && uploadQr(e.target.files[0])}
                  className="block w-full text-xs text-foreground/70 file:mr-3 file:rounded-full file:border-0 file:bg-foreground/15 file:px-4 file:py-1.5 file:font-mono file:text-xs file:text-foreground hover:file:bg-foreground/25"
                />
                {pay.upi_qr_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={pay.upi_qr_url} alt="UPI QR" className="h-16 w-16 rounded-lg border border-foreground/15 bg-white object-contain p-1" />
                )}
              </div>
            </PayBlock>

            {/* PayPal */}
            <PayBlock
              label="PayPal (international)"
              enabled={pay.paypal_enabled}
              onToggle={(v) => setPay({ ...pay, paypal_enabled: v })}
            >
              <input
                value={pay.paypal_email}
                onChange={(e) => setPay({ ...pay, paypal_email: e.target.value })}
                placeholder="PayPal email"
                className={inputCls}
              />
              <input
                value={pay.paypal_me_link}
                onChange={(e) => setPay({ ...pay, paypal_me_link: e.target.value })}
                placeholder="paypal.me/yourname (optional)"
                className={`${inputCls} mt-2`}
              />
            </PayBlock>

            {/* Payment link (Stripe / Razorpay / Wise) */}
            <PayBlock
              label="Payment link (Stripe / Razorpay / Wise)"
              enabled={pay.link_enabled}
              onToggle={(v) => setPay({ ...pay, link_enabled: v })}
            >
              <input
                value={pay.payment_link}
                onChange={(e) => setPay({ ...pay, payment_link: e.target.value })}
                placeholder="https://buy.stripe.com/…"
                className={inputCls}
              />
              <input
                value={pay.payment_link_label}
                onChange={(e) => setPay({ ...pay, payment_link_label: e.target.value })}
                placeholder="Button label (e.g. Pay with card)"
                className={`${inputCls} mt-2`}
              />
            </PayBlock>

            {/* Bank / wire */}
            <PayBlock
              label="Bank transfer / wire (international)"
              enabled={pay.bank_enabled}
              onToggle={(v) => setPay({ ...pay, bank_enabled: v })}
            >
              <textarea
                rows={3}
                value={pay.bank_details}
                onChange={(e) => setPay({ ...pay, bank_details: e.target.value })}
                placeholder="Account name, number, IFSC/SWIFT, bank…"
                className={inputCls}
              />
            </PayBlock>

            {/* Shared notes */}
            <div>
              <FieldLabel>Notes for students (optional)</FieldLabel>
              <input
                value={pay.pay_instructions}
                onChange={(e) => setPay({ ...pay, pay_instructions: e.target.value })}
                placeholder="e.g. Add your name in the payment note"
                className={inputCls}
              />
              <input
                value={pay.currency_note}
                onChange={(e) => setPay({ ...pay, currency_note: e.target.value })}
                placeholder="Currency note (e.g. INR via UPI, USD via PayPal)"
                className={`${inputCls} mt-2`}
              />
            </div>

            <Button onClick={savePayments} disabled={savingPay} className="w-full">
              {savingPay && <Loader2 className="h-4 w-4 animate-spin" />}
              {savingPay ? "Saving…" : "Save payment methods"}
            </Button>
          </div>
        </Card>

        {/* Class bookings */}
        <Card className="mb-6">
          <div className="mb-5 flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-sky-400">
              <CalendarClock className="h-4 w-4" />
            </span>
            <h2 className="text-base font-medium tracking-tight text-foreground">Class bookings</h2>
            <span className="rounded-full bg-white/10 px-2 py-0.5 font-mono text-[10px] text-foreground/70">
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
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"
                >
                  <div>
                    <p className="text-sm text-foreground">{b.class_title}</p>
                    <p className="font-mono text-[11px] text-foreground/55">
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
                        className="flex items-center gap-1.5 rounded-full bg-sky-500 px-4 py-1.5 font-mono text-[11px] font-medium text-white transition-colors hover:bg-sky-400 disabled:opacity-50"
                      >
                        {busyId === b.id && <Loader2 className="h-3 w-3 animate-spin" />}
                        {busyId === b.id ? "Confirming…" : "Mark paid & confirm"}
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Session requests (from public form) */}
        <Card>
          <div className="mb-5 flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-sky-400">
              <Inbox className="h-4 w-4" />
            </span>
            <h2 className="text-base font-medium tracking-tight text-foreground">Session requests</h2>
            <span className="rounded-full bg-white/10 px-2 py-0.5 font-mono text-[10px] text-foreground/70">
              {requests.length}
            </span>
          </div>
          {requests.length === 0 ? (
            <EmptyRow label="No session requests yet." />
          ) : (
            <ul className="space-y-2">
              {requests.map((r) => (
                <li key={r.id} className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm text-foreground">
                      {r.name} <span className="font-mono text-[11px] text-foreground/50">· {r.topic}</span>
                    </p>
                    <a
                      href={`mailto:${r.email}?subject=Re: your mentoring session`}
                      className="flex items-center gap-1.5 font-mono text-[11px] text-sky-300 hover:underline"
                    >
                      <Mail className="h-3 w-3" /> {r.email}
                    </a>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-foreground/65">{r.message}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Manage courses */}
        <Card className="mt-6">
          <CardTitle icon={<BookOpen className="h-4 w-4" />} title="Manage courses" />

          <ul className="mb-4 space-y-2">
            {classes.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5"
              >
                <div>
                  <p className="text-sm text-foreground">{c.title}</p>
                  <p className="font-mono text-[11px] text-foreground/50">{c.duration}</p>
                </div>
                <button
                  onClick={() => removeClass(c.id)}
                  aria-label={`Remove ${c.title}`}
                  className="flex items-center gap-1.5 rounded-lg border border-red-400/30 px-3 py-1.5 font-mono text-[10px] text-red-300/90 transition-colors hover:bg-red-500/10"
                >
                  <Trash2 className="h-3 w-3" /> Remove
                </button>
              </li>
            ))}
          </ul>

          <div className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
            <input
              value={newClass.title}
              onChange={(e) => setNewClass({ ...newClass, title: e.target.value })}
              placeholder="New course title"
              aria-label="New course title"
              className={fieldClass}
            />
            <input
              value={newClass.duration}
              onChange={(e) => setNewClass({ ...newClass, duration: e.target.value })}
              placeholder="Duration"
              aria-label="Course duration"
              className={fieldClass}
            />
            <Button onClick={addClass}>
              <Plus className="h-3.5 w-3.5" /> Add
            </Button>
          </div>
        </Card>

        {/* Manage roadmap */}
        <Card className="mt-6">
          <CardTitle icon={<Map className="h-4 w-4" />} title="Manage learning roadmap" />

          <ul className="mb-4 space-y-2">
            {roadmap.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5"
              >
                <div>
                  <p className="text-sm text-foreground">
                    <span className="font-mono text-[11px] text-foreground/50">Day {t.day} · </span>
                    {t.title}
                  </p>
                  <p className="font-mono text-[11px] text-foreground/50">{t.track}</p>
                </div>
                <button
                  onClick={() => removeTask(t.id)}
                  aria-label={`Remove day ${t.day} task`}
                  className="flex items-center gap-1.5 rounded-lg border border-red-400/30 px-3 py-1.5 font-mono text-[10px] text-red-300/90 transition-colors hover:bg-red-500/10"
                >
                  <Trash2 className="h-3 w-3" /> Remove
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
              aria-label="Day number"
              className={`${fieldClass} w-24`}
            />
            <input
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              placeholder="Task title"
              aria-label="Task title"
              className={fieldClass}
            />
            <input
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              placeholder="Short description"
              aria-label="Task description"
              className={fieldClass}
            />
            <Button onClick={addTask}>
              <Plus className="h-3.5 w-3.5" /> Add
            </Button>
          </div>
        </Card>
      </div>
    </main>
  )
}

function EmptyRow({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-dashed border-white/15 px-4 py-6 text-center text-xs text-foreground/50">
      {label}
    </div>
  )
}

const inputCls =
  "w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-foreground placeholder:text-foreground/35 transition-colors focus:border-white/25 focus:bg-white/[0.05] focus:outline-none"

function PayBlock({
  label,
  enabled,
  onToggle,
  children,
}: {
  label: string
  enabled: boolean
  onToggle: (v: boolean) => void
  children: React.ReactNode
}) {
  return (
    <div className={`rounded-xl border p-3.5 transition-colors ${enabled ? "border-sky-400/25 bg-sky-400/[0.06]" : "border-white/10 bg-white/[0.03]"}`}>
      <label className="mb-2 flex cursor-pointer items-center justify-between">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-foreground/50">{enabled ? "on" : "off"}</span>
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => onToggle(e.target.checked)}
            className="h-4 w-4 accent-sky-500"
          />
        </span>
      </label>
      {enabled && <div className="space-y-0">{children}</div>}
    </div>
  )
}
