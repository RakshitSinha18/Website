"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, FileText } from "lucide-react"
import { PageBackdrop } from "@/components/ui/shell"
import { supabase } from "@/lib/supabase"
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal"

interface Article {
  id: string
  slug: string
  title: string
  excerpt: string
  cover_url?: string | null
  created_at: string
}

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) { setLoading(false); return }
    supabase
      .from("articles")
      .select("id,slug,title,excerpt,cover_url,created_at")
      .eq("published", true)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setArticles((data as Article[]) || [])
        setLoading(false)
      })
  }, [])

  return (
    <main className="relative min-h-[100dvh] text-foreground">
      <PageBackdrop />
      <div className="relative z-10 mx-auto max-w-3xl px-5 py-12 md:py-16">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-foreground/60 transition-colors hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to site
        </Link>
        <Reveal>
          <h1 className="mt-6 text-3xl font-medium tracking-tight md:text-4xl">Articles</h1>
          <p className="mt-1.5 text-sm text-foreground/60">
            Notes on business intelligence, dashboards and breaking into data — by Rakshit Sinha.
          </p>
        </Reveal>

        <div className="mt-8 space-y-3">
          {loading && <p className="text-sm text-foreground/50">Loading…</p>}
          {!loading && articles.length === 0 && (
            <div className="rounded-xl border border-dashed border-white/15 px-4 py-10 text-center text-sm text-foreground/50">
              No articles published yet — check back soon.
            </div>
          )}
          <RevealGroup className="space-y-3">
            {articles.map((a) => (
              <RevealItem key={a.id}>
                <Link
                  href={`/articles/view/?slug=${encodeURIComponent(a.slug)}`}
                  className="block rounded-xl border border-white/10 bg-white/[0.03] p-5 transition-all hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/[0.05]"
                >
                  <div className="mb-1 flex items-center gap-2 font-mono text-[11px] text-foreground/45">
                    <FileText className="h-3.5 w-3.5" />
                    {new Date(a.created_at).toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" })}
                  </div>
                  <h2 className="text-lg font-medium text-foreground">{a.title}</h2>
                  {a.excerpt && <p className="mt-1 text-sm leading-relaxed text-foreground/65">{a.excerpt}</p>}
                  <span className="mt-2 inline-block font-mono text-[11px] text-sky-300">Read →</span>
                </Link>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </div>
    </main>
  )
}
