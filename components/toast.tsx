"use client"

import { createContext, useCallback, useContext, useState, type ReactNode } from "react"
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react"

type ToastKind = "success" | "error" | "info"
interface Toast {
  id: number
  kind: ToastKind
  message: string
}

interface ToastCtx {
  toast: (message: string, kind?: ToastKind) => void
}

const Ctx = createContext<ToastCtx | null>(null)

export function useToast() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>")
  return ctx
}

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
}
const STYLES = {
  success: "border-emerald-400/30 bg-emerald-500/15 text-emerald-100",
  error: "border-red-400/30 bg-red-500/15 text-red-100",
  info: "border-sky-400/30 bg-sky-500/15 text-sky-100",
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((message: string, kind: ToastKind = "info") => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, kind, message }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 5000)
  }, [])

  const dismiss = (id: number) => setToasts((t) => t.filter((x) => x.id !== id))

  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      {/* Page-level toast stack (top-center, above everything) */}
      <div className="pointer-events-none fixed left-1/2 top-4 z-[200] flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 flex-col gap-2">
        {toasts.map((t) => {
          const Icon = ICONS[t.kind]
          return (
            <div
              key={t.id}
              // Errors are announced immediately; success/info wait politely.
              role={t.kind === "error" ? "alert" : "status"}
              aria-live={t.kind === "error" ? "assertive" : "polite"}
              className={`pointer-events-auto flex items-start gap-2.5 rounded-xl border px-4 py-3 shadow-2xl backdrop-blur-xl ${STYLES[t.kind]} animate-in fade-in slide-in-from-bottom-4 duration-300`}
            >
              <Icon className="mt-0.5 h-4 w-4 shrink-0" />
              <p className="flex-1 text-sm leading-snug">{t.message}</p>
              <button onClick={() => dismiss(t.id)} aria-label="Dismiss" className="shrink-0 opacity-70 hover:opacity-100">
                <X className="h-4 w-4" />
              </button>
            </div>
          )
        })}
      </div>
    </Ctx.Provider>
  )
}
