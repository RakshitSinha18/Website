"use client"

import { useEffect, useState, type FormEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { supabase } from "@/lib/supabase"

/**
 * Set a new password after clicking the reset link from email.
 * Supabase places the user in a temporary recovery session via the URL,
 * so we can call updateUser({ password }) directly.
 */
export default function ResetPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!supabase) return
    // The recovery link creates a session; confirm we have one.
    supabase.auth.getSession().then(({ data }) => setReady(Boolean(data.session)))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) setReady(true)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    if (!supabase) return
    if (password.length < 6) {
      setError("Password must be at least 6 characters.")
      return
    }
    if (password !== confirm) {
      setError("Passwords don't match.")
      return
    }
    setBusy(true)
    const { error } = await supabase.auth.updateUser({ password })
    setBusy(false)
    if (error) {
      setError(error.message)
      return
    }
    setDone(true)
    setTimeout(() => router.replace("/login/"), 2500)
  }

  return (
    <main className="relative flex min-h-[100dvh] items-center justify-center px-5 py-16">
      <div className="animated-gradient floating-orbs fixed inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-black/30" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <Link
          href="/login/"
          className="mb-6 inline-flex items-center gap-2 font-mono text-xs text-foreground/80 transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to login
        </Link>

        <div className="rounded-2xl border border-foreground/20 bg-[#0d1526]/95 p-6 shadow-2xl backdrop-blur-2xl md:p-8">
          <h1 className="mb-1 font-sans text-3xl font-light tracking-tight text-foreground">Set a new password</h1>
          <p className="mb-6 font-mono text-xs text-foreground/60">
            Choose a new password for your account.
          </p>

          {done ? (
            <p className="font-mono text-sm text-emerald-300/90">
              Password updated! Redirecting you to sign in…
            </p>
          ) : !ready ? (
            <p className="font-mono text-xs text-foreground/60">
              Open this page from the reset link in your email. Waiting for a valid recovery session…
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block font-mono text-xs text-foreground/80">New password</label>
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
              <div>
                <label className="mb-1 block font-mono text-xs text-foreground/80">Confirm password</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  className="w-full rounded-lg border border-foreground/20 bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-foreground/40 focus:border-foreground/50 focus:outline-none"
                  placeholder="Re-enter password"
                />
              </div>
              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-full bg-gradient-to-r from-sky-500 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 transition-all hover:scale-[1.02] hover:from-sky-400 hover:to-blue-500 disabled:opacity-50"
              >
                {busy ? "Updating…" : "Update password"}
              </button>
              {error && <p className="text-center font-mono text-xs text-red-300/90">{error}</p>}
            </form>
          )}
        </div>
      </div>
    </main>
  )
}
