"use client"

import { Mail, MapPin, Linkedin, Github, ArrowRight } from "lucide-react"
import Link from "next/link"
import { SectionKicker } from "@/components/section-kicker"

/**
 * Contact section — no form (bookings happen in the portal). Just clear, always
 * visible contact info + social links. The footer lives separately (SiteFooter).
 */
export function ContactSection() {
  return (
    <section className="flex min-h-[100dvh] w-full flex-col justify-center px-5 py-24 md:px-12 md:py-16 lg:px-16">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center">
        <div className="mb-8 md:mb-12">
          <SectionKicker number="04" label="Contact" />
          <h2 className="mb-2 font-sans text-4xl font-light leading-[1.05] tracking-tight text-foreground md:mb-3 md:text-7xl lg:text-8xl">
            Say hello
          </h2>
          <p className="font-mono text-xs text-foreground/60 md:text-base">
            / Whether it&apos;s a question, an idea, or just to talk data — I&apos;d love to hear from you
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
            Let&apos;s connect <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
