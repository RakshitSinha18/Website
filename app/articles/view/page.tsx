"use client"

import { useEffect, useState, Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { PageBackdrop } from "@/components/ui/shell"
import { supabase } from "@/lib/supabase"
import { CommentThread } from "@/components/comment-thread"
import { STARTER_ARTICLES } from "@/lib/starter-articles"

interface Article {
  id: string
  slug: string
  title: string
  body: string
  cover_url?: string | null
  created_at: string
  starter?: boolean
}

function findStarter(slug: string): Article | null {
  const a = STARTER_ARTICLES.find((s) => s.slug === slug)
  if (!a) return null
  return { id: `starter-${a.slug}`, slug: a.slug, title: a.title, body: a.body, created_at: a.created_at, starter: true }
}

function ArticleView() {
  const params = useSearchParams()
  const slug = params.get("slug") || ""
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slug) { setLoading(false); return }
    // Built-in concept articles resolve instantly, no DB round-trip.
    const starter = findStarter(slug)
    if (starter) { setArticle(starter); setLoading(false); return }
    if (!supabase) { setLoading(false); return }
    supabase
      .from("articles")
      .select("id,slug,title,body,cover_url,created_at")
      .eq("slug", slug)
      .eq("published", true)
      .single()
      .then(({ data }) => {
        setArticle(data as Article)
        setLoading(false)
      })
  }, [slug])

  return (
    <main className="relative min-h-[100dvh] text-foreground">
      <PageBackdrop />
      <div className="relative z-10 mx-auto max-w-3xl px-5 py-12 md:py-16">
        <Link href="/articles/" className="inline-flex items-center gap-1.5 text-sm text-foreground/60 transition-colors hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> All articles
        </Link>

        {loading && <p className="mt-8 text-sm text-foreground/50">Loading…</p>}
        {!loading && !article && (
          <p className="mt-8 text-sm text-foreground/50">Article not found.</p>
        )}
        {article && (
          <>
            <h1 className="mt-6 text-3xl font-medium tracking-tight md:text-4xl">{article.title}</h1>
            <p className="mt-1.5 font-mono text-xs text-foreground/45">
              {new Date(article.created_at).toLocaleDateString([], { year: "numeric", month: "long", day: "numeric" })}
            </p>
            {/* Body — plain text with paragraph breaks preserved. */}
            <div className="mt-8 space-y-4 text-sm leading-relaxed text-foreground/80">
              {article.body.split("\n").filter(Boolean).map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>

            {/* Discussion — only for real (DB) articles; starters have no row. */}
            {!article.starter && (
              <div className="mt-12 border-t border-white/10 pt-8">
                <CommentThread targetType="article" targetId={article.id} />
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}

export default function ArticleViewPage() {
  return (
    <Suspense fallback={<main className="min-h-[100dvh]" />}>
      <ArticleView />
    </Suspense>
  )
}
