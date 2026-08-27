"use client"

import { Award, ArrowUpRight } from "lucide-react"
import { CERTIFICATIONS } from "@/lib/credentials"

/**
 * Certifications list for the About section. Renders nothing until real
 * entries exist in lib/credentials.ts — same auto-appear pattern as the
 * Download-CV button, so the live site never shows placeholder credentials.
 */
export function CertificationsCard({ className = "" }: { className?: string }) {
  if (CERTIFICATIONS.length === 0) return null

  return (
    <div
      className={`rounded-2xl border border-white/10 bg-[#0d1526]/60 p-4 backdrop-blur-md md:p-5 ${className}`}
    >
      <p className="mb-3 font-mono text-[10px] uppercase tracking-wider text-foreground/40">
        Certifications
      </p>
      <ul className="space-y-2.5">
        {CERTIFICATIONS.map((c) => {
          const inner = (
            <>
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-amber-300">
                <Award className="h-3.5 w-3.5" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm text-foreground/90">{c.name}</span>
                <span className="block font-mono text-[10px] text-foreground/50">
                  {c.issuer}
                  {c.year ? ` · ${c.year}` : ""}
                </span>
              </span>
              {c.url && <ArrowUpRight className="ml-auto h-3.5 w-3.5 shrink-0 text-foreground/40" />}
            </>
          )
          return (
            <li key={c.name}>
              {c.url ? (
                <a
                  href={c.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 transition-colors hover:border-white/25"
                >
                  {inner}
                </a>
              ) : (
                <span className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                  {inner}
                </span>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
