import type { Metadata } from "next"
import Link from "next/link"
import { PageBackdrop } from "@/components/ui/shell"

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
}

// Static export serves this as 404.html on GitHub Pages, so anyone landing on
// a dead link gets a way back instead of the default Next.js error screen.
export default function NotFound() {
  return (
    <main className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-5 text-center">
      <PageBackdrop />

      <div className="relative z-10 flex flex-col items-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/rs-logo.svg" alt="" aria-hidden className="mb-6 h-12 w-12 rounded-xl shadow-lg shadow-black/30" />

        <p className="mb-3 font-mono text-xs uppercase tracking-[0.25em] text-foreground/50">Error 404</p>
        <h1 className="mb-3 font-sans text-4xl font-light tracking-tight text-foreground md:text-5xl">
          This page doesn&apos;t exist
        </h1>
        <p className="mb-8 max-w-md text-sm leading-relaxed text-foreground/60 md:text-base">
          The link may be outdated or mistyped. Everything worth seeing is one click away.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl border border-white/40 bg-transparent px-5 py-2.5 text-sm font-semibold text-foreground transition-all duration-200 hover:-translate-y-0.5 hover:border-white hover:bg-white hover:text-[#0b0f19]"
          >
            Back to home
          </Link>
          <Link
            href="/articles/"
            className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-foreground transition-all duration-200 hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/[0.08]"
          >
            Read articles
          </Link>
          <Link
            href="/login/"
            className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-foreground transition-all duration-200 hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/[0.08]"
          >
            Student login
          </Link>
        </div>
      </div>
    </main>
  )
}
