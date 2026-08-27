"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { useReveal } from "@/hooks/use-reveal"
import { SectionKicker } from "@/components/section-kicker"

/**
 * FAQ section — the questions a prospective mentee actually asks before booking.
 * Plain, honest answers. Edit the FAQS array to change copy.
 */
const FAQS: { q: string; a: string }[] = [
  {
    q: "How do the sessions work?",
    a: "Sessions are 1-on-1 or small evening groups, held after office hours over a video call. Each course runs across a handful of sessions — you'll find the exact count on every course card. We work on real datasets end to end, so you finish with something you can actually show.",
  },
  {
    q: "Are classes online or in person?",
    a: "Primarily online, so we can work together no matter where you are. Screen-share, live query and dashboard building, and recordings on request. In-person can be arranged for learners in Mumbai — just ask.",
  },
  {
    q: "What does it cost?",
    a: "Every course shows a starting rate as \"From ₹X / session\". The final quote depends on the format (1-on-1 vs group), how many sessions you need, and your goals. 1-on-1 career coaching is priced per person. Message me and I'll give you a clear number for your case.",
  },
  {
    q: "Do I need prior experience?",
    a: "No. Most courses run Beginner → Advanced and start from the fundamentals. If you already work with data, we'll skip ahead and go deeper — the plan is tailored to where you actually are.",
  },
  {
    q: "How do I schedule and reschedule?",
    a: "Book a session from the portal after you sign in. You'll see available slots, confirm a time, and can reschedule from the same place if something comes up. You'll get email reminders, and a Google Meet link is added automatically.",
  },
  {
    q: "What's the refund policy?",
    a: "If plans change, refunds follow the terms on the Refund and Class Policy pages (linked in the footer). The short version: reach out early and I'll be fair about it.",
  },
  {
    q: "Which tools will I learn?",
    a: "Depends on the course — Tableau, Power BI, SQL / T-SQL, Advanced Excel, or Base SAS. Everything is taught the way it's used on real BI work: correct data models, performant queries, and dashboards a business will actually trust.",
  },
]

function FaqItem({
  faq,
  open,
  onToggle,
  index,
  active,
}: {
  faq: { q: string; a: string }
  open: boolean
  onToggle: () => void
  index: number
  active: boolean
}) {
  return (
    <div
      className={`overflow-hidden rounded-xl border transition-all duration-500 ${
        open ? "border-foreground/25 bg-[#0d1526]/70" : "border-white/10 bg-[#0d1526]/40 hover:border-foreground/25"
      } ${active ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}
      style={{ transitionDelay: active ? `${index * 60}ms` : "0ms" }}
    >
      <button
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left md:px-6 md:py-5"
      >
        <span className="font-sans text-base font-light text-foreground md:text-lg">{faq.q}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-foreground/50 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <div className="grid transition-all duration-500 ease-out" style={{ gridTemplateRows: open ? "1fr" : "0fr" }}>
        <div className="overflow-hidden">
          <p className="max-w-2xl px-4 pb-5 text-sm leading-relaxed text-foreground/75 md:px-6 md:text-base">
            {faq.a}
          </p>
        </div>
      </div>
    </div>
  )
}

export function FaqSection() {
  const { ref, isVisible } = useReveal(0.15)
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section
      ref={ref}
      className="flex min-h-[100dvh] w-full items-center px-5 py-24 md:px-12 lg:px-16"
    >
      <div className="mx-auto w-full max-w-3xl">
        <div
          className={`mb-8 transition-all duration-700 md:mb-12 ${
            isVisible ? "translate-y-0 opacity-100" : "-translate-y-12 opacity-0"
          }`}
        >
          <SectionKicker number="03" label="FAQ" />
          <h2 className="mb-2 font-sans text-5xl font-light tracking-tight text-foreground md:text-6xl lg:text-7xl">
            Questions
          </h2>
          <p className="font-mono text-sm text-foreground/60 md:text-base">
            / Everything you might ask before your first session
          </p>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <FaqItem
              key={faq.q}
              faq={faq}
              index={i}
              active={isVisible}
              open={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? null : i)}
            />
          ))}
        </div>

        <p
          className={`mt-8 font-mono text-sm text-foreground/60 transition-all duration-700 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
          }`}
          style={{ transitionDelay: "450ms" }}
        >
          Still unsure?{" "}
          <a
            href="mailto:rsinha1369@gmail.com?subject=Question%20about%20mentoring"
            className="text-foreground underline decoration-foreground/30 underline-offset-4 transition-colors hover:decoration-foreground"
          >
            Just email me
          </a>{" "}
          — I answer every message myself.
        </p>
      </div>
    </section>
  )
}
