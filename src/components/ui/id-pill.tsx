"use client"

import * as React from "react"
import { Check, Copy } from "lucide-react"
import { gooeyToast } from "goey-toast"
import { cn } from "@/lib/utils"

/**
 * Single-line ID badge with a copy button over its right end. When the ID doesn't fit,
 * the text fades out under the button instead of wrapping (full ID stays in the tooltip).
 */
export function IdPill({ id, label = "tracking ID", className }: { id: string; label?: string; className?: string }) {
  const textRef = React.useRef<HTMLSpanElement>(null)
  const [overflowing, setOverflowing] = React.useState(false)
  const [copied, setCopied] = React.useState(false)

  React.useEffect(() => {
    const el = textRef.current
    if (!el) return
    const measure = () => setOverflowing(el.scrollWidth > el.clientWidth + 1)
    measure()
    if (typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [id])

  const copy = async (event: React.MouseEvent) => {
    event.stopPropagation()
    try {
      await navigator.clipboard.writeText(id)
      setCopied(true)
      gooeyToast.success(`${label.charAt(0).toUpperCase()}${label.slice(1)} copied.`)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      gooeyToast.error(`Unable to copy ${label}.`)
    }
  }

  return (
    <span
      title={id}
      className={cn(
        "relative inline-flex min-w-0 max-w-full items-center rounded-full border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/60",
        className
      )}
    >
      <span
        ref={textRef}
        className={cn(
          "block min-w-0 overflow-hidden whitespace-nowrap py-0.5 pl-2 pr-7 font-mono text-xs font-bold text-blue-600 dark:text-blue-300",
          // Fade the tail out before it reaches the copy button.
          overflowing && "[mask-image:linear-gradient(to_right,#000_calc(100%-3.25rem),transparent_calc(100%-1.75rem))]"
        )}
      >
        {id}
      </span>
      <button
        type="button"
        onClick={copy}
        title={`Copy ${label}`}
        aria-label={`Copy ${label} ${id}`}
        className="absolute right-0.5 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-blue-600 transition-colors hover:bg-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 dark:text-blue-300 dark:hover:bg-blue-900"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
      </button>
    </span>
  )
}
