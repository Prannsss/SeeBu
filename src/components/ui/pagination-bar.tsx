"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

/** Page numbers to show: always first/last, a window around the current page, gaps as "…". */
function pageItems(page: number, totalPages: number): (number | "gap")[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
  const start = Math.max(2, Math.min(page - 1, totalPages - 4))
  const end = Math.min(totalPages - 1, Math.max(page + 1, 5))
  const items: (number | "gap")[] = [1]
  if (start > 2) items.push("gap")
  for (let p = start; p <= end; p++) items.push(p)
  if (end < totalPages - 1) items.push("gap")
  items.push(totalPages)
  return items
}

type PaginationBarProps = {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  /** Disables the controls while the next page is loading. */
  disabled?: boolean
}

export function PaginationBar({ page, pageSize, total, onPageChange, disabled }: PaginationBarProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  if (total <= pageSize) return null

  const first = (page - 1) * pageSize + 1
  const last = Math.min(page * pageSize, total)

  return (
    <nav aria-label="Pagination" className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Showing <span className="font-semibold text-slate-900 dark:text-slate-100">{first}–{last}</span> of{" "}
        <span className="font-semibold text-slate-900 dark:text-slate-100">{total}</span>
      </p>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          className="h-9 px-2.5"
          onClick={() => onPageChange(page - 1)}
          disabled={disabled || page <= 1}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline ml-1">Prev</span>
        </Button>

        {/* Numbered pages on wider screens; a compact counter on phones */}
        <div className="hidden sm:flex items-center gap-1">
          {pageItems(page, totalPages).map((item, i) =>
            item === "gap" ? (
              <span key={`gap-${i}`} className="px-1.5 text-slate-500" aria-hidden="true">…</span>
            ) : (
              <Button
                key={item}
                variant={item === page ? "default" : "ghost"}
                size="sm"
                className="h-9 min-w-9 px-2.5"
                onClick={() => onPageChange(item)}
                disabled={disabled}
                aria-label={`Page ${item}`}
                aria-current={item === page ? "page" : undefined}
              >
                {item}
              </Button>
            )
          )}
        </div>
        <span className="sm:hidden px-3 text-sm font-medium text-slate-700 dark:text-slate-300">
          Page {page} of {totalPages}
        </span>

        <Button
          variant="outline"
          size="sm"
          className="h-9 px-2.5"
          onClick={() => onPageChange(page + 1)}
          disabled={disabled || page >= totalPages}
          aria-label="Next page"
        >
          <span className="hidden sm:inline mr-1">Next</span>
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </nav>
  )
}
