"use client"

import type React from "react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { LogOut, Check, Mail, ShieldCheck, CalendarClock, Inbox, BookOpen, Plus, IndianRupee, ArrowLeft, Loader2, Trash2, Map, FileText, Upload, MessageSquareHeart, MessagesSquare, Users, GraduationCap, Brain } from "lucide-react"
import { Stars } from "@/components/testimonial-form"
import { COURSES } from "@/lib/courses"
import { lessonsForCourse } from "@/lib/course-lessons"
import { PRACTICE_DECKS } from "@/lib/practice-decks"
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
  // Curriculum (editable). Arrays stored as jsonb in Supabase.
  tagline?: string
  level?: string
  for_whom?: string
  summary?: string
  price_paise?: number
  outcomes?: string[]
  syllabus?: string[]
  tools?: string[]
  learning_path?: string[]
}
interface RoadmapRow {
  id: string
  track: string
  day: number
  title: string
  description: string
}
interface BatchRow {
  id: string
  class_id?: string | null
  title: string
  subject: string
  description: string
  schedule: string
  start_date?: string | null
  end_date?: string | null
  price_paise: number
  capacity: number
  active: boolean
}
interface ArticleRow {
  id: string
  slug: string
  title: string
  excerpt: string
  body: string
  published: boolean
}
interface TestimonialRow {
  id: string
  author_name: string
  author_role: string
  body: string
  rating: number | null
  approved: boolean
  created_at: string
}
interface StudentRow {
  id: string
  full_name: string | null
  email: string | null
  experience: string | null
  goals: string | null
  updated_at: string
}
interface ProgressRow {
  user_id: string
  kind: string
}

export default function AdminPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [classBookings, setClassBookings] = useState<ClassBooking[]>([])
  const [requests, setRequests] = useState<SessionRequest[]>([])
  const [classes, setClasses] = useState<ClassRow[]>([])
  const [roadmap, setRoadmap] = useState<RoadmapRow[]>([])
  const [batches, setBatches] = useState<BatchRow[]>([])
  const [newBatch, setNewBatch] = useState({
    class_id: "", title: "", subject: "", schedule: "", start_date: "", end_date: "", price: "", capacity: "",
  })
  const [articles, setArticles] = useState<ArticleRow[]>([])
  const [newArticle, setNewArticle] = useState({ title: "", excerpt: "", body: "" })
  const [testimonials, setTestimonials] = useState<TestimonialRow[]>([])
  const [students, setStudents] = useState<StudentRow[]>([])
  const [learnProgress, setLearnProgress] = useState<ProgressRow[]>([])
  const [roadmapProgress, setRoadmapProgress] = useState<{ user_id: string; completed: boolean }[]>([])
  // Tabbed admin navigation.
  const [tab, setTab] = useState<"bookings" | "students" | "availability" | "courses" | "batches" | "articles" | "reviews" | "roadmap" | "payments">("bookings")
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

  // Course materials (PPT/notes/transcript) management
  const [materials, setMaterials] = useState<
    { id: string; class_id: string | null; batch_id: string | null; title: string; kind: string; file_url: string }[]
  >([])
  const [matClass, setMatClass] = useState("")
  const [matBatch, setMatBatch] = useState("") // optional: attach material to a batch
  const [matTitle, setMatTitle] = useState("")
  const [matKind, setMatKind] = useState<"ppt" | "notes" | "transcript">("ppt")
  const [uploadingMat, setUploadingMat] = useState(false)

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

  // Editable class/session policy (shown to students at booking + on /policy).
  const [classPolicy, setClassPolicy] = useState("")
  // Discord invite for the student community banner in the portal.
  const [discordUrl, setDiscordUrl] = useState("")
  const [savingDiscord, setSavingDiscord] = useState(false)
  // Alert channels (mentor-only notify_channels table) — attach as needed.
  const [discordHook, setDiscordHook] = useState("")
  const [slackHook, setSlackHook] = useState("")
  const [savingHooks, setSavingHooks] = useState(false)
  const [testingHooks, setTestingHooks] = useState(false)
  const [savingPolicy, setSavingPolicy] = useState(false)

  // Weekly recurring availability (0=Sun … 6=Sat → array of "HH:MM"), holiday
  // blocking, and a student-facing note. Drives the booking calendar.
  const [weekly, setWeekly] = useState<Record<string, string[]>>({})
  const [blockedDates, setBlockedDates] = useState<string[]>([])
  const [availNote, setAvailNote] = useState("")
  const [newBlockDate, setNewBlockDate] = useState("")
  const [savingAvail, setSavingAvail] = useState(false)

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
    if (cl) {
      setClasses(cl as ClassRow[])
      if (cl[0]) setMatClass((m) => m || (cl[0] as ClassRow).id)
    }
    if (rm) setRoadmap(rm as RoadmapRow[])

    const { data: bt } = await supabase.from("batches").select("*").order("created_at", { ascending: true })
    if (bt) setBatches(bt as BatchRow[])

    const { data: art } = await supabase.from("articles").select("*").order("created_at", { ascending: false })
    if (art) setArticles(art as ArticleRow[])

    const { data: tst } = await supabase.from("testimonials").select("*").order("created_at", { ascending: false })
    if (tst) setTestimonials(tst as TestimonialRow[])

    // Student roster + Learn/Practice/roadmap progress (mentor-read RLS).
    const [{ data: prof }, { data: lp }, { data: tp }] = await Promise.all([
      supabase.from("profiles").select("id,full_name,email,experience,goals,updated_at").order("updated_at", { ascending: false }),
      supabase.from("learning_progress").select("user_id,kind"),
      supabase.from("task_progress").select("user_id,completed"),
    ])
    if (prof) setStudents(prof as StudentRow[])
    if (lp) setLearnProgress(lp as ProgressRow[])
    if (tp) setRoadmapProgress(tp as { user_id: string; completed: boolean }[])

    const { data: mats } = await supabase
      .from("class_materials")
      .select("id,class_id,batch_id,title,kind,file_url")
      .order("created_at", { ascending: true })
    if (mats) setMaterials(mats as typeof materials)

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
      setWeekly((st.weekly_availability as Record<string, string[]>) || {})
      setBlockedDates((st.blocked_dates as string[]) || [])
      setAvailNote(st.availability_note || "")
      setClassPolicy(st.class_policy || "")
      setDiscordUrl(st.discord_invite_url || "")
    }
    // Alert channels live in their own mentor-only table (webhook URLs are
    // secrets — settings is readable by students).
    const { data: ch } = await supabase.from("notify_channels").select("*").eq("id", 1).single()
    if (ch) {
      setDiscordHook(ch.discord_webhook_url || "")
      setSlackHook(ch.slack_webhook_url || "")
    }
  }

  const saveClassPolicy = async () => {
    if (!supabase) return
    setSavingPolicy(true)
    const { error } = await supabase.from("settings").update({ class_policy: classPolicy, updated_at: new Date().toISOString() }).eq("id", 1)
    setSavingPolicy(false)
    setMsg(error ? error.message : "Class policy saved.")
  }

  // Attach/detach booking-alert channels. Empty field = detached.
  const saveHooks = async () => {
    if (!supabase) return
    const d = discordHook.trim()
    const s = slackHook.trim()
    if (d && !/^https:\/\/(discord|discordapp)\.com\/api\/webhooks\//.test(d)) {
      setMsg("Discord webhook should start with https://discord.com/api/webhooks/…")
      return
    }
    if (s && !/^https:\/\/hooks\.slack\.com\//.test(s)) {
      setMsg("Slack webhook should start with https://hooks.slack.com/…")
      return
    }
    setSavingHooks(true)
    const { error } = await supabase
      .from("notify_channels")
      .update({ discord_webhook_url: d, slack_webhook_url: s, updated_at: new Date().toISOString() })
      .eq("id", 1)
    setSavingHooks(false)
    setMsg(error ? error.message : d || s ? "Alert channels saved." : "Alert channels detached — email alerts continue.")
  }

  // Fire a clearly-labelled alert through the real pipeline (email + channels).
  const testHooks = async () => {
    if (!supabase) return
    setTestingHooks(true)
    try {
      const { data } = await supabase.auth.getSession()
      const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/notify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${data.session?.access_token ?? ""}`,
        },
        body: JSON.stringify({
          table: "class_bookings",
          record: {
            name: "Test alert from the admin panel",
            notes: "If you can read this in Discord/Slack, the channel is attached. (Safe to ignore.)",
          },
        }),
      })
      setMsg(res.ok ? "Test alert sent — check your email and attached channels." : "Test failed — try re-saving the webhooks.")
    } catch {
      setMsg("Test failed — network error.")
    } finally {
      setTestingHooks(false)
    }
  }

  // Save (or clear) the Discord invite that gates the portal community banner.
  const saveDiscord = async () => {
    if (!supabase) return
    const url = discordUrl.trim()
    if (url && !/^https:\/\/(discord\.gg|discord\.com\/invite)\//i.test(url)) {
      setMsg("That doesn't look like a Discord invite (expected https://discord.gg/…).")
      return
    }
    setSavingDiscord(true)
    const { error } = await supabase.from("settings").update({ discord_invite_url: url, updated_at: new Date().toISOString() }).eq("id", 1)
    setSavingDiscord(false)
    setMsg(error ? error.message : url ? "Community link saved — students now see the Join banner." : "Community link cleared — banner hidden.")
  }

  // Persist the weekly schedule + blocked dates to the settings row.
  const saveAvailability = async () => {
    if (!supabase) return
    setSavingAvail(true)
    const { error } = await supabase
      .from("settings")
      .update({
        weekly_availability: weekly,
        blocked_dates: blockedDates,
        availability_note: availNote,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1)
    setSavingAvail(false)
    setMsg(error ? error.message : "Availability saved.")
  }

  // Toggle a single "HH:MM" slot on/off for a given weekday (0–6).
  const toggleSlot = (weekday: number, hhmm: string) => {
    setWeekly((prev) => {
      const key = String(weekday)
      const cur = prev[key] ?? []
      const next = cur.includes(hhmm) ? cur.filter((s) => s !== hhmm) : [...cur, hhmm].sort()
      return { ...prev, [key]: next }
    })
  }
  // Turn a whole weekday off (clear its slots).
  const clearDay = (weekday: number) =>
    setWeekly((prev) => ({ ...prev, [String(weekday)]: [] }))

  const addBlockedDate = () => {
    if (!newBlockDate) return
    setBlockedDates((prev) => (prev.includes(newBlockDate) ? prev : [...prev, newBlockDate].sort()))
    setNewBlockDate("")
  }
  const removeBlockedDate = (d: string) =>
    setBlockedDates((prev) => prev.filter((x) => x !== d))

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

  // --- Course materials (PPT / notes / transcript), attachable to a class and/or batch ---
  const uploadMaterial = async (file: File) => {
    if (!supabase || (!matClass && !matBatch)) {
      setMsg("Pick a course or a batch first.")
      return
    }
    setUploadingMat(true)
    const folder = matBatch ? `batch-${matBatch}` : matClass
    const path = `${folder}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "")}`
    const { error: upErr } = await supabase.storage.from("materials").upload(path, file, { upsert: true })
    if (upErr) {
      setUploadingMat(false)
      setMsg(
        /bucket/i.test(upErr.message)
          ? "Create a public Storage bucket named 'materials' (run payments-materials.sql)."
          : upErr.message,
      )
      return
    }
    const { data: pub } = supabase.storage.from("materials").getPublicUrl(path)
    const { error } = await supabase.from("class_materials").insert({
      class_id: matClass || null,
      batch_id: matBatch || null,
      title: matTitle.trim() || file.name,
      kind: matKind,
      file_url: pub.publicUrl,
    })
    setUploadingMat(false)
    if (error) {
      setMsg(error.message)
      return
    }
    setMatTitle("")
    setMsg("Material uploaded.")
    load()
  }

  const removeMaterial = async (id: string) => {
    if (!supabase) return
    const { error } = await supabase.from("class_materials").delete().eq("id", id)
    setMsg(error ? error.message : "Material removed.")
    if (!error) load()
  }

  // --- Batch (scheduled cohort) editing ---
  const addBatch = async () => {
    if (!supabase || !newBatch.title.trim()) {
      setMsg("Give the batch a title.")
      return
    }
    const subject = newBatch.subject || classes.find((c) => c.id === newBatch.class_id)?.title || ""
    const { error } = await supabase.from("batches").insert({
      class_id: newBatch.class_id || null,
      title: newBatch.title.trim(),
      subject,
      schedule: newBatch.schedule,
      start_date: newBatch.start_date || null,
      end_date: newBatch.end_date || null,
      price_paise: Math.round(Number(newBatch.price) * 100) || 0,
      capacity: Number(newBatch.capacity) || 0,
      active: true,
    })
    setMsg(error ? error.message : `Added batch “${newBatch.title}”.`)
    if (!error) {
      setNewBatch({ class_id: "", title: "", subject: "", schedule: "", start_date: "", end_date: "", price: "", capacity: "" })
      load()
    }
  }
  const saveBatch = async (b: BatchRow) => {
    if (!supabase) return
    setBusyId(b.id)
    const { error } = await supabase
      .from("batches")
      .update({
        class_id: b.class_id || null,
        title: b.title,
        subject: b.subject,
        description: b.description,
        schedule: b.schedule,
        start_date: b.start_date || null,
        end_date: b.end_date || null,
        price_paise: b.price_paise ?? 0,
        capacity: b.capacity ?? 0,
        active: b.active,
      })
      .eq("id", b.id)
    setBusyId(null)
    setMsg(error ? error.message : `Saved batch “${b.title}”.`)
    if (!error) load()
  }
  const removeBatch = async (id: string) => {
    if (!supabase) return
    const { error } = await supabase.from("batches").delete().eq("id", id)
    setMsg(error ? error.message : "Batch removed.")
    if (!error) load()
  }

  // --- Articles ---
  const slugify = (s: string) =>
    s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60)
  const addArticle = async () => {
    if (!supabase || !newArticle.title.trim()) { setMsg("Give the article a title."); return }
    const slug = `${slugify(newArticle.title)}-${Date.now().toString(36).slice(-4)}`
    const { error } = await supabase.from("articles").insert({
      slug, title: newArticle.title.trim(), excerpt: newArticle.excerpt, body: newArticle.body, published: false,
    })
    setMsg(error ? error.message : `Draft "${newArticle.title}" created.`)
    if (!error) { setNewArticle({ title: "", excerpt: "", body: "" }); load() }
  }
  const saveArticle = async (a: ArticleRow) => {
    if (!supabase) return
    setBusyId(a.id)
    const { error } = await supabase.from("articles").update({
      title: a.title, excerpt: a.excerpt, body: a.body, published: a.published, updated_at: new Date().toISOString(),
    }).eq("id", a.id)
    setBusyId(null)
    setMsg(error ? error.message : `Saved "${a.title}".`)
    if (!error) load()
  }
  const removeArticle = async (id: string) => {
    if (!supabase) return
    const { error } = await supabase.from("articles").delete().eq("id", id)
    setMsg(error ? error.message : "Article removed.")
    if (!error) load()
  }

  // --- Testimonials (student reviews) ---
  const setTestimonialApproved = async (t: TestimonialRow, approved: boolean) => {
    if (!supabase) return
    setBusyId(t.id)
    const { error } = await supabase.from("testimonials").update({ approved }).eq("id", t.id)
    setBusyId(null)
    setMsg(error ? error.message : approved ? "Approved — now live on the homepage." : "Hidden from the homepage.")
    if (!error) setTestimonials((prev) => prev.map((x) => (x.id === t.id ? { ...x, approved } : x)))
  }
  const removeTestimonial = async (id: string) => {
    if (!supabase) return
    const { error } = await supabase.from("testimonials").delete().eq("id", id)
    setMsg(error ? error.message : "Testimonial removed.")
    if (!error) setTestimonials((prev) => prev.filter((x) => x.id !== id))
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
  // Save full curriculum for one course.
  const saveCourse = async (c: ClassRow) => {
    if (!supabase) return
    setBusyId(c.id)
    const { error } = await supabase
      .from("classes")
      .update({
        title: c.title,
        description: c.description,
        duration: c.duration,
        tagline: c.tagline ?? null,
        level: c.level ?? null,
        for_whom: c.for_whom ?? null,
        summary: c.summary ?? null,
        price_paise: c.price_paise ?? 0,
        outcomes: c.outcomes ?? [],
        syllabus: c.syllabus ?? [],
        tools: c.tools ?? [],
        learning_path: c.learning_path ?? [],
      })
      .eq("id", c.id)
    setBusyId(null)
    setMsg(error ? error.message : `Saved “${c.title}”.`)
    if (!error) load()
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

        {/* Tab navigation */}
        <nav
          role="tablist"
          aria-label="Admin sections"
          className="mb-6 flex gap-1 overflow-x-auto rounded-xl border border-white/10 bg-white/[0.03] p-1"
        >
          {[
            { id: "bookings", label: "Bookings", icon: CalendarClock },
            { id: "students", label: "Students", icon: Users },
            { id: "availability", label: "Availability", icon: CalendarClock },
            { id: "courses", label: "Courses", icon: BookOpen },
            { id: "batches", label: "Batches", icon: BookOpen },
            { id: "articles", label: "Articles", icon: FileText },
            { id: "reviews", label: "Reviews", icon: MessageSquareHeart },
            { id: "roadmap", label: "Roadmap", icon: Map },
            { id: "payments", label: "Payments", icon: IndianRupee },
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
                  active ? "bg-white text-[#0b0f19] shadow-sm" : "text-foreground/55 hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" /> {t.label}
              </button>
            )
          })}
        </nav>

        {/* ── PAYMENTS TAB ─────────────────────────────────────── */}
        {tab === "payments" && (
        <>
        {/* Gateway status — Razorpay checkout is deployed & configured. */}
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-400/25 bg-emerald-400/[0.07] px-4 py-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-400/15 text-emerald-300">
            <ShieldCheck className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-sm font-medium text-foreground">
              Razorpay checkout
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 font-mono text-[10px] text-emerald-200">
                <Check className="h-3 w-3" /> active
              </span>
            </p>
            <p className="font-mono text-[11px] text-foreground/55">
              In-app card/UPI payments are live. Students pay in the portal; bookings confirm automatically on success.
            </p>
          </div>
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

            {/* Legacy external "Payment link" removed — the built-in Razorpay
                gateway (see the 'active' card above) replaces it. */}

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
        </>
        )}

        {/* ── STUDENTS TAB (roster + learning progress) ────────── */}
        {tab === "students" && (
        <Card>
          <CardTitle
            icon={<Users className="h-4 w-4" />}
            title="Students"
            hint="Everyone with an account, their goals, and how far they've got in Learn, Practice and their roadmap — so you know where to pick up before a session."
          />
          <ul className="space-y-2">
            {students.map((s) => {
              const lessonsDone = learnProgress.filter((p) => p.user_id === s.id && p.kind === "lesson").length
              const cardsDone = learnProgress.filter((p) => p.user_id === s.id && p.kind === "card").length
              const totalLessons = COURSES.reduce((sum, c) => sum + lessonsForCourse(c.id).length, 0)
              const totalCards = PRACTICE_DECKS.reduce((sum, d) => sum + d.cards.length, 0)
              const roadmapDone = roadmapProgress.filter((p) => p.user_id === s.id && p.completed).length
              const myBookings = classBookings.filter((b) => b.user_id === s.id)
              const nextSession = myBookings
                .filter((b) => b.status === "confirmed" && new Date(b.scheduled_at).getTime() > Date.now())
                .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())[0]
              return (
                <li key={s.id} className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm text-foreground">
                        {s.full_name || "(no name yet)"}
                        {s.experience && (
                          <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 font-mono text-[10px] text-foreground/60">
                            {s.experience}
                          </span>
                        )}
                      </p>
                      {s.email && (
                        <a
                          href={`mailto:${s.email}`}
                          className="flex items-center gap-1.5 font-mono text-[11px] text-sky-300 hover:underline"
                        >
                          <Mail className="h-3 w-3" /> {s.email}
                        </a>
                      )}
                    </div>
                    {nextSession && (
                      <span className="rounded-full bg-emerald-500/20 px-2.5 py-1 font-mono text-[10px] text-emerald-200">
                        next: {new Date(nextSession.scheduled_at).toLocaleString([], { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    )}
                  </div>
                  {s.goals && <p className="mt-1 text-xs leading-relaxed text-foreground/60">Goal: {s.goals}</p>}
                  <div className="mt-2 flex flex-wrap gap-2 font-mono text-[10px]">
                    <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-foreground/65">
                      <GraduationCap className="h-3 w-3" /> {lessonsDone}/{totalLessons} lessons
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-foreground/65">
                      <Brain className="h-3 w-3" /> {cardsDone}/{totalCards} cards
                    </span>
                    {roadmap.length > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-foreground/65">
                        <Map className="h-3 w-3" /> {roadmapDone}/{roadmap.length} roadmap
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-foreground/65">
                      <CalendarClock className="h-3 w-3" /> {myBookings.length} booking{myBookings.length === 1 ? "" : "s"}
                    </span>
                  </div>
                </li>
              )
            })}
            {students.length === 0 && <EmptyRow label="No students have signed up yet." />}
          </ul>
        </Card>
        )}

        {/* ── AVAILABILITY TAB ─────────────────────────────────── */}
        {tab === "availability" && (
        <>
        <Card className="mb-6">
          <CardTitle
            icon={<CalendarClock className="h-4 w-4" />}
            title="Weekly availability"
            hint="Toggle the hours you're free each weekday. This repeats every week and controls which slots students can book. Turn a day off to hide it."
          />
          <div className="space-y-2">
            {WEEKDAYS.map((name, wd) => (
              <AvailabilityDay
                key={wd}
                name={name}
                slots={weekly[String(wd)] ?? []}
                onToggle={(hhmm) => toggleSlot(wd, hhmm)}
                onClear={() => clearDay(wd)}
              />
            ))}
          </div>
        </Card>

        <Card className="mb-6">
          <CardTitle
            icon={<CalendarClock className="h-4 w-4" />}
            title="Block specific dates"
            hint="Close individual dates (holidays, travel) even if that weekday is normally open."
          />
          <div className="mb-3 flex flex-wrap gap-2">
            {blockedDates.length === 0 && <EmptyRow label="No blocked dates." />}
            {blockedDates.map((d) => (
              <span
                key={d}
                className="inline-flex items-center gap-2 rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-1.5 font-mono text-[11px] text-amber-200"
              >
                {d}
                <button
                  onClick={() => removeBlockedDate(d)}
                  aria-label={`Unblock ${d}`}
                  className="text-amber-200/70 hover:text-amber-100"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="grid gap-2 md:grid-cols-[1fr_auto]">
            <input
              type="date"
              value={newBlockDate}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => setNewBlockDate(e.target.value)}
              aria-label="Date to block"
              className={fieldClass}
            />
            <Button onClick={addBlockedDate} variant="secondary">
              <Plus className="h-3.5 w-3.5" /> Block date
            </Button>
          </div>
        </Card>

        <Card className="mb-6">
          <FieldLabel>Note for students (optional)</FieldLabel>
          <input
            value={availNote}
            onChange={(e) => setAvailNote(e.target.value)}
            placeholder="e.g. Times shown in IST · evenings only"
            className={inputCls}
          />
          <Button onClick={saveAvailability} disabled={savingAvail} className="mt-4 w-full">
            {savingAvail && <Loader2 className="h-4 w-4 animate-spin" />}
            {savingAvail ? "Saving…" : "Save availability"}
          </Button>
        </Card>

        {/* Class / session policy — plain language, shown to students. */}
        <Card className="mb-6">
          <CardTitle
            icon={<FileText className="h-4 w-4" />}
            title="Class & session policy"
            hint="Clear rules students see at booking and on the /policy page — attendance, reschedule, cancellation, refunds. One line per rule."
          />
          <textarea
            rows={7}
            value={classPolicy}
            onChange={(e) => setClassPolicy(e.target.value)}
            placeholder="One policy point per line…"
            className={inputCls}
          />
          <Button onClick={saveClassPolicy} disabled={savingPolicy} className="mt-3 w-full">
            {savingPolicy && <Loader2 className="h-4 w-4 animate-spin" />}
            {savingPolicy ? "Saving…" : "Save policy"}
          </Button>
        </Card>

        {/* Student community — Discord invite gate for the portal banner. */}
        <Card className="mb-6">
          <CardTitle
            icon={<MessagesSquare className="h-4 w-4" />}
            title="Student community"
            hint="Paste your Discord server invite (create one that never expires). Signed-in students see a Join banner in their portal. Leave empty to hide it."
          />
          <input
            value={discordUrl}
            onChange={(e) => setDiscordUrl(e.target.value)}
            placeholder="https://discord.gg/…"
            className={inputCls}
          />
          <Button onClick={saveDiscord} disabled={savingDiscord} className="mt-3 w-full">
            {savingDiscord && <Loader2 className="h-4 w-4 animate-spin" />}
            {savingDiscord ? "Saving…" : "Save community link"}
          </Button>
        </Card>

        {/* Alert channels — attach your own Discord/Slack, detach anytime. */}
        <Card className="mb-6">
          <CardTitle
            icon={<Inbox className="h-4 w-4" />}
            title="Booking alert channels"
            hint="Get every booking / reschedule / can't-attend alert in your own Discord or Slack, alongside email. Paste a webhook URL to attach; clear it to detach."
          />
          <label className="mb-1.5 block text-xs font-medium text-foreground/70">Discord webhook</label>
          <input
            value={discordHook}
            onChange={(e) => setDiscordHook(e.target.value)}
            placeholder="https://discord.com/api/webhooks/…"
            className={`${inputCls} mb-3`}
          />
          <label className="mb-1.5 block text-xs font-medium text-foreground/70">Slack webhook</label>
          <input
            value={slackHook}
            onChange={(e) => setSlackHook(e.target.value)}
            placeholder="https://hooks.slack.com/services/…"
            className={inputCls}
          />
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <Button onClick={saveHooks} disabled={savingHooks}>
              {savingHooks && <Loader2 className="h-4 w-4 animate-spin" />}
              {savingHooks ? "Saving…" : "Save channels"}
            </Button>
            <Button variant="secondary" onClick={testHooks} disabled={testingHooks}>
              {testingHooks && <Loader2 className="h-4 w-4 animate-spin" />}
              {testingHooks ? "Sending…" : "Send test alert"}
            </Button>
          </div>
        </Card>
        </>
        )}

        {/* ── BOOKINGS TAB (bookings + session requests) ───────── */}
        {tab === "bookings" && (
        <>
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
                        awaiting payment
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
        </>
        )}

        {/* ── COURSES TAB (courses + curriculum + materials) ───── */}
        {tab === "courses" && (
        <>
        {/* Manage courses */}
        <Card>
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

        {/* Course curriculum editor */}
        <Card className="mt-6">
          <CardTitle
            icon={<BookOpen className="h-4 w-4" />}
            title="Course curriculum"
            hint="Edit each course's structure — tagline, level, price, outcomes, syllabus and learning path. Shown on the public course pages."
          />
          <div className="space-y-2">
            {classes.map((c) => (
              <CurriculumEditor key={c.id} course={c} busy={busyId === c.id} onSave={saveCourse} />
            ))}
            {classes.length === 0 && <EmptyRow label="Add a course above first." />}
          </div>
        </Card>

        {/* Course materials (PPT / notes) */}
        <Card className="mt-6">
          <CardTitle
            icon={<FileText className="h-4 w-4" />}
            title="Course materials"
            hint="Upload slides (PPT) and notes for each course — students see them once their booking is confirmed."
          />

          <ul className="mb-4 space-y-2">
            {materials.map((m) => {
              const cls = classes.find((c) => c.id === m.class_id)
              return (
                <li
                  key={m.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5"
                >
                  <div className="min-w-0">
                    <a
                      href={m.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="truncate text-sm text-sky-300 hover:underline"
                    >
                      {m.title}
                    </a>
                    <p className="font-mono text-[11px] text-foreground/50">
                      {m.kind} · {cls?.title ?? "—"}
                    </p>
                  </div>
                  <button
                    onClick={() => removeMaterial(m.id)}
                    aria-label={`Remove ${m.title}`}
                    className="flex items-center gap-1.5 rounded-lg border border-red-400/30 px-3 py-1.5 font-mono text-[10px] text-red-300/90 transition-colors hover:bg-red-500/10"
                  >
                    <Trash2 className="h-3 w-3" /> Remove
                  </button>
                </li>
              )
            })}
            {materials.length === 0 && <EmptyRow label="No materials uploaded yet." />}
          </ul>

          <div className="grid gap-2 md:grid-cols-2">
            <select
              value={matClass}
              onChange={(e) => setMatClass(e.target.value)}
              aria-label="Course for material"
              className={fieldClass}
            >
              <option value="">— Course (optional) —</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
            <select
              value={matBatch}
              onChange={(e) => setMatBatch(e.target.value)}
              aria-label="Batch for material"
              className={fieldClass}
            >
              <option value="">— Batch (optional) —</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>{b.title}</option>
              ))}
            </select>
            <input
              value={matTitle}
              onChange={(e) => setMatTitle(e.target.value)}
              placeholder="Material title (optional)"
              aria-label="Material title"
              className={fieldClass}
            />
            <select
              value={matKind}
              onChange={(e) => setMatKind(e.target.value as "ppt" | "notes" | "transcript")}
              aria-label="Material type"
              className={fieldClass}
            >
              <option value="ppt">PPT / slides</option>
              <option value="notes">Notes</option>
              <option value="transcript">Transcript</option>
            </select>
          </div>
          <p className="mt-1 font-mono text-[10px] text-foreground/40">
            Attach to a course, a batch, or both. Transcripts show in a readable view for students.
          </p>
          <label className="mt-2 flex cursor-pointer items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 font-mono text-xs text-[#0b0f19] transition-colors hover:bg-white/90">
              {uploadingMat ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
              {uploadingMat ? "Uploading…" : "Upload file"}
            </span>
            <input
              type="file"
              accept=".ppt,.pptx,.pdf,.doc,.docx,.txt,.zip"
              onChange={(e) => e.target.files?.[0] && uploadMaterial(e.target.files[0])}
              className="hidden"
              disabled={uploadingMat}
            />
          </label>
        </Card>
        </>
        )}

        {/* ── BATCHES TAB (scheduled cohorts of a subject) ─────── */}
        {tab === "batches" && (
        <>
        <Card>
          <CardTitle
            icon={<BookOpen className="h-4 w-4" />}
            title="Batches"
            hint="Scheduled cohorts of a subject — students enroll in a batch and pay to join. Attach materials/transcripts to a batch in the Courses tab."
          />

          <ul className="mb-4 space-y-2">
            {batches.map((b) => (
              <BatchEditor key={b.id} batch={b} classes={classes} busy={busyId === b.id} onSave={saveBatch} onRemove={removeBatch} />
            ))}
            {batches.length === 0 && <EmptyRow label="No batches yet — create one below." />}
          </ul>

          <div className="space-y-2 rounded-xl border border-white/10 bg-white/[0.02] p-3">
            <p className="font-mono text-[11px] text-foreground/50">New batch</p>
            <div className="grid gap-2 md:grid-cols-2">
              <input value={newBatch.title} onChange={(e) => setNewBatch({ ...newBatch, title: e.target.value })} placeholder="Title — e.g. SQL Foundations · Sep 2026" className={fieldClass} />
              <select value={newBatch.class_id} onChange={(e) => setNewBatch({ ...newBatch, class_id: e.target.value })} className={fieldClass}>
                <option value="">Subject (link a course, optional)</option>
                {classes.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
              <input value={newBatch.schedule} onChange={(e) => setNewBatch({ ...newBatch, schedule: e.target.value })} placeholder="Schedule — e.g. Tue & Thu 7–8:30pm IST" className={fieldClass} />
              <input value={newBatch.price} onChange={(e) => setNewBatch({ ...newBatch, price: e.target.value })} placeholder="Price ₹ (whole rupees)" type="number" className={fieldClass} />
              <label className="flex flex-col gap-1"><span className="font-mono text-[10px] text-foreground/45">Start date</span><input type="date" value={newBatch.start_date} onChange={(e) => setNewBatch({ ...newBatch, start_date: e.target.value })} className={fieldClass} /></label>
              <label className="flex flex-col gap-1"><span className="font-mono text-[10px] text-foreground/45">End date</span><input type="date" value={newBatch.end_date} onChange={(e) => setNewBatch({ ...newBatch, end_date: e.target.value })} className={fieldClass} /></label>
              <input value={newBatch.capacity} onChange={(e) => setNewBatch({ ...newBatch, capacity: e.target.value })} placeholder="Capacity (0 = unlimited)" type="number" className={fieldClass} />
            </div>
            <Button onClick={addBatch} className="w-full"><Plus className="h-3.5 w-3.5" /> Add batch</Button>
          </div>
        </Card>
        </>
        )}

        {/* ── ARTICLES TAB ─────────────────────────────────────── */}
        {tab === "articles" && (
        <>
        <Card>
          <CardTitle icon={<FileText className="h-4 w-4" />} title="Articles" hint="Write BI articles. Drafts are private; publish to show them on /articles." />
          <ul className="mb-4 space-y-2">
            {articles.map((a) => (
              <ArticleEditor key={a.id} article={a} busy={busyId === a.id} onSave={saveArticle} onRemove={removeArticle} />
            ))}
            {articles.length === 0 && <EmptyRow label="No articles yet — write one below." />}
          </ul>
          <div className="space-y-2 rounded-xl border border-white/10 bg-white/[0.02] p-3">
            <p className="font-mono text-[11px] text-foreground/50">New article</p>
            <input value={newArticle.title} onChange={(e) => setNewArticle({ ...newArticle, title: e.target.value })} placeholder="Title" className={fieldClass} />
            <input value={newArticle.excerpt} onChange={(e) => setNewArticle({ ...newArticle, excerpt: e.target.value })} placeholder="Short excerpt (shown in the list)" className={fieldClass} />
            <textarea rows={5} value={newArticle.body} onChange={(e) => setNewArticle({ ...newArticle, body: e.target.value })} placeholder="Body — one paragraph per line…" className={fieldClass} />
            <Button onClick={addArticle} className="w-full"><Plus className="h-3.5 w-3.5" /> Create draft</Button>
          </div>
        </Card>
        </>
        )}

        {/* ── REVIEWS TAB (student testimonials) ───────────────── */}
        {tab === "reviews" && (
        <Card>
          <CardTitle
            icon={<MessageSquareHeart className="h-4 w-4" />}
            title="Student testimonials"
            hint="Students write these in the portal. Approve the ones you want on the homepage — nothing shows publicly until you do. Student edits automatically un-approve."
          />
          <ul className="space-y-2">
            {testimonials.map((t) => (
              <li key={t.id} className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm text-foreground">{t.author_name}</span>
                    {t.author_role && (
                      <span className="font-mono text-[11px] text-foreground/50">· {t.author_role}</span>
                    )}
                    <Stars value={t.rating ?? 0} />
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] ${
                      t.approved ? "bg-emerald-500/20 text-emerald-200" : "bg-amber-500/20 text-amber-200"
                    }`}
                  >
                    {t.approved ? "live" : "pending"}
                  </span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-foreground/70">&ldquo;{t.body}&rdquo;</p>
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setTestimonialApproved(t, !t.approved)}
                    disabled={busyId === t.id}
                    className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 font-mono text-[11px] font-medium transition-colors disabled:opacity-50 ${
                      t.approved
                        ? "border border-white/15 text-foreground/70 hover:bg-white/10"
                        : "bg-sky-500 text-white hover:bg-sky-400"
                    }`}
                  >
                    {busyId === t.id && <Loader2 className="h-3 w-3 animate-spin" />}
                    {t.approved ? "Hide from site" : "Approve & publish"}
                  </button>
                  <button
                    onClick={() => removeTestimonial(t.id)}
                    className="flex items-center gap-1.5 rounded-lg border border-red-400/30 px-3 py-1.5 font-mono text-[10px] text-red-300/90 transition-colors hover:bg-red-500/10"
                  >
                    <Trash2 className="h-3 w-3" /> Remove
                  </button>
                  <span className="ml-auto font-mono text-[10px] text-foreground/40">
                    {new Date(t.created_at).toLocaleDateString()}
                  </span>
                </div>
              </li>
            ))}
            {testimonials.length === 0 && <EmptyRow label="No testimonials yet — students can write one from My Classes once a session is confirmed." />}
          </ul>
        </Card>
        )}

        {/* ── ROADMAP TAB ──────────────────────────────────────── */}
        {tab === "roadmap" && (
        <Card>
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
        )}
      </div>
    </main>
  )
}

// Expandable editor for one course's full curriculum.
function CurriculumEditor({
  course,
  busy,
  onSave,
}: {
  course: ClassRow
  busy: boolean
  onSave: (c: ClassRow) => void
}) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<ClassRow>(course)

  // Keep local draft in sync if the parent reloads.
  useEffect(() => setDraft(course), [course])

  const setField = (patch: Partial<ClassRow>) => setDraft((d) => ({ ...d, ...patch }))
  const toLines = (a?: string[]) => (a ?? []).join("\n")
  const fromLines = (s: string) => s.split("\n").map((x) => x.trim()).filter(Boolean)

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03]">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <span className="text-sm text-foreground">{course.title}</span>
        <span className="font-mono text-[11px] text-foreground/50">{open ? "close" : "edit"}</span>
      </button>

      {open && (
        <div className="space-y-3 border-t border-white/10 p-4">
          <div className="grid gap-2 md:grid-cols-2">
            <div>
              <FieldLabel>Tagline</FieldLabel>
              <input value={draft.tagline ?? ""} onChange={(e) => setField({ tagline: e.target.value })} className={inputCls} placeholder="Turn raw data into decisions" />
            </div>
            <div>
              <FieldLabel>Level</FieldLabel>
              <input value={draft.level ?? ""} onChange={(e) => setField({ level: e.target.value })} className={inputCls} placeholder="Beginner → Advanced" />
            </div>
            <div>
              <FieldLabel>Duration</FieldLabel>
              <input value={draft.duration ?? ""} onChange={(e) => setField({ duration: e.target.value })} className={inputCls} placeholder="6–8 evening sessions" />
            </div>
            <div>
              <FieldLabel>Price (₹, whole rupees)</FieldLabel>
              <input
                type="number"
                value={draft.price_paise ? draft.price_paise / 100 : ""}
                onChange={(e) => setField({ price_paise: Math.round(Number(e.target.value) * 100) || 0 })}
                className={inputCls}
                placeholder="1500"
              />
            </div>
          </div>

          <div>
            <FieldLabel>Summary</FieldLabel>
            <textarea rows={2} value={draft.summary ?? ""} onChange={(e) => setField({ summary: e.target.value })} className={inputCls} />
          </div>
          <div>
            <FieldLabel>Who it's for</FieldLabel>
            <textarea rows={2} value={draft.for_whom ?? ""} onChange={(e) => setField({ for_whom: e.target.value })} className={inputCls} />
          </div>

          <div className="grid gap-2 md:grid-cols-2">
            <div>
              <FieldLabel>Outcomes (one per line)</FieldLabel>
              <textarea rows={4} value={toLines(draft.outcomes)} onChange={(e) => setField({ outcomes: fromLines(e.target.value) })} className={inputCls} />
            </div>
            <div>
              <FieldLabel>Syllabus / learning path (one step per line)</FieldLabel>
              <textarea rows={4} value={toLines(draft.syllabus)} onChange={(e) => setField({ syllabus: fromLines(e.target.value), learning_path: fromLines(e.target.value) })} className={inputCls} />
            </div>
          </div>

          <div>
            <FieldLabel>Tools (comma or new line)</FieldLabel>
            <input value={(draft.tools ?? []).join(", ")} onChange={(e) => setField({ tools: e.target.value.split(/[,\n]/).map((x) => x.trim()).filter(Boolean) })} className={inputCls} placeholder="Excel, SQL, Tableau" />
          </div>

          <Button onClick={() => onSave(draft)} disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {busy ? "Saving…" : "Save course"}
          </Button>
        </div>
      )}
    </div>
  )
}

// Editable row for one batch (scheduled cohort).
function BatchEditor({
  batch,
  classes,
  busy,
  onSave,
  onRemove,
}: {
  batch: BatchRow
  classes: ClassRow[]
  busy: boolean
  onSave: (b: BatchRow) => void
  onRemove: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [d, setD] = useState<BatchRow>(batch)
  useEffect(() => setD(batch), [batch])
  const set = (patch: Partial<BatchRow>) => setD((p) => ({ ...p, ...patch }))

  return (
    <li className="rounded-xl border border-white/10 bg-white/[0.03]">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left">
        <span className="min-w-0">
          <span className="text-sm text-foreground">{batch.title}</span>
          <span className="ml-2 font-mono text-[11px] text-foreground/45">
            {batch.price_paise > 0 ? `₹${(batch.price_paise / 100).toFixed(0)}` : "on request"}
            {batch.active ? "" : " · inactive"}
          </span>
        </span>
        <span className="font-mono text-[11px] text-foreground/50">{open ? "close" : "edit"}</span>
      </button>
      {open && (
        <div className="space-y-2 border-t border-white/10 p-4">
          <div className="grid gap-2 md:grid-cols-2">
            <input value={d.title} onChange={(e) => set({ title: e.target.value })} placeholder="Title" className={inputCls} />
            <select value={d.class_id ?? ""} onChange={(e) => set({ class_id: e.target.value || null })} className={inputCls}>
              <option value="">Subject (link a course)</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
            <input value={d.schedule} onChange={(e) => set({ schedule: e.target.value })} placeholder="Schedule" className={inputCls} />
            <input type="number" value={d.price_paise ? d.price_paise / 100 : ""} onChange={(e) => set({ price_paise: Math.round(Number(e.target.value) * 100) || 0 })} placeholder="Price ₹" className={inputCls} />
            <label className="flex flex-col gap-1"><span className="font-mono text-[10px] text-foreground/45">Start</span><input type="date" value={d.start_date ?? ""} onChange={(e) => set({ start_date: e.target.value || null })} className={inputCls} /></label>
            <label className="flex flex-col gap-1"><span className="font-mono text-[10px] text-foreground/45">End</span><input type="date" value={d.end_date ?? ""} onChange={(e) => set({ end_date: e.target.value || null })} className={inputCls} /></label>
            <input type="number" value={d.capacity || ""} onChange={(e) => set({ capacity: Number(e.target.value) || 0 })} placeholder="Capacity (0 = unlimited)" className={inputCls} />
          </div>
          <textarea rows={2} value={d.description} onChange={(e) => set({ description: e.target.value })} placeholder="Description" className={inputCls} />
          <label className="flex items-center gap-2 text-sm text-foreground/80">
            <input type="checkbox" checked={d.active} onChange={(e) => set({ active: e.target.checked })} className="h-4 w-4 accent-sky-500" />
            Active (visible to students)
          </label>
          <div className="flex gap-2">
            <Button onClick={() => onSave(d)} disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}{busy ? "Saving…" : "Save batch"}
            </Button>
            <button onClick={() => onRemove(d.id)} className="flex items-center gap-1.5 rounded-lg border border-red-400/30 px-3 py-1.5 font-mono text-[10px] text-red-300/90 hover:bg-red-500/10">
              <Trash2 className="h-3 w-3" /> Remove
            </button>
          </div>
        </div>
      )}
    </li>
  )
}

// Editable row for one article.
function ArticleEditor({
  article, busy, onSave, onRemove,
}: {
  article: ArticleRow
  busy: boolean
  onSave: (a: ArticleRow) => void
  onRemove: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [d, setD] = useState<ArticleRow>(article)
  useEffect(() => setD(article), [article])
  const set = (patch: Partial<ArticleRow>) => setD((p) => ({ ...p, ...patch }))

  return (
    <li className="rounded-xl border border-white/10 bg-white/[0.03]">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left">
        <span className="min-w-0">
          <span className="text-sm text-foreground">{article.title}</span>
          <span className={`ml-2 rounded-full px-2 py-0.5 font-mono text-[10px] ${article.published ? "bg-emerald-500/20 text-emerald-200" : "bg-white/10 text-foreground/50"}`}>
            {article.published ? "published" : "draft"}
          </span>
        </span>
        <span className="font-mono text-[11px] text-foreground/50">{open ? "close" : "edit"}</span>
      </button>
      {open && (
        <div className="space-y-2 border-t border-white/10 p-4">
          <input value={d.title} onChange={(e) => set({ title: e.target.value })} placeholder="Title" className={inputCls} />
          <input value={d.excerpt} onChange={(e) => set({ excerpt: e.target.value })} placeholder="Excerpt" className={inputCls} />
          <textarea rows={8} value={d.body} onChange={(e) => set({ body: e.target.value })} placeholder="Body — one paragraph per line" className={inputCls} />
          <label className="flex items-center gap-2 text-sm text-foreground/80">
            <input type="checkbox" checked={d.published} onChange={(e) => set({ published: e.target.checked })} className="h-4 w-4 accent-sky-500" />
            Published (visible on /articles)
          </label>
          <div className="flex gap-2">
            <Button onClick={() => onSave(d)} disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}{busy ? "Saving…" : "Save"}</Button>
            <button onClick={() => onRemove(d.id)} className="flex items-center gap-1.5 rounded-lg border border-red-400/30 px-3 py-1.5 font-mono text-[10px] text-red-300/90 hover:bg-red-500/10">
              <Trash2 className="h-3 w-3" /> Remove
            </button>
          </div>
        </div>
      )}
    </li>
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

// Full-day, editable hour range for availability (07:00 → 22:00 starts).
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const HOURS = Array.from({ length: 16 }, (_, i) => `${String(i + 7).padStart(2, "0")}:00`) // 07:00..22:00

function hourLabel(hhmm: string) {
  const h = Number(hhmm.split(":")[0])
  return `${((h + 11) % 12) + 1}${h >= 12 ? "pm" : "am"}`
}

// One weekday row: on/off state + a wrap of hour toggles.
function AvailabilityDay({
  name,
  slots,
  onToggle,
  onClear,
}: {
  name: string
  slots: string[]
  onToggle: (hhmm: string) => void
  onClear: () => void
}) {
  const on = slots.length > 0
  return (
    <div className={`rounded-xl border p-3.5 transition-colors ${on ? "border-sky-400/25 bg-sky-400/[0.06]" : "border-white/10 bg-white/[0.03]"}`}>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{name}</span>
        {on ? (
          <button onClick={onClear} className="font-mono text-[10px] text-foreground/50 hover:text-foreground">
            turn off
          </button>
        ) : (
          <span className="font-mono text-[10px] text-foreground/40">off</span>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {HOURS.map((h) => {
          const active = slots.includes(h)
          return (
            <button
              key={h}
              type="button"
              onClick={() => onToggle(h)}
              aria-pressed={active}
              className={`rounded-md px-2 py-1 font-mono text-[11px] transition-colors ${
                active
                  ? "bg-gradient-to-r from-sky-500 to-amber-400 text-black"
                  : "border border-white/10 text-foreground/60 hover:border-white/25 hover:text-foreground"
              }`}
            >
              {hourLabel(h)}
            </button>
          )
        })}
      </div>
    </div>
  )
}

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
