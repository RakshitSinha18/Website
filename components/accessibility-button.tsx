"use client"

import { useEffect, useState } from "react"
import { Accessibility, X, Type, Contrast, Zap, RotateCcw } from "lucide-react"

/**
 * Floating accessibility widget available on every page.
 *
 * Provides practical, real controls — larger text, high contrast, and reduced
 * motion — persisted to localStorage and applied via classes on <html>.
 * Keyboard operable and screen-reader labelled (WCAG 2.2).
 */

type Prefs = { largeText: boolean; highContrast: boolean; reduceMotion: boolean }
const DEFAULTS: Prefs = { largeText: false, highContrast: false, reduceMotion: false }
const KEY = "a11y-prefs"

function apply(p: Prefs) {
  const el = document.documentElement
  el.classList.toggle("a11y-large-text", p.largeText)
  el.classList.toggle("a11y-high-contrast", p.highContrast)
  el.classList.toggle("reduce-motion", p.reduceMotion)
}

export function AccessibilityButton() {
  const [open, setOpen] = useState(false)
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS)

  // Load + apply saved prefs on mount.
  useEffect(() => {
    try {
      const saved = { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || "{}") }
      setPrefs(saved)
      apply(saved)
    } catch {
      /* ignore */
    }
  }, [])

  const set = (patch: Partial<Prefs>) => {
    const next = { ...prefs, ...patch }
    setPrefs(next)
    apply(next)
    localStorage.setItem(KEY, JSON.stringify(next))
  }

  const reset = () => {
    setPrefs(DEFAULTS)
    apply(DEFAULTS)
    localStorage.setItem(KEY, JSON.stringify(DEFAULTS))
  }

  const options: { key: keyof Prefs; label: string; icon: typeof Type }[] = [
    { key: "largeText", label: "Larger text", icon: Type },
    { key: "highContrast", label: "High contrast", icon: Contrast },
    { key: "reduceMotion", label: "Reduce motion", icon: Zap },
  ]

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Accessibility options"
        className="fixed bottom-5 left-5 z-[120] flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-[#0b0f19]/90 text-sky-300 shadow-2xl backdrop-blur-xl transition-transform hover:scale-105 focus-visible:scale-105"
      >
        <Accessibility className="h-5 w-5" />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Accessibility options"
          className="fixed bottom-20 left-5 z-[120] w-64 rounded-2xl border border-white/12 bg-[#0b0f19]/95 p-4 shadow-2xl backdrop-blur-2xl"
        >
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">Accessibility</p>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close accessibility options"
              className="text-foreground/50 transition-colors hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-1.5">
            {options.map(({ key, label, icon: Icon }) => {
              const active = prefs[key]
              return (
                <button
                  key={key}
                  onClick={() => set({ [key]: !active } as Partial<Prefs>)}
                  role="switch"
                  aria-checked={active}
                  className={`flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-sm transition-colors ${
                    active
                      ? "border-sky-400/40 bg-sky-400/10 text-foreground"
                      : "border-white/10 bg-white/[0.03] text-foreground/70 hover:text-foreground"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Icon className="h-4 w-4" /> {label}
                  </span>
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded-full border text-[10px] ${
                      active ? "border-sky-400 bg-sky-400 text-black" : "border-white/30"
                    }`}
                  >
                    {active ? "✓" : ""}
                  </span>
                </button>
              )
            })}
          </div>

          <button
            onClick={reset}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 font-mono text-[11px] text-foreground/60 transition-colors hover:text-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset to defaults
          </button>
        </div>
      )}
    </>
  )
}
