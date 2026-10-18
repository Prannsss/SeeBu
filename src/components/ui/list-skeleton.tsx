import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * Placeholder cards shown while a tab's list loads — one look across every role's lists.
 * Renders bare cards (no wrapper) so it drops into whatever grid the list already uses.
 */
export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <>
      <span role="status" className="sr-only">Loading…</span>
      {Array.from({ length: count }, (_, i) => (
        <Card key={i} className="p-6 space-y-3" aria-hidden="true">
          <Skeleton className="h-4 w-32 bg-slate-200" />
          <Skeleton className="h-6 w-2/3 bg-slate-200" />
          <Skeleton className="h-4 w-1/2 bg-slate-200" />
        </Card>
      ))}
    </>
  )
}
