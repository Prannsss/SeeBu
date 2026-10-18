"use client"

import * as React from "react"
import { CalendarDays, ChevronDown } from "lucide-react"
import type { DateRange } from "react-day-picker"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { dateToDay, dayToDate, formatDayRange, phToday, shiftDay } from "@/lib/ph-date"

const PRESETS = [
  { id: "today", label: "Today", range: (t: string) => [t, t] },
  { id: "yesterday", label: "Yesterday", range: (t: string) => [shiftDay(t, -1), shiftDay(t, -1)] },
  { id: "7d", label: "Last 7 days", range: (t: string) => [shiftDay(t, -6), t] },
  { id: "30d", label: "Last 30 days", range: (t: string) => [shiftDay(t, -29), t] },
  { id: "90d", label: "Last 90 days", range: (t: string) => [shiftDay(t, -89), t] },
  { id: "month", label: "This month", range: (t: string) => [`${t.slice(0, 8)}01`, t] },
  {
    id: "last-month",
    label: "Last month",
    range: (t: string) => {
      const end = shiftDay(`${t.slice(0, 8)}01`, -1)
      return [`${end.slice(0, 8)}01`, end]
    },
  },
  { id: "year", label: "This year", range: (t: string) => [`${t.slice(0, 4)}-01-01`, t] },
  { id: "all", label: "All time", range: (_t: string) => [null, null] },
] as const

export type DateRangePreset = (typeof PRESETS)[number]["id"]

/** `from`/`to` are inclusive PH days ("YYYY-MM-DD"); both null means all time. */
export type DateRangeValue = { preset: DateRangePreset | "custom"; from: string | null; to: string | null }

export function presetRange(id: DateRangePreset): DateRangeValue {
  const [from, to] = PRESETS.find((p) => p.id === id)!.range(phToday())
  return { preset: id, from, to }
}

export function dateRangeLabel(value: DateRangeValue): string {
  if (value.preset !== "custom") return PRESETS.find((p) => p.id === value.preset)!.label
  return value.from && value.to ? formatDayRange(value.from, value.to) : "All time"
}

export function DateRangePicker({
  value,
  onChange,
  className,
}: {
  value: DateRangeValue
  onChange: (value: DateRangeValue) => void
  className?: string
}) {
  const [open, setOpen] = React.useState(false)
  const [draft, setDraft] = React.useState<DateRange | undefined>()
  const isMobile = useIsMobile()
  const today = dayToDate(phToday())

  const handleOpenChange = (next: boolean) => {
    // Each opening starts from the applied range; Cancel/Escape discards the draft.
    if (next) setDraft(value.from && value.to ? { from: dayToDate(value.from), to: dayToDate(value.to) } : undefined)
    setOpen(next)
  }

  const choosePreset = (id: DateRangePreset) => {
    onChange(presetRange(id))
    setOpen(false)
  }

  const applyCustom = () => {
    if (!draft?.from) return
    onChange({ preset: "custom", from: dateToDay(draft.from), to: dateToDay(draft.to ?? draft.from) })
    setOpen(false)
  }

  // Two months side by side on desktop, ending with the month being shown.
  const anchor = draft?.from ?? today
  const defaultMonth = isMobile ? anchor : new Date(anchor.getFullYear(), anchor.getMonth() - (draft?.from ? 0 : 1), 1)

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn("h-10 min-w-[12rem] justify-start gap-2 border-slate-200 font-medium", className)}
        >
          <CalendarDays className="text-slate-600" aria-hidden="true" />
          <span className="sr-only">Date range: </span>
          <span className="truncate">{dateRangeLabel(value)}</span>
          <ChevronDown className="ml-auto text-slate-500" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-auto max-w-[calc(100vw-2rem)] p-0" aria-label="Choose a date range">
        <div className="flex max-h-[80vh] flex-col overflow-y-auto sm:flex-row">
          <div
            role="group"
            aria-label="Quick ranges"
            className="grid grid-cols-2 gap-1 border-b p-2 sm:flex sm:w-40 sm:flex-col sm:border-b-0 sm:border-r"
          >
            {PRESETS.map((preset) => {
              const active = value.preset === preset.id
              return (
                <button
                  key={preset.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => choosePreset(preset.id)}
                  className={cn(
                    "rounded-md px-3 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active && "bg-accent font-semibold text-accent-foreground"
                  )}
                >
                  {preset.label}
                </button>
              )
            })}
          </div>

          <div className="flex flex-col">
            <Calendar
              mode="range"
              selected={draft}
              onSelect={setDraft}
              numberOfMonths={isMobile ? 1 : 2}
              defaultMonth={defaultMonth}
              disabled={{ after: today }}
              endMonth={today}
            />
            <div className="flex flex-col gap-3 border-t p-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-600" aria-live="polite">
                {draft?.from
                  ? formatDayRange(dateToDay(draft.from), dateToDay(draft.to ?? draft.from))
                  : "Pick a start date, then an end date"}
              </p>
              <div className="grid grid-cols-2 gap-2 sm:flex">
                <Button
                  type="button"
                  size="sm"
                  className="bg-sky-700 font-bold text-white hover:bg-sky-800"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="button" size="sm" disabled={!draft?.from} onClick={applyCustom}>
                  Apply
                </Button>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
