"use client"

import { useState, type FormEvent, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"
import { useAuth } from "@/hooks/use-auth"
import { isAdminEmail } from "@/lib/config"

export default function LoginPage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  // Rakshit → admin dashboard; students → their portal.
  const destFor = (email?: string | null) => (isAdminEmail(email) ? "/admin" : "/portal")
  const [mode, setMode] = useState<"signin" | "signup">("signin")
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")

  // Already logged in → go to the right place (admin vs student).
  useEffect(() => {
    if (!loading && user) router.replace(destFor(user.email))
  }, [loading, user, router])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    setNotice("")

    if (!isSupabaseConfigured || !supabase) {
      setError("Login isn't configured yet. Please try again later.")
      return
    }
    if (!email || !password) {
      setError("Enter your email and password.")
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
        // If email confirmation is on, there's no session yet.
        const { data } = await supabase.auth.getSession()
        if (data.session) {
          router.replace(destFor(email))
        } else {
          setNotice("Check your email to confirm your account, then sign in.")
          setMode("signin")
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.replace(destFor(email))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.")
    } finally {
      setBusy(false)
    }
  }

  // Send a password-reset email (works for students AND Rakshit's owner account).
  const handleReset = async () => {
    setError("")
    setNotice("")
    if (!supabase) {
      setError("Login isn't configured yet.")
      return
    }
    if (!email) {
      setError("Enter your email above first, then tap “Forgot password”.")
      return
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset/`,
    })
    if (error) setError(error.message)
    else setNotice("Password reset link sent — check your email.")
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

        <div className="rounded-2xl border border-foreground/20 bg-background/85 p-6 shadow-2xl backdrop-blur-2xl md:p-8">
          <h1 className="mb-1 font-sans text-3xl font-light tracking-tight text-foreground">
            {mode === "signin" ? "Sign in" : "Create your account"}
          </h1>
          <p className="mb-5 font-mono text-xs text-foreground/60">
            {mode === "signin"
              ? "One login for everyone — students reach their portal, Rakshit reaches the mentor dashboard."
              : "Join to book 1-on-1 evening classes with Rakshit."}
          </p>

          {mode === "signin" && (
            <div className="mb-5 flex gap-2">
              <span className="flex-1 rounded-lg border border-foreground/15 bg-foreground/5 px-3 py-2 text-center font-mono text-[11px] text-foreground/70">
                🎓 Student → Portal
              </span>
              <span className="flex-1 rounded-lg border border-sky-400/25 bg-sky-400/10 px-3 py-2 text-center font-mono text-[11px] text-sky-200/90">
                🛡 Rakshit → Admin
              </span>
            </div>
          )}

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
              className="w-full rounded-full bg-foreground/95 px-6 py-3 text-sm font-medium text-background transition-all hover:bg-foreground disabled:opacity-50"
            >
              {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
            </button>

            {error && <p className="text-center font-mono text-xs text-red-300/90">{error}</p>}
            {notice && <p className="text-center font-mono text-xs text-emerald-300/90">{notice}</p>}
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

          <div className="mt-4 text-center font-mono text-xs text-foreground/60">
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
