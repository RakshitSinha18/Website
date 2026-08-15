"use client"

import type { ReactNode } from "react"

/**
 * Shared visual language for the auth + dashboard pages.
 *
 * The look reflects who Rakshit Sinha is — a Senior Business Intelligence
 * consultant: clean, precise, analytical. Calm dark surface, a single quiet
 * radial wash (no busy animation), crisp cards, real icons, generous spacing.
 */

/** Full-page calm backdrop. Use once at the root of a page. */
export function PageBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
      <div className="absolute inset-0 bg-[#0b0f19]" />
      <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(56,120,220,0.14),transparent_70%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(40%_40%_at_85%_95%,rgba(255,160,70,0.07),transparent_70%)]" />
      {/* Faint analytical grid — a subtle BI motif. */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
    </div>
  )
}

/** A surface card with consistent border/padding. */
export function Card({
  children,
  className = "",
  as: Tag = "section",
}: {
  children: ReactNode
  className?: string
  as?: "section" | "div"
}) {
  return (
    <Tag
      className={`rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm md:p-6 ${className}`}
    >
      {children}
    </Tag>
  )
}

/** Card heading with an icon + optional description. */
export function CardTitle({
  icon,
  title,
  hint,
}: {
  icon?: ReactNode
  title: string
  hint?: string
}) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2.5">
        {icon && (
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-sky-400">
            {icon}
          </span>
        )}
        <h2 className="text-base font-medium tracking-tight text-foreground">{title}</h2>
      </div>
      {hint && <p className="mt-2 text-xs text-foreground/50">{hint}</p>}
    </div>
  )
}

type ButtonVariant = "primary" | "secondary" | "ghost"

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-white text-[#0b0f19] hover:bg-white/90",
  secondary: "border border-white/15 bg-white/[0.04] text-foreground hover:bg-white/[0.08]",
  ghost: "text-foreground/60 hover:text-foreground",
}

/** Consistent button. */
export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: {
  children: ReactNode
  variant?: ButtonVariant
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all disabled:opacity-60 ${BUTTON_VARIANTS[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

/** Shared input styling class — apply to <input>, <select>, <textarea>. */
export const fieldClass =
  "w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-foreground placeholder:text-foreground/35 transition-colors focus:border-white/25 focus:bg-white/[0.05] focus:outline-none [&>option]:text-black"

/** Small mono label above a field. */
export function FieldLabel({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-medium text-foreground/70">
      {children}
    </label>
  )
}
