"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Keeps a page's TabsList pinned to the top while its list scrolls. The band spans the
 * container's px-4 gutter and gets a hairline + shadow only once it is actually stuck.
 * Pass the page background as `className` (e.g. "bg-slate-50/95 dark:bg-slate-950/95").
 */
export function StickyTabsBar({ className, children }: { className?: string; children: React.ReactNode }) {
  const sentinelRef = React.useRef<HTMLDivElement>(null)
  const [stuck, setStuck] = React.useState(false)

  React.useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || typeof IntersectionObserver === "undefined") return
    const observer = new IntersectionObserver(([entry]) => setStuck(!entry.isIntersecting))
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [])

  return (
    <>
      <div ref={sentinelRef} data-sticky-tabs-anchor aria-hidden="true" />
      <div
        data-stuck={stuck || undefined}
        className={cn(
          "sticky top-0 z-30 -mx-4 mb-4 px-4 py-2 backdrop-blur-md transition-shadow",
          "data-[stuck]:shadow-[0_1px_0_rgba(15,23,42,0.08),0_6px_12px_-8px_rgba(15,23,42,0.25)]",
          className
        )}
      >
        {children}
      </div>
    </>
  )
}

/**
 * After switching tab or page while scrolled down, bring the list back to its start
 * with the tabs still on screen (instead of jumping to the page header).
 * Instant on purpose: the list swaps to a shorter skeleton right after, which cancels a
 * smooth scroll mid-way ("instant" also overrides the html scroll-smooth class).
 */
export function scrollToStickyTabs() {
  const anchor = document.querySelector<HTMLElement>("[data-sticky-tabs-anchor]")
  if (!anchor) return
  const top = anchor.getBoundingClientRect().top + window.scrollY
  if (window.scrollY > top) window.scrollTo({ top, behavior: "instant" })
}
