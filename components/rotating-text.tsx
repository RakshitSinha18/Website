"use client"

import { useEffect, useState } from "react"

/**
 * Cycles through a list of words with a fade/slide transition.
 * Purely decorative — respects prefers-reduced-motion by showing the first word.
 */
export function RotatingText({ words, className = "" }: { words: string[]; className?: string }) {
  const [index, setIndex] = useState(0)
  const [animating, setAnimating] = useState(false)

  useEffect(() => {
    const reduced =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduced || words.length <= 1) return

    const id = setInterval(() => {
      setAnimating(true)
      setTimeout(() => {
        setIndex((i) => (i + 1) % words.length)
        setAnimating(false)
      }, 350)
    }, 2600)
    return () => clearInterval(id)
  }, [words])

  return (
    <span
      className={`inline-block transition-all duration-300 ${
        animating ? "-translate-y-1 opacity-0" : "translate-y-0 opacity-100"
      } ${className}`}
    >
      {words[index]}
    </span>
  )
}
