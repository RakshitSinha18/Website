"use client"

import { useEffect, useState } from "react"
import { MessageSquare, Send, Trash2, Star } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/use-auth"
import { isAdminEmail } from "@/lib/config"

interface Comment {
  id: string
  user_id: string
  author_name: string
  body: string
  rating: number | null
  created_at: string
}

/**
 * Reusable comment/feedback thread. Attaches to any target via (targetType, targetId).
 * Anyone can read; signed-in users can post; authors & the mentor can delete.
 * Set `withRating` to show a 1–5 star selector (for class/batch feedback).
 */
export function CommentThread({
  targetType,
  targetId,
  withRating = false,
  title = "Comments & feedback",
}: {
  targetType: "article" | "batch" | "idea"
  targetId: string
  withRating?: boolean
  title?: string
}) {
  const { user } = useAuth()
  const [comments, setComments] = useState<Comment[]>([])
  const [body, setBody] = useState("")
  const [rating, setRating] = useState(0)
  const [busy, setBusy] = useState(false)
  const isAdmin = isAdminEmail(user?.email)

  const load = async () => {
    if (!supabase) return
    const { data } = await supabase
      .from("comments")
      .select("id,user_id,author_name,body,rating,created_at")
      .eq("target_type", targetType)
      .eq("target_id", targetId)
      .order("created_at", { ascending: true })
    setComments((data as Comment[]) || [])
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetType, targetId])

  const post = async () => {
    if (!supabase || !user) return
    if (!body.trim()) return
    setBusy(true)
    const { error } = await supabase.from("comments").insert({
      user_id: user.id,
      author_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Student",
      target_type: targetType,
      target_id: targetId,
      body: body.trim(),
      rating: withRating && rating ? rating : null,
    })
    setBusy(false)
    if (!error) {
      setBody("")
      setRating(0)
      load()
    }
  }

  const remove = async (id: string) => {
    if (!supabase) return
    await supabase.from("comments").delete().eq("id", id)
    load()
  }

  return (
    <div>
      <h3 className="mb-4 flex items-center gap-2 text-base font-medium text-foreground">
        <MessageSquare className="h-4 w-4 text-sky-400" /> {title}
        <span className="rounded-full bg-white/10 px-2 py-0.5 font-mono text-[10px] text-foreground/70">{comments.length}</span>
      </h3>

      <ul className="mb-5 space-y-3">
        {comments.length === 0 && (
          <li className="rounded-xl border border-dashed border-white/15 px-4 py-6 text-center text-xs text-foreground/50">
            No comments yet — be the first.
          </li>
        )}
        {comments.map((c) => (
          <li key={c.id} className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-foreground">{c.author_name || "Student"}</span>
              <span className="flex items-center gap-2">
                {c.rating ? (
                  <span className="flex items-center gap-0.5 font-mono text-[10px] text-amber-300">
                    {c.rating}<Star className="h-3 w-3 fill-amber-300" />
                  </span>
                ) : null}
                <span className="font-mono text-[10px] text-foreground/40">
                  {new Date(c.created_at).toLocaleDateString([], { month: "short", day: "numeric" })}
                </span>
                {(isAdmin || c.user_id === user?.id) && (
                  <button onClick={() => remove(c.id)} aria-label="Delete comment" className="text-foreground/40 hover:text-red-300">
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-foreground/75">{c.body}</p>
          </li>
        ))}
      </ul>

      {user ? (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
          {withRating && (
            <div className="mb-2 flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => setRating(n)} aria-label={`${n} stars`}>
                  <Star className={`h-4 w-4 ${n <= rating ? "fill-amber-300 text-amber-300" : "text-foreground/30"}`} />
                </button>
              ))}
            </div>
          )}
          <textarea
            rows={2}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Share a comment or feedback…"
            className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-foreground placeholder:text-foreground/35 focus:border-white/25 focus:outline-none"
          />
          <button
            onClick={post}
            disabled={busy || !body.trim()}
            className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-sky-500 px-3 py-1.5 font-mono text-[11px] font-medium text-white transition-colors hover:bg-sky-400 disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" /> {busy ? "Posting…" : "Post"}
          </button>
        </div>
      ) : (
        <p className="text-xs text-foreground/50">
          <a href="/login/" className="text-sky-300 hover:underline">Sign in</a> to comment.
        </p>
      )}
    </div>
  )
}
