"use client"

import { Github, Linkedin } from "lucide-react"

/**
 * Site footer — the very last thing on the page. Lives on its own (not inside
 * Contact) so section order can change without stranding the footer mid-page.
 */
export function SiteFooter() {
  return (
    <footer className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-foreground/10 px-5 py-8 text-center font-mono text-xs text-foreground/45 md:px-12">
      <span className="text-foreground/70">Rakshit Sinha</span>
      <span className="hidden sm:inline text-foreground/30">·</span>
      <a href="/articles/" className="transition-colors hover:text-foreground">Articles</a>
      <a href="/terms/" className="transition-colors hover:text-foreground">Terms</a>
      <a href="/privacy/" className="transition-colors hover:text-foreground">Privacy</a>
      <a href="/refund/" className="transition-colors hover:text-foreground">Refunds</a>
      <a href="/policy/" className="transition-colors hover:text-foreground">Class policy</a>
      <span className="hidden sm:inline text-foreground/30">·</span>
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
  )
}
