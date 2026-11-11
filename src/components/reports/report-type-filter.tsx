"use client"

import type { ComponentType, MouseEvent } from "react"
import { REPORT_TYPES, type ReportTypeFilterValue, type ReportTypeInfo, type ReportTypeValue } from "@/lib/report-types"
import { cn } from "@/lib/utils"

type ReportTypeFilterProps = {
  value: ReportTypeFilterValue
  onChange: (value: ReportTypeFilterValue) => void
  /** Reports per type under the page's other filters; badges are hidden until they load. */
  counts?: Partial<Record<ReportTypeValue, number>>
  /** Types to offer (default: all of them, in report-form order). */
  types?: readonly ReportTypeInfo[]
  /** "scroll": one swipeable row on phones that wraps from `sm` up. "wrap": always wraps (popovers). */
  layout?: "scroll" | "wrap"
  /**
   * Classes for the chip row. On phones the "scroll" row should run to the screen (or panel) edge so a
   * cut-off chip shows there is more: pass the container's gutter as negative margin + padding,
   * e.g. "-mx-4 px-4 scroll-px-4 sm:mx-0 sm:px-0.5".
   */
  className?: string
}

/**
 * Single-select report type filter. Each chip is a toggle: picking the active type again goes back
 * to "All types". Counts let staff see how reports split across types before they filter.
 */
export function ReportTypeFilter({ value, onChange, counts, types = REPORT_TYPES, layout = "scroll", className }: ReportTypeFilterProps) {
  const allCount = counts ? types.reduce((sum, t) => sum + (counts[t.value] ?? 0), 0) : undefined

  const select = (next: ReportTypeFilterValue, event: MouseEvent<HTMLButtonElement>) => {
    onChange(next === value && next !== "all" ? "all" : next)
    if (layout === "scroll") event.currentTarget.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" })
  }

  const chips = (
    <>
      <FilterChip label="All types" count={allCount} active={value === "all"} onClick={(e) => select("all", e)} />
      {types.map((type) => (
        <FilterChip
          key={type.value}
          label={type.label}
          icon={type.icon}
          count={counts ? counts[type.value] ?? 0 : undefined}
          active={value === type.value}
          onClick={(e) => select(type.value, e)}
        />
      ))}
    </>
  )

  if (layout === "wrap") {
    return (
      <div role="group" aria-label="Filter by report type" className={cn("flex flex-wrap gap-1.5", className)}>
        {chips}
      </div>
    )
  }

  return (
    <div
      role="group"
      aria-label="Filter by report type"
      // py/px leave room for focus rings inside the scrolling row.
      className={cn(
        "flex min-w-0 gap-1.5 overflow-x-auto overscroll-x-contain px-0.5 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap sm:overflow-visible",
        className
      )}
    >
      {chips}
    </div>
  )
}

/** One toggle chip (aria-pressed) in the report filters' style. */
export function FilterChip({
  label,
  icon: Icon,
  count,
  active,
  onClick,
}: {
  label: string
  icon?: ComponentType<{ className?: string; "aria-hidden"?: boolean }>
  count?: number
  active: boolean
  onClick: (event: MouseEvent<HTMLButtonElement>) => void
}) {
  const countText = count === undefined ? "" : `, ${count} report${count === 1 ? "" : "s"}`
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={`${label}${countText}`}
      onClick={onClick}
      className={cn(
        "inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 text-xs font-semibold transition-colors sm:h-8",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
        active
          ? "border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900"
          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
      )}
    >
      {Icon && <Icon className={cn("h-3.5 w-3.5 shrink-0", active ? "" : "text-slate-500 dark:text-slate-400")} aria-hidden={true} />}
      {label}
      {count !== undefined && (
        <span
          className={cn(
            "min-w-[1.25rem] rounded-full px-1.5 text-center text-[10px] leading-4 tabular-nums",
            active
              ? "bg-white/20 dark:bg-slate-900/10"
              : count === 0
                ? "bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
          )}
          aria-hidden="true"
        >
          {count}
        </span>
      )}
    </button>
  )
}
