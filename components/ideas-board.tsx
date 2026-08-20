"use client"

import { useEffect, useState } from "react"
import { Lightbulb, Send, Trash2, ChevronDown } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/use-auth"
import { isAdminEmail } from "@/lib/config"
import { CommentThread } from "@/components/comment-thread"

interface Idea {
  id: string
  user_id: string
  author_name: string
  title: string
  body: string
  status: string
  created_at: string
}

/** Ideas & open discussion — logged-in students post topics; anyone signed in replies. */
export function IdeasBoard() {
  const { user } = useAuth()
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [busy, setBusy] = useState(false)
  const [openId, setOpenId] = useState<string | null>(null)
  const isAdmin = isAdminEmail(user?.email)

  const load = async () => {
    if (!supabase) return
    const { data } = await supabase.from("ideas").select("*").order("created_at", { ascending: false })
    setIdeas((data as Idea[]) || [])
  }
  useEffect(() => { load() }, [])

  const post = async () => {
    if (!supabase || !user || !title.trim()) return
    setBusy(true)
    const { error } = await supabase.from("ideas").insert({
      user_id: user.id,
      author_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Student",
      title: title.trim(),
      body: body.trim(),
    })
    setBusy(false)
    if (!error) { setTitle(""); setBody(""); load() }
  }
  const remove = async (id: string) => {
    if (!supabase) return
    await supabase.from("ideas").delete().eq("id", id)
    load()
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <Lightbulb className="h-4 w-4 text-amber-300" />
        <h2 className="text-base font-medium text-foreground">Ideas &amp; open discussion</h2>
      </div>
      <p className="mb-5 text-xs text-foreground/55">
        Share a topic, question or idea for the community. Rakshit and other students can reply.
      </p>

      {/* New idea */}
      {user && (
        <div className="mb-6 rounded-xl border border-white/10 bg-white/[0.02] p-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Idea or topic title…"
            className="mb-2 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-foreground placeholder:text-foreground/35 focus:border-white/25 focus:outline-none"
          />
          <textarea
            rows={2}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Add a bit more detail (optional)…"
            className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-foreground placeholder:text-foreground/35 focus:border-white/25 focus:outline-none"
          />
          <button
            onClick={post}
            disabled={busy || !title.trim()}
            className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-amber-400 px-3 py-1.5 font-mono text-[11px] font-medium text-black transition-colors hover:bg-amber-300 disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" /> {busy ? "Posting…" : "Post idea"}
          </button>
        </div>
      )}

      <ul className="space-y-3">
        {ideas.length === 0 && (
          <li className="rounded-xl border border-dashed border-white/15 px-4 py-8 text-center text-sm text-foreground/50">
            No ideas yet — start the conversation.
          </li>
        )}
        {ideas.map((idea) => (
          <li key={idea.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="text-sm font-medium text-foreground">{idea.title}</h3>
                <p className="font-mono text-[10px] text-foreground/45">
                  {idea.author_name} · {new Date(idea.created_at).toLocaleDateString([], { month: "short", day: "numeric" })}
                </p>
              </div>
              {(isAdmin || idea.user_id === user?.id) && (
                <button onClick={() => remove(idea.id)} aria-label="Delete idea" className="text-foreground/40 hover:text-red-300">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            {idea.body && <p className="mt-1.5 text-sm leading-relaxed text-foreground/70">{idea.body}</p>}
            <button
              onClick={() => setOpenId(openId === idea.id ? null : idea.id)}
              className="mt-2 inline-flex items-center gap-1 font-mono text-[11px] text-sky-300 hover:underline"
            >
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${openId === idea.id ? "rotate-180" : ""}`} />
              {openId === idea.id ? "Hide replies" : "Reply / discuss"}
            </button>
            {openId === idea.id && (
              <div className="mt-3 border-t border-white/10 pt-3">
                <CommentThread targetType="idea" targetId={idea.id} title="Replies" />
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
