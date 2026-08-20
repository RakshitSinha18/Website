"use client"

import { useEffect, useState } from "react"
import { LegalPage } from "@/components/legal-page"
import { supabase } from "@/lib/supabase"

// Public class/session policy — reads the mentor-edited text from settings so it
// always matches what students see at booking. Falls back to a sensible default.
const FALLBACK = [
  "Attendance: please join on time; sessions start as scheduled.",
  "Reschedule: you may reschedule up to 24 hours before a session, from your portal.",
  "Cancellation & refunds: cancellations 24h+ before are eligible per the refund policy; no-shows are non-refundable.",
  "Payment: your seat is confirmed once payment is received.",
  "Materials & transcripts: shared in your portal after a session is confirmed.",
].join("\n")

export default function PolicyPage() {
  const [policy, setPolicy] = useState(FALLBACK)

  useEffect(() => {
    if (!supabase) return
    supabase
      .from("settings")
      .select("class_policy")
      .eq("id", 1)
      .single()
      .then(({ data }) => {
        if (data?.class_policy) setPolicy(data.class_policy)
      })
  }, [])

  const lines = policy.split("\n").map((l) => l.trim()).filter(Boolean)

  return (
    <LegalPage title="Class & Session Policy" updated="Kept current by Rakshit">
      <p className="text-foreground/70">
        These are the ground rules for booked classes and 1-on-1 sessions, so both you and
        Rakshit have a clear, shared understanding.
      </p>
      <ul className="mt-4 space-y-3">
        {lines.map((line, i) => {
          const [label, ...rest] = line.split(":")
          const hasLabel = rest.length > 0
          return (
            <li key={i} className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
              {hasLabel ? (
                <p className="text-sm text-foreground/80">
                  <span className="font-medium text-foreground">{label}:</span>
                  {rest.join(":")}
                </p>
              ) : (
                <p className="text-sm text-foreground/80">{line}</p>
              )}
            </li>
          )
        })}
      </ul>
      <p className="mt-6 text-xs text-foreground/50">
        Questions about the policy? Email{" "}
        <a href="mailto:rsinha1369@gmail.com" className="text-sky-300 hover:underline">rsinha1369@gmail.com</a>.
      </p>
    </LegalPage>
  )
}
