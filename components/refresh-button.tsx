"use client"

import { useState } from "react"
import { RefreshCw } from "lucide-react"

/**
 * Clears browser caches + service workers and hard-reloads, so visitors always
 * see the latest deploy instead of a stale cached bundle. Handy on GitHub Pages
 * where old JS/HTML can linger in the browser cache after a new build.
 */
export function RefreshButton() {
  const [busy, setBusy] = useState(false)

  const hardRefresh = async () => {
    setBusy(true)
    try {
      // Clear Cache Storage (PWA / fetch caches).
      if ("caches" in window) {
        const keys = await caches.keys()
        await Promise.all(keys.map((k) => caches.delete(k)))
      }
      // Unregister any service workers.
      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations()
        await Promise.all(regs.map((r) => r.unregister()))
      }
    } catch {
      /* best-effort — still reload below */
    }
    // Cache-busting reload.
    const url = new URL(window.location.href)
    url.searchParams.set("_", Date.now().toString())
    window.location.replace(url.toString())
  }

  return (
    <button
      onClick={hardRefresh}
      disabled={busy}
      aria-label="Clear cache and reload the latest version"
      title="Get the latest version"
      className="fixed bottom-5 right-5 z-[120] flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-[#0b0f19]/90 text-sky-300 shadow-2xl backdrop-blur-xl transition-transform hover:scale-105 focus-visible:scale-105 disabled:opacity-60"
    >
      <RefreshCw className={`h-5 w-5 ${busy ? "animate-spin" : ""}`} />
    </button>
  )
}
