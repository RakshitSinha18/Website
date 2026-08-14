"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { LogOut, Check, Mail, ShieldCheck, CalendarClock, Inbox } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/use-auth"
import { isAdminEmail } from "@/lib/config"

interface ClassBooking {
  id: string
  user_id: string
  class_title: string
  scheduled_at: string
  notes: string
  status: string
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

export default function AdminPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [classBookings, setClassBookings] = useState<ClassBooking[]>([])
  const [requests, setRequests] = useState<SessionRequest[]>([])
  const [msg, setMsg] = useState("")
  const [busyId, setBusyId] = useState<string | null>(null)

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
    const load = async () => {
      const [{ data: cb }, { data: sr }] = await Promise.all([
        supabase.from("class_bookings").select("*").order("scheduled_at", { ascending: true }),
        supabase.from("session_bookings").select("*").order("created_at", { ascending: false }),
      ])
      if (cb) setClassBookings(cb as ClassBooking[])
      if (sr) setRequests(sr as SessionRequest[])
    }
    load()
  }, [allowed])

  const approve = async (b: ClassBooking) => {
    if (!supabase) return
    setBusyId(b.id)
    setMsg("")
    const { error } = await supabase.from("class_bookings").update({ status: "confirmed" }).eq("id", b.id)
    setBusyId(null)
    if (error) {
      setMsg(error.message)
      return
    }
    setClassBookings((prev) => prev.map((x) => (x.id === b.id ? { ...x, status: "confirmed" } : x)))
    setMsg(`Approved ${b.class_title}. (Session-link email fires via the Supabase function.)`)
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

        {msg && (
          <div className="mb-6 rounded-lg border border-foreground/20 bg-foreground/10 px-4 py-2.5 font-mono text-xs text-foreground/90 backdrop-blur">
            {msg}
          </div>
        )}

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
                      <Check className="h-3 w-3" /> confirmed
                    </span>
                  ) : (
                    <button
                      onClick={() => approve(b)}
                      disabled={busyId === b.id}
                      className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-sky-500 to-amber-400 px-4 py-1.5 font-mono text-[11px] font-medium text-black transition-all hover:scale-105 disabled:opacity-50"
                    >
                      {busyId === b.id ? "Approving…" : "Approve & send link"}
                    </button>
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
