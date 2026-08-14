"use client"

import { useState, type FormEvent, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"
import { useAuth } from "@/hooks/use-auth"

export default function LoginPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [mode, setMode] = useState<"signin" | "signup">("signin")
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")

  // Already logged in → go straight to the portal.
  useEffect(() => {
    if (!loading && user) router.replace("/portal")
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
          router.replace("/portal")
        } else {
          setNotice("Check your email to confirm your account, then sign in.")
          setMode("signin")
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.replace("/portal")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.")
    } finally {
      setBusy(false)
    }
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
            {mode === "signin" ? "Student login" : "Create your account"}
          </h1>
          <p className="mb-6 font-mono text-xs text-foreground/60">
            {mode === "signin"
              ? "Sign in to book evening mentoring classes."
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
              className="w-full rounded-full bg-foreground/95 px-6 py-3 text-sm font-medium text-background transition-all hover:bg-foreground disabled:opacity-50"
            >
              {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
            </button>

            {error && <p className="text-center font-mono text-xs text-red-300/90">{error}</p>}
            {notice && <p className="text-center font-mono text-xs text-emerald-300/90">{notice}</p>}
          </form>

          <div className="mt-6 text-center font-mono text-xs text-foreground/60">
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
