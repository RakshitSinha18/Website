"use client"

import { useEffect, useState } from "react"
import { Loader2, MessageSquareHeart, Star, Check, Clock } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/components/toast"
import { Card, CardTitle, Button, fieldClass, FieldLabel } from "@/components/ui/shell"

interface Testimonial {
  id: string
  author_name: string
  author_role: string
  body: string
  rating: number | null
  approved: boolean
}

/**
 * "Share your experience" — each student writes one testimonial (rating + text).
 * It stays private until Rakshit approves it; approved ones appear on the
 * homepage. Editing an approved testimonial sends it back for re-approval
 * (enforced server-side by the testimonials_guard trigger).
 */
export function TestimonialForm({ defaultName }: { defaultName?: string }) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [existing, setExisting] = useState<Testimonial | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [body, setBody] = useState("")
  const [name, setName] = useState("")
  const [role, setRole] = useState("")
  const [rating, setRating] = useState(0)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user || !supabase) return
    supabase
      .from("testimonials")
      .select("id,author_name,author_role,body,rating,approved")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setExisting(data as Testimonial)
          setBody(data.body)
          setName(data.author_name)
          setRole(data.author_role)
          setRating(data.rating ?? 0)
        } else {
          setName(defaultName || "")
        }
        setLoaded(true)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  // Keep the name field in sync if the profile loads after us.
  useEffect(() => {
    if (loaded && !existing && defaultName) setName((n) => n || defaultName)
  }, [defaultName, loaded, existing])

  const save = async () => {
    if (!supabase || !user) return
    if (!body.trim()) {
      toast("Write a line or two about your experience first.", "info")
      return
    }
    setSaving(true)
    const { error } = await supabase.from("testimonials").upsert(
      {
        user_id: user.id,
        author_name: name.trim() || (user.email ?? "").split("@")[0],
        author_role: role.trim(),
        body: body.trim(),
        rating: rating || null,
      },
      { onConflict: "user_id" },
    )
    setSaving(false)
    if (error) {
      toast(error.message, "error")
      return
    }
    toast(
      existing?.approved
        ? "Updated — it will reappear once Rakshit re-approves it."
        : "Thank you! Rakshit reviews it before it goes on the site.",
      "success",
    )
    setEditing(false)
    const { data } = await supabase
      .from("testimonials")
      .select("id,author_name,author_role,body,rating,approved")
      .eq("user_id", user.id)
      .maybeSingle()
    if (data) setExisting(data as Testimonial)
  }

  if (!loaded) return null

  // Read-only summary once submitted (with an Edit button).
  if (existing && !editing) {
    return (
      <Card className="mt-6">
        <CardTitle
          icon={<MessageSquareHeart className="h-4 w-4" />}
          title="Your testimonial"
          hint="What you shared about learning with Rakshit."
        />
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <Stars value={existing.rating ?? 0} />
            {existing.approved ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 font-mono text-[10px] text-emerald-200">
                <Check className="h-3 w-3" /> live on the site
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2.5 py-0.5 font-mono text-[10px] text-amber-200">
                <Clock className="h-3 w-3" /> awaiting approval
              </span>
            )}
          </div>
          <p className="text-sm leading-relaxed text-foreground/80">&ldquo;{existing.body}&rdquo;</p>
          <p className="mt-1.5 font-mono text-[11px] text-foreground/45">
            — {existing.author_name}
            {existing.author_role ? `, ${existing.author_role}` : ""}
          </p>
        </div>
        <Button variant="secondary" onClick={() => setEditing(true)} className="mt-3">
          Edit testimonial
        </Button>
      </Card>
    )
  }

  return (
    <Card className="mt-6">
      <CardTitle
        icon={<MessageSquareHeart className="h-4 w-4" />}
        title={existing ? "Edit your testimonial" : "Share your experience"}
        hint="A line or two helps other learners decide. Rakshit approves it before it appears on the homepage."
      />
      <FieldLabel>Rating</FieldLabel>
      <div className="mb-4 flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n === rating ? 0 : n)}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            aria-pressed={rating >= n}
            className="p-0.5 transition-transform hover:scale-110"
          >
            <Star
              className={`h-5 w-5 ${rating >= n ? "fill-amber-300 text-amber-300" : "text-foreground/30"}`}
            />
          </button>
        ))}
        {rating > 0 && <span className="ml-2 font-mono text-[11px] text-foreground/50">{rating}/5</span>}
      </div>

      <FieldLabel htmlFor="testimonial-body">Your experience</FieldLabel>
      <textarea
        id="testimonial-body"
        rows={3}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="What did you learn? What changed for you?"
        className={`${fieldClass} mb-4`}
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <div>
          <FieldLabel htmlFor="testimonial-name">Display name</FieldLabel>
          <input
            id="testimonial-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="How to credit you"
            className={fieldClass}
          />
        </div>
        <div>
          <FieldLabel htmlFor="testimonial-role">Role (optional)</FieldLabel>
          <input
            id="testimonial-role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="e.g. Data Analyst"
            className={fieldClass}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={save} disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {saving ? "Sending…" : existing ? "Save changes" : "Submit for review"}
        </Button>
        {existing && (
          <Button variant="secondary" onClick={() => setEditing(false)}>
            Cancel
          </Button>
        )}
      </div>
    </Card>
  )
}

export function Stars({ value }: { value: number }) {
  if (!value) return <span />
  return (
    <span className="flex items-center gap-0.5" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`h-3.5 w-3.5 ${value >= n ? "fill-amber-300 text-amber-300" : "text-foreground/25"}`}
        />
      ))}
    </span>
  )
}
