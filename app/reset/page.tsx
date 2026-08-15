"use client"

import { useEffect, useState, type FormEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Lock, Eye, EyeOff, Loader2, CheckCircle2, ShieldQuestion } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { PageBackdrop, Card, Button, fieldClass, FieldLabel } from "@/components/ui/shell"

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
  const [show, setShow] = useState(false)
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
    <main className="relative flex min-h-[100dvh] items-center justify-center px-5 py-16 text-foreground">
      <PageBackdrop />

      <div className="relative z-10 w-full max-w-md">
        <Link
          href="/login/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-foreground/60 transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to login
        </Link>

        <Card>
          <h1 className="text-2xl font-medium tracking-tight text-foreground">Set a new password</h1>
          <p className="mt-1.5 text-sm text-foreground/55">Choose a new password for your account.</p>

          <div className="mt-8">
            {done ? (
              <div className="flex items-center gap-3 rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                Password updated! Redirecting you to sign in…
              </div>
            ) : !ready ? (
              <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-foreground/60">
                <ShieldQuestion className="mt-0.5 h-5 w-5 shrink-0 text-foreground/40" />
                Open this page from the reset link in your email. Waiting for a valid recovery
                session…
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <FieldLabel htmlFor="new-password">New password</FieldLabel>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-foreground/40">
                      <Lock className="h-4 w-4" />
                    </span>
                    <input
                      id="new-password"
                      type={show ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      autoComplete="new-password"
                      className={`${fieldClass} pl-10 pr-10`}
                      placeholder="At least 6 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShow((s) => !s)}
                      aria-label={show ? "Hide password" : "Show password"}
                      className="absolute inset-y-0 right-3 flex items-center text-foreground/40 transition-colors hover:text-foreground/80"
                    >
                      {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <FieldLabel htmlFor="confirm-password">Confirm password</FieldLabel>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-foreground/40">
                      <Lock className="h-4 w-4" />
                    </span>
                    <input
                      id="confirm-password"
                      type={show ? "text" : "password"}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      required
                      autoComplete="new-password"
                      className={`${fieldClass} pl-10`}
                      placeholder="Re-enter password"
                    />
                  </div>
                </div>

                <Button type="submit" disabled={busy} className="w-full">
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                  {busy ? "Updating…" : "Update password"}
                </Button>

                {error && (
                  <p role="alert" className="text-center text-xs text-red-300">
                    {error}
                  </p>
                )}
              </form>
            )}
          </div>
        </Card>
      </div>
    </main>
  )
}
