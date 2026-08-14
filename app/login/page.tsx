"use client"

import { useState, type FormEvent, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"
import { useAuth } from "@/hooks/use-auth"
import { isAdminEmail } from "@/lib/config"
import { useToast } from "@/components/toast"

export default function LoginPage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  // Rakshit → admin dashboard; students → their portal.
  const destFor = (email?: string | null) => (isAdminEmail(email) ? "/admin" : "/portal")

  // Clear Admin vs Student distinction. Default is student; ?role=mentor for admin.
  const [role, setRole] = useState<"student" | "mentor">("student")
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get("role") === "mentor") setRole("mentor")
  }, [])
  const isMentor = role === "mentor"

  const { toast } = useToast()
  const [mode, setMode] = useState<"signin" | "signup">("signin")
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [busy, setBusy] = useState(false)

  // Already logged in → go to the right place (admin vs student).
  useEffect(() => {
    if (!loading && user) router.replace(destFor(user.email))
  }, [loading, user, router])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!isSupabaseConfigured || !supabase) {
      toast("Login isn't configured yet. Please try again later.", "error")
      return
    }
    if (!email || !password) {
      toast("Enter your email and password.", "error")
      return
    }

    setBusy(true)
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        })
        if (error) throw error
        const { data } = await supabase.auth.getSession()
        if (data.session) {
          toast("Welcome! Taking you to your dashboard…", "success")
          router.replace(destFor(email))
        } else {
          toast("Almost there — check your email to confirm your account, then sign in.", "success")
          setMode("signin")
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        toast("Signed in! Redirecting…", "success")
        router.replace(destFor(email))
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : "Something went wrong.", "error")
    } finally {
      setBusy(false)
    }
  }

  // Send a password-reset email (works for students AND Rakshit's owner account).
  const handleReset = async () => {
    if (!supabase) {
      toast("Login isn't configured yet.", "error")
      return
    }
    if (!email) {
      toast("Enter your email above first, then tap “Forgot password”.", "info")
      return
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset/`,
    })
    if (error) toast(error.message, "error")
    else toast("Password reset link sent — check your email.", "success")
  }

  return (
    <main className="relative flex min-h-[100dvh] items-center justify-center px-5 py-16">
      {/* Full-bleed fixed background so it always covers the viewport */}
      <div className="animated-gradient floating-orbs fixed inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-black/30" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 font-mono text-xs text-foreground/80 transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to site
        </Link>

        <div
          className={`rounded-2xl border bg-background/85 p-6 shadow-2xl backdrop-blur-2xl md:p-8 ${
            isMentor ? "border-sky-400/40" : "border-foreground/20"
          }`}
        >
          {/* Clear Admin vs Student toggle */}
          <div className="mb-5 grid grid-cols-2 gap-1 rounded-full border border-foreground/15 bg-foreground/5 p-1">
            <button
              type="button"
              onClick={() => setRole("student")}
              className={`rounded-full py-2 font-mono text-xs transition-all ${
                !isMentor ? "bg-foreground text-background" : "text-foreground/60 hover:text-foreground"
              }`}
            >
              🎓 Student
            </button>
            <button
              type="button"
              onClick={() => setRole("mentor")}
              className={`rounded-full py-2 font-mono text-xs transition-all ${
                isMentor ? "bg-sky-500 text-white" : "text-foreground/60 hover:text-foreground"
              }`}
            >
              🛡 Rakshit (Admin)
            </button>
          </div>

          <h1 className="mb-1 font-sans text-3xl font-light tracking-tight text-foreground">
            {isMentor ? "Mentor sign in" : mode === "signin" ? "Student sign in" : "Create your account"}
          </h1>
          <p className="mb-5 font-mono text-xs text-foreground/60">
            {isMentor
              ? "Rakshit's dashboard — manage bookings, courses, roadmap and payments."
              : mode === "signin"
                ? "Book evening classes and track your learning roadmap."
                : "Join to book 1-on-1 evening classes with Rakshit."}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label className="mb-1 block font-mono text-xs text-foreground/80">Full name</label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-lg border border-foreground/20 bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-foreground/40 focus:border-foreground/50 focus:outline-none"
                  placeholder="Your name"
                />
              </div>
            )}

            <div>
              <label className="mb-1 block font-mono text-xs text-foreground/60">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-foreground/20 bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-foreground/40 focus:border-foreground/50 focus:outline-none"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="mb-1 block font-mono text-xs text-foreground/60">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full rounded-lg border border-foreground/20 bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-foreground/40 focus:border-foreground/50 focus:outline-none"
                placeholder="At least 6 characters"
              />
            </div>

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-full bg-gradient-to-r from-sky-500 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 transition-all hover:scale-[1.02] hover:from-sky-400 hover:to-blue-500 disabled:opacity-50"
            >
              {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
            </button>

          </form>

          {mode === "signin" && (
            <div className="mt-3 text-center">
              <button
                onClick={handleReset}
                className="font-mono text-xs text-foreground/60 underline-offset-2 transition-colors hover:text-foreground hover:underline"
              >
                Forgot password?
              </button>
            </div>
          )}

          {/* Students can self-register; the mentor account is pre-created. */}
          <div className={`mt-4 text-center font-mono text-xs text-foreground/60 ${isMentor ? "hidden" : ""}`}>
            {mode === "signin" ? (
              <>
                New here?{" "}
                <button onClick={() => setMode("signup")} className="text-foreground underline underline-offset-2">
                  Create an account
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button onClick={() => setMode("signin")} className="text-foreground underline underline-offset-2">
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
