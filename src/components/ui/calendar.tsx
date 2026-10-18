"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

const navButton =
  "inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40"

/**
 * react-day-picker v9 with the app's tokens. Range ends use `primary`; days between use `accent`.
 * Modifier classes land on the day cell (<td>), so the inner button is styled via `[&>button]`.
 */
function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "relative flex flex-col gap-4 sm:flex-row sm:gap-6",
        month: "flex flex-col gap-3",
        month_caption: "flex h-8 items-center px-1",
        caption_label: "text-sm font-semibold text-slate-900",
        nav: "absolute right-1 top-0 z-10 flex items-center gap-1",
        button_previous: navButton,
        button_next: navButton,
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday: "w-10 text-xs font-medium text-muted-foreground",
        week: "mt-1 flex w-full",
        day: "relative h-10 w-10 p-0 text-center text-sm",
        day_button:
          "inline-flex h-10 w-10 items-center justify-center rounded-md font-normal text-slate-900 transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none",
        range_start:
          "rounded-l-md bg-accent [&>button]:bg-primary [&>button]:font-semibold [&>button]:text-primary-foreground [&>button]:hover:bg-primary [&>button]:hover:text-primary-foreground",
        range_end:
          "rounded-r-md bg-accent [&>button]:bg-primary [&>button]:font-semibold [&>button]:text-primary-foreground [&>button]:hover:bg-primary [&>button]:hover:text-primary-foreground",
        range_middle: "bg-accent [&>button]:rounded-none [&>button]:text-accent-foreground",
        today: "[&>button]:font-bold [&>button]:underline [&>button]:underline-offset-4",
        outside: "[&>button]:text-muted-foreground [&>button]:opacity-50",
        disabled: "[&>button]:text-muted-foreground [&>button]:opacity-40",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className: chevronClass }) =>
          orientation === "left"
            ? <ChevronLeft className={cn("h-4 w-4", chevronClass)} aria-hidden="true" />
            : <ChevronRight className={cn("h-4 w-4", chevronClass)} aria-hidden="true" />,
      }}
      {...props}
    />
  )
}

export { Calendar }
