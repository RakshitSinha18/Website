"use client"

import { useState, type FormEvent, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  GraduationCap,
  ShieldCheck,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Loader2,
  Github,
  Linkedin,
} from "lucide-react"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"
import { useAuth } from "@/hooks/use-auth"
import { isAdminEmail } from "@/lib/config"
import { useToast } from "@/components/toast"
import { PageBackdrop } from "@/components/ui/shell"

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
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(false)
  // Set when sign-in fails because the email isn't confirmed yet.
  const [needsVerify, setNeedsVerify] = useState(false)
  // Captcha token (set when the widget is configured/solved). Optional until
  // captcha is enabled in Supabase — see SIGNUP-CAPTCHA.md.
  const [captchaToken] = useState<string>("")

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

    // Extra guardrails on signup for a cleaner experience.
    if (mode === "signup" && !isMentor) {
      if (!fullName.trim()) {
        toast("Please enter your full name.", "error")
        return
      }
      if (password.length < 8) {
        toast("Use at least 8 characters for a strong password.", "error")
        return
      }
      if (!agreeTerms) {
        toast("Please accept the Terms & Privacy Policy to continue.", "error")
        return
      }
    }

    setBusy(true)
    setNeedsVerify(false)
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: `${window.location.origin}/login/`,
            ...(captchaToken ? { captchaToken } : {}),
          },
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
      const msg = err instanceof Error ? err.message : "Something went wrong."
      // Supabase says "Email not confirmed" — offer a resend instead of a dead end.
      if (/not confirmed|confirm/i.test(msg)) {
        setNeedsVerify(true)
        toast("Your email isn't verified yet. Check your inbox/spam, or resend below.", "error")
      } else {
        toast(msg, "error")
      }
    } finally {
      setBusy(false)
    }
  }

  // Re-send the confirmation email for an account that hasn't been verified.
  const handleResendVerification = async () => {
    if (!supabase) {
      toast("Login isn't configured yet.", "error")
      return
    }
    if (!email) {
      toast("Enter your email above first.", "info")
      return
    }
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${window.location.origin}/login/` },
    })
    if (error) toast(error.message, "error")
    else toast("Verification email resent — check your inbox (and spam).", "success")
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

  // Social sign-in. Supabase redirects back to /login/, where the useAuth effect
  // routes the user by role (admin vs student). OAuth users skip email confirmation.
  const handleOAuth = async (provider: "google" | "github" | "linkedin_oidc") => {
    if (!supabase) {
      toast("Login isn't configured yet.", "error")
      return
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/login/` },
    })
    if (error) toast(error.message, "error")
  }

  return (
    <main className="relative min-h-[100dvh] bg-[#0b0f19] text-foreground">
      <PageBackdrop />

      <div className="relative z-10 mx-auto grid min-h-[100dvh] w-full max-w-6xl grid-cols-1 lg:grid-cols-2">
        {/* Brand / context panel (hidden on small screens) */}
        <aside className="hidden flex-col justify-between border-r border-white/5 p-10 lg:flex xl:p-14">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-foreground/60 transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to site
          </Link>

          <div className="stagger max-w-sm">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              <span className="font-mono text-[11px] text-foreground/70">
                Senior BI Consultant @ IBM
              </span>
            </div>

            <h2 className="text-2xl font-light leading-snug tracking-tight text-foreground">
              Turn data into decisions — learn BI one evening at a time.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-foreground/55">
              1-on-1 evening classes and a tracked learning roadmap across Tableau, SQL,
              Advanced Excel and Base SAS — taught by a working data professional.
            </p>

            {/* Verifiable facts only — no invented metrics. */}
            <div className="mt-8 grid grid-cols-3 gap-3">
              {[
                { value: "9+", label: "Years in BI" },
                { value: "7", label: "Companies" },
                { value: "100+", label: "Dashboards" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-center"
                >
                  <p className="text-xl font-medium text-foreground">{s.value}</p>
                  <p className="mt-0.5 font-mono text-[10px] leading-tight text-foreground/50">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>

            {/* Tech stack chips */}
            <div className="mt-6">
              <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-foreground/40">
                Core stack
              </p>
              <div className="flex flex-wrap gap-2">
                {["Tableau", "SQL / T-SQL", "Advanced Excel", "Base SAS 9.4", "Power BI"].map(
                  (t) => (
                    <span
                      key={t}
                      className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 font-mono text-[11px] text-foreground/70 transition-colors hover:border-sky-400/40 hover:text-foreground"
                    >
                      {t}
                    </span>
                  ),
                )}
              </div>
            </div>
          </div>

          <p className="font-mono text-xs text-foreground/35">© Rakshit Sinha · sinharakshit.com</p>
        </aside>

        {/* Form panel */}
        <section className="flex flex-col justify-center px-6 py-14 sm:px-10 lg:px-14">
          {/* Mobile-only back link */}
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-2 self-start text-sm text-foreground/60 transition-colors hover:text-foreground lg:hidden"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to site
          </Link>

          <div className="stagger mx-auto w-full max-w-sm">
            {/* Role toggle — real icons, no emojis */}
            <div
              role="tablist"
              aria-label="Choose account type"
              className="mb-8 grid grid-cols-2 gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1"
            >
              <button
                type="button"
                role="tab"
                aria-selected={!isMentor}
                onClick={() => setRole("student")}
                className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all ${
                  !isMentor
                    ? "bg-white text-[#0b0f19] shadow-sm"
                    : "text-foreground/55 hover:text-foreground"
                }`}
              >
                <GraduationCap className="h-4 w-4" />
                Student
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={isMentor}
                onClick={() => setRole("mentor")}
                className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all ${
                  isMentor
                    ? "bg-sky-500 text-white shadow-sm"
                    : "text-foreground/55 hover:text-foreground"
                }`}
              >
                <ShieldCheck className="h-4 w-4" />
                Admin
              </button>
            </div>

            <h1 className="text-2xl font-medium tracking-tight text-foreground">
              {isMentor ? "Admin sign in" : mode === "signin" ? "Welcome back" : "Create your account"}
            </h1>
            <p className="mt-1.5 text-sm text-foreground/55">
              {isMentor
                ? "Manage bookings, courses, roadmap and payments."
                : mode === "signin"
                  ? "Sign in to book classes and track your roadmap."
                  : "Join to book 1-on-1 evening classes with Rakshit."}
            </p>

            {/* Social sign-in — no email confirmation needed (provider verifies).
                GitHub is shown for BOTH students and the mentor: admin access is
                granted server-side by RLS on the account's email, so Rakshit can
                sign in with a GitHub account whose email matches ADMIN_EMAIL. */}
            <div className="mt-6">
              <div className="grid gap-2">
                {/* Google & LinkedIn hidden until their providers are enabled in Supabase.
                    Re-enable by uncommenting once configured (see PAYMENTS-SETUP / auth setup). */}
                {!isMentor && (
                  <>
                    {/* <OAuthButton label="Continue with Google" onClick={() => handleOAuth("google")} icon={<GoogleIcon />} /> */}
                  </>
                )}
                <OAuthButton
                  label={isMentor ? "Sign in with GitHub" : "Continue with GitHub"}
                  onClick={() => handleOAuth("github")}
                  icon={<Github className="h-4 w-4" />}
                />
                {/* <OAuthButton label="Continue with LinkedIn" onClick={() => handleOAuth("linkedin_oidc")} icon={<Linkedin className="h-4 w-4" />} /> */}
              </div>
              <div className="my-5 flex items-center gap-3">
                <span className="h-px flex-1 bg-white/10" />
                <span className="font-mono text-[10px] uppercase tracking-wider text-foreground/40">or</span>
                <span className="h-px flex-1 bg-white/10" />
              </div>
            </div>

            <form onSubmit={handleSubmit} className={isMentor ? "mt-8 space-y-4" : "space-y-4"}>
              {mode === "signup" && !isMentor && (
                <Field label="Full name" htmlFor="fullName" icon={<User className="h-4 w-4" />}>
                  <input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={inputClass}
                    placeholder="Your name"
                    autoComplete="name"
                  />
                </Field>
              )}

              <Field label="Email" htmlFor="email" icon={<Mail className="h-4 w-4" />}>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={inputClass}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </Field>

              <Field
                label="Password"
                htmlFor="password"
                icon={<Lock className="h-4 w-4" />}
                trailing={
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="pointer-events-auto text-foreground/40 transition-colors hover:text-foreground/80"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
              >
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={mode === "signup" ? 8 : 6}
                  className={`${inputClass} pr-10`}
                  placeholder={mode === "signup" ? "At least 8 characters" : "••••••••"}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                />
              </Field>

              {/* Password strength (signup only) */}
              {mode === "signup" && !isMentor && password.length > 0 && (
                <PasswordStrength value={password} />
              )}

              {mode === "signin" && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="text-xs text-foreground/50 transition-colors hover:text-foreground"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              {/* Terms acceptance (signup only) */}
              {mode === "signup" && !isMentor && (
                <label className="flex cursor-pointer items-start gap-2 text-xs text-foreground/60">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-sky-500"
                  />
                  <span>
                    I agree to the{" "}
                    <a href="/terms/" target="_blank" className="text-sky-300 underline">Terms</a> and{" "}
                    <a href="/privacy/" target="_blank" className="text-sky-300 underline">Privacy Policy</a>.
                  </span>
                </label>
              )}

              <button
                type="submit"
                disabled={busy}
                className={`flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all disabled:opacity-60 ${
                  isMentor
                    ? "bg-sky-500 text-white hover:bg-sky-400"
                    : "bg-white text-[#0b0f19] hover:bg-white/90"
                }`}
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
              </button>

              {/* Shown when sign-in fails because the email isn't verified. */}
              {needsVerify && (
                <div className="rounded-xl border border-amber-400/25 bg-amber-500/10 px-4 py-3 text-xs text-amber-100">
                  <p>This email hasn&apos;t been verified yet. Check your inbox and spam, or resend the link.</p>
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    className="mt-2 font-medium underline underline-offset-4 hover:text-white"
                  >
                    Resend verification email
                  </button>
                </div>
              )}
            </form>

            {/* Students can self-register; the admin account is pre-created. */}
            {!isMentor && (
              <p className="mt-6 text-center text-sm text-foreground/55">
                {mode === "signin" ? (
                  <>
                    New here?{" "}
                    <button
                      onClick={() => setMode("signup")}
                      className="font-medium text-foreground underline-offset-4 hover:underline"
                    >
                      Create an account
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{" "}
                    <button
                      onClick={() => setMode("signin")}
                      className="font-medium text-foreground underline-offset-4 hover:underline"
                    >
                      Sign in
                    </button>
                  </>
                )}
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}

const inputClass =
  "w-full rounded-xl border border-white/10 bg-white/[0.03] py-2.5 pl-10 pr-3 text-sm text-foreground placeholder:text-foreground/35 transition-colors focus:border-white/25 focus:bg-white/[0.05] focus:outline-none"

/** A social sign-in button. */
function OAuthButton({
  label,
  icon,
  onClick,
}: {
  label: string
  icon: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-white/[0.08]"
    >
      {icon}
      {label}
    </button>
  )
}

/** Google "G" mark (lucide has no brand logo). */
function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z" />
    </svg>
  )
}

/** Simple password strength meter: length + character variety. */
function PasswordStrength({ value }: { value: string }) {
  let score = 0
  if (value.length >= 8) score++
  if (value.length >= 12) score++
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score++
  if (/\d/.test(value)) score++
  if (/[^A-Za-z0-9]/.test(value)) score++
  const level = Math.min(score, 4)
  const labels = ["Very weak", "Weak", "Fair", "Good", "Strong"]
  const colors = ["bg-red-500", "bg-red-400", "bg-amber-400", "bg-sky-400", "bg-emerald-400"]
  return (
    <div>
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i < level ? colors[level] : "bg-white/10"
            }`}
          />
        ))}
      </div>
      <p className="mt-1 font-mono text-[10px] text-foreground/45">{labels[level]}</p>
    </div>
  )
}

/** Labeled input wrapper with a leading icon and optional trailing control. */
function Field({
  label,
  htmlFor,
  icon,
  trailing,
  children,
}: {
  label: string
  htmlFor: string
  icon: React.ReactNode
  trailing?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-medium text-foreground/70">
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-foreground/40">
          {icon}
        </span>
        {children}
        {trailing && (
          <span className="absolute inset-y-0 right-3 flex items-center">{trailing}</span>
        )}
      </div>
    </div>
  )
}
