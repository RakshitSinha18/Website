"use client"

import { Mail, MapPin, Linkedin, Github, ArrowRight } from "lucide-react"
import Link from "next/link"

/**
 * Contact section — no form (bookings happen in the portal). Just clear, always
 * visible contact info + social links, and a small footer.
 */
export function ContactSection() {
  return (
    <section className="flex min-h-[100dvh] w-full flex-col justify-between px-5 py-24 md:px-12 md:py-16 lg:px-16">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center">
        <div className="mb-8 md:mb-12">
          <h2 className="mb-2 font-sans text-4xl font-light leading-[1.05] tracking-tight text-foreground md:mb-3 md:text-7xl lg:text-8xl">
            Let&apos;s talk
          </h2>
          <p className="font-mono text-xs text-foreground/60 md:text-base">
            / 1-on-1 mentoring &amp; BI coaching · after office hours
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2">
          <a href="mailto:rsinha1369@gmail.com" className="group block">
            <div className="mb-1 flex items-center gap-2">
              <Mail className="h-3 w-3 text-foreground/60" />
              <span className="font-mono text-xs text-foreground/60">Email</span>
            </div>
            <p className="text-lg text-foreground transition-colors group-hover:text-sky-300 md:text-2xl">
              rsinha1369@gmail.com
            </p>
          </a>

          <div>
            <div className="mb-1 flex items-center gap-2">
              <MapPin className="h-3 w-3 text-foreground/60" />
              <span className="font-mono text-xs text-foreground/60">Location</span>
            </div>
            <p className="text-lg text-foreground md:text-2xl">Mumbai, India</p>
          </div>
        </div>

        {/* Always-visible social links */}
        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href="https://www.linkedin.com/in/rakshitsinha555/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-foreground/25 bg-foreground/5 px-4 py-2 text-sm text-foreground/90 backdrop-blur-md transition-all hover:-translate-y-0.5 hover:border-foreground/50 hover:bg-foreground/10"
          >
            <Linkedin className="h-4 w-4" /> LinkedIn
          </a>
          <a
            href="https://github.com/RakshitSinha18"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-foreground/25 bg-foreground/5 px-4 py-2 text-sm text-foreground/90 backdrop-blur-md transition-all hover:-translate-y-0.5 hover:border-foreground/50 hover:bg-foreground/10"
          >
            <Github className="h-4 w-4" /> GitHub
          </a>
          <Link
            href="/login/"
            className="inline-flex items-center gap-2 rounded-full bg-foreground/95 px-5 py-2 text-sm font-medium text-background transition-all hover:-translate-y-0.5 hover:bg-foreground"
          >
            Book a session <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Small, cute footer */}
      <footer className="mx-auto mt-10 flex w-full max-w-5xl flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-foreground/10 pt-6 text-center font-mono text-xs text-foreground/45">
        <span className="text-foreground/70">Rakshit Sinha</span>
        <span className="hidden sm:inline text-foreground/30">·</span>
        <a href="/terms/" className="transition-colors hover:text-foreground">Terms</a>
        <a href="/privacy/" className="transition-colors hover:text-foreground">Privacy</a>
        <a href="/refund/" className="transition-colors hover:text-foreground">Refunds</a>
        <a href="/policy/" className="transition-colors hover:text-foreground">Class policy</a>
        <span className="hidden sm:inline text-foreground/30">·</span>
        {/* Social icons */}
        <a
          href="https://github.com/RakshitSinha18"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub"
          className="inline-flex items-center transition-colors hover:text-foreground"
        >
          <Github className="h-3.5 w-3.5" />
        </a>
        <a
          href="https://www.linkedin.com/in/rakshitsinha555/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="LinkedIn"
          className="inline-flex items-center transition-colors hover:text-foreground"
        >
          <Linkedin className="h-3.5 w-3.5" />
        </a>
        <span className="hidden sm:inline text-foreground/30">·</span>
        <span>© {new Date().getFullYear()} · Built with care in Mumbai</span>
      </footer>
    </section>
  )
}
