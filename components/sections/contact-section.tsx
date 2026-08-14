"use client"

import { Mail, MapPin, Linkedin, Github } from "lucide-react"
import { useReveal } from "@/hooks/use-reveal"
import { useState, type FormEvent } from "react"
import { supabase } from "@/lib/supabase"

const TOPICS = ["Tableau / BI", "SQL & Data", "Career Guidance", "Advanced Excel", "Base SAS", "Other"]

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function ContactSection() {
  const { ref, isVisible } = useReveal(0.3)
  const [formData, setFormData] = useState({ name: "", email: "", topic: TOPICS[0], message: "" })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")

    if (!formData.name.trim() || !formData.message.trim()) {
      setError("Please fill in your name and a short note.")
      return
    }
    if (!EMAIL_RE.test(formData.email.trim())) {
      setError("Please enter a valid email address.")
      return
    }

    if (!supabase) {
      setError("Booking isn't configured yet. Please email rsinha1369@gmail.com.")
      return
    }

    setIsSubmitting(true)

    try {
      const { error: dbError } = await supabase.from("session_bookings").insert({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        topic: formData.topic,
        message: formData.message.trim(),
      })

      if (dbError) throw new Error(dbError.message)

      setSubmitSuccess(true)
      setFormData({ name: "", email: "", topic: TOPICS[0], message: "" })
      setTimeout(() => setSubmitSuccess(false), 6000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section
      ref={ref}
      className="flex min-h-[100dvh] w-full shrink-0 snap-start items-center px-5 py-24 md:w-screen md:px-12 md:py-0 lg:px-16"
    >
      <div className="mx-auto w-full max-w-7xl">
        <div className="grid gap-8 md:grid-cols-[1.1fr_1fr] md:gap-16 lg:gap-24">
          <div className="flex flex-col justify-center">
            <div
              className={`mb-6 transition-all duration-700 md:mb-10 ${
                isVisible ? "translate-x-0 opacity-100" : "-translate-x-12 opacity-0"
              }`}
            >
              <h2 className="mb-2 font-sans text-4xl font-light leading-[1.05] tracking-tight text-foreground md:mb-3 md:text-7xl lg:text-8xl">
                Book a
                <br />
                session
              </h2>
              <p className="font-mono text-xs text-foreground/60 md:text-base">
                / 1-on-1 mentoring &amp; BI coaching · after office hours
              </p>
            </div>

            <div className="space-y-4 md:space-y-6">
              <a
                href="mailto:rsinha1369@gmail.com"
                className={`group block transition-all duration-700 ${
                  isVisible ? "translate-x-0 opacity-100" : "-translate-x-16 opacity-0"
                }`}
                style={{ transitionDelay: "200ms" }}
              >
                <div className="mb-1 flex items-center gap-2">
                  <Mail className="h-3 w-3 text-foreground/60" />
                  <span className="font-mono text-xs text-foreground/60">Email</span>
                </div>
                <p className="text-base text-foreground transition-colors group-hover:text-foreground/70 md:text-2xl">
                  rsinha1369@gmail.com
                </p>
              </a>

              <div
                className={`transition-all duration-700 ${
                  isVisible ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"
                }`}
                style={{ transitionDelay: "350ms" }}
              >
                <div className="mb-1 flex items-center gap-2">
                  <MapPin className="h-3 w-3 text-foreground/60" />
                  <span className="font-mono text-xs text-foreground/60">Location</span>
                </div>
                <p className="text-base text-foreground md:text-2xl">Mumbai, India</p>
              </div>

              <div
                className={`flex gap-4 pt-1 transition-all duration-700 ${
                  isVisible ? "translate-x-0 opacity-100" : "-translate-x-8 opacity-0"
                }`}
                style={{ transitionDelay: "500ms" }}
              >
                <a
                  href="https://www.linkedin.com/in/rakshitsinha555/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 border-b border-transparent font-mono text-xs text-foreground/60 transition-all hover:border-foreground/60 hover:text-foreground/90"
                >
                  <Linkedin className="h-3 w-3" /> LinkedIn
                </a>
                <a
                  href="https://github.com/RakshitSinha18"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 border-b border-transparent font-mono text-xs text-foreground/60 transition-all hover:border-foreground/60 hover:text-foreground/90"
                >
                  <Github className="h-3 w-3" /> GitHub
                </a>
              </div>
            </div>
          </div>

          {/* Right side - Booking form */}
          <div className="flex flex-col justify-center">
            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
              <div
                className={`transition-all duration-700 ${
                  isVisible ? "translate-x-0 opacity-100" : "translate-x-16 opacity-0"
                }`}
                style={{ transitionDelay: "200ms" }}
              >
                <label className="mb-1 block font-mono text-xs text-foreground/60 md:mb-2">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full border-b border-foreground/30 bg-transparent py-1.5 text-sm text-foreground placeholder:text-foreground/40 focus:border-foreground/50 focus:outline-none md:py-2 md:text-base"
                  placeholder="Your name"
                />
              </div>

              <div
                className={`transition-all duration-700 ${
                  isVisible ? "translate-x-0 opacity-100" : "translate-x-16 opacity-0"
                }`}
                style={{ transitionDelay: "300ms" }}
              >
                <label className="mb-1 block font-mono text-xs text-foreground/60 md:mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full border-b border-foreground/30 bg-transparent py-1.5 text-sm text-foreground placeholder:text-foreground/40 focus:border-foreground/50 focus:outline-none md:py-2 md:text-base"
                  placeholder="your@email.com"
                />
              </div>

              <div
                className={`transition-all duration-700 ${
                  isVisible ? "translate-x-0 opacity-100" : "translate-x-16 opacity-0"
                }`}
                style={{ transitionDelay: "400ms" }}
              >
                <label className="mb-1 block font-mono text-xs text-foreground/60 md:mb-2">Topic</label>
                <select
                  value={formData.topic}
                  onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                  className="w-full border-b border-foreground/30 bg-transparent py-1.5 text-sm text-foreground focus:border-foreground/50 focus:outline-none md:py-2 md:text-base [&>option]:text-black"
                >
                  {TOPICS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div
                className={`transition-all duration-700 ${
                  isVisible ? "translate-x-0 opacity-100" : "translate-x-16 opacity-0"
                }`}
                style={{ transitionDelay: "500ms" }}
              >
                <label className="mb-1 block font-mono text-xs text-foreground/60 md:mb-2">What would you like help with?</label>
                <textarea
                  rows={2}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  required
                  className="w-full border-b border-foreground/30 bg-transparent py-1.5 text-sm text-foreground placeholder:text-foreground/40 focus:border-foreground/50 focus:outline-none md:py-2 md:text-base"
                  placeholder="Tell me your goals or preferred timing..."
                />
              </div>

              <div
                className={`transition-all duration-700 ${
                  isVisible ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"
                }`}
                style={{ transitionDelay: "600ms" }}
              >
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-full bg-foreground/95 px-8 py-3.5 text-base font-medium text-background backdrop-blur-md transition-all duration-300 hover:scale-[1.02] hover:bg-foreground active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? "Requesting..." : "Request Session"}
                </button>
                {submitSuccess && (
                  <p className="mt-3 text-center font-mono text-sm text-foreground/80">
                    Thanks! Your session request has been received — Rakshit will be in touch.
                  </p>
                )}
                {error && <p className="mt-3 text-center font-mono text-sm text-red-300/90">{error}</p>}
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}
