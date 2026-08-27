"use client"

import { useEffect, useState } from "react"
import { Quote } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { Stars } from "@/components/testimonial-form"

interface PublicTestimonial {
  id: string
  author_name: string
  author_role: string
  body: string
  rating: number | null
}

/**
 * Approved student testimonials on the homepage. Every quote here was written
 * by a real student in the portal and approved by Rakshit — the component
 * renders nothing at all until at least one exists, so there's never
 * placeholder social proof on the live site.
 */
export function TestimonialsRail({ className = "" }: { className?: string }) {
  const [items, setItems] = useState<PublicTestimonial[]>([])

  useEffect(() => {
    if (!supabase) return
    supabase
      .from("testimonials")
      .select("id,author_name,author_role,body,rating")
      .eq("approved", true)
      .order("created_at", { ascending: false })
      .limit(6)
      .then(({ data }) => {
        if (data) setItems(data as PublicTestimonial[])
      })
  }, [])

  if (items.length === 0) return null

  return (
    <div className={className}>
      <p className="mb-3 font-mono text-[11px] uppercase tracking-wider text-foreground/40">
        What students say
      </p>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {items.map((t) => (
          <figure
            key={t.id}
            className="rounded-2xl border border-white/10 bg-[#0d1526]/60 p-4 backdrop-blur-md transition-colors hover:border-foreground/25"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <Quote className="h-4 w-4 text-sky-300/70" />
              <Stars value={t.rating ?? 0} />
            </div>
            <blockquote className="text-sm leading-relaxed text-foreground/80">
              &ldquo;{t.body}&rdquo;
            </blockquote>
            <figcaption className="mt-2.5 font-mono text-[11px] text-foreground/50">
              — {t.author_name}
              {t.author_role ? `, ${t.author_role}` : ""}
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  )
}
