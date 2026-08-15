import Link from "next/link"
import { ArrowLeft, ShieldAlert } from "lucide-react"
import { PageBackdrop } from "@/components/ui/shell"

/** Shared shell for the Terms / Privacy / Refund pages. */
export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string
  updated: string
  children: React.ReactNode
}) {
  return (
    <main className="relative min-h-[100dvh] text-foreground">
      <PageBackdrop />
      <div className="relative z-10 mx-auto max-w-3xl px-5 py-12 md:py-16">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-foreground/60 transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to site
        </Link>

        <h1 className="mt-6 text-3xl font-medium tracking-tight md:text-4xl">{title}</h1>
        <p className="mt-1.5 font-mono text-xs text-foreground/45">Last updated: {updated}</p>

        {/* Honest, visible caveat — these are templates, not legal advice. */}
        <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-amber-400/25 bg-amber-500/10 px-4 py-3 text-xs text-amber-100">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            This is a template provided for convenience and is <strong>not legal advice</strong>.
            Please have it reviewed by a qualified lawyer before relying on it — especially for
            payments, refunds and data-protection obligations.
          </p>
        </div>

        <div className="legal-body mt-8 space-y-6 text-sm leading-relaxed text-foreground/80">
          {children}
        </div>

        <div className="mt-12 flex flex-wrap gap-4 border-t border-white/10 pt-6 font-mono text-xs text-foreground/50">
          <Link href="/terms/" className="hover:text-foreground">Terms</Link>
          <Link href="/privacy/" className="hover:text-foreground">Privacy</Link>
          <Link href="/refund/" className="hover:text-foreground">Refund policy</Link>
          <span className="ml-auto">© Rakshit Sinha · sinharakshit.com</span>
        </div>
      </div>
    </main>
  )
}

/** Section heading used inside legal pages. */
export function LegalSection({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 text-base font-medium text-foreground">
        {n}. {title}
      </h2>
      <div className="space-y-2 text-foreground/70">{children}</div>
    </section>
  )
}
