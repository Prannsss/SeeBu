import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

/** Summary cards + charts placeholder; also used inside the dashboard while the first load runs. */
export function AnalyticsContentSkeleton() {
  return (
    <div className="space-y-6" aria-hidden="true">
      <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Card key={i} className="p-4 sm:p-6 space-y-3">
            <Skeleton className="h-4 w-24 bg-slate-200" />
            <Skeleton className="h-8 w-16 bg-slate-200" />
            <Skeleton className="h-3 w-28 bg-slate-200" />
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm lg:col-span-2">
          <CardHeader>
            <Skeleton className="h-5 w-40 bg-slate-200" />
            <Skeleton className="h-4 w-56 bg-slate-200" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[360px] w-full bg-slate-200" />
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader>
            <Skeleton className="h-5 w-40 bg-slate-200" />
            <Skeleton className="h-4 w-48 bg-slate-200" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[360px] w-full bg-slate-200" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export function AnalyticsSkeleton() {
  return (
    <div className="min-h-screen bg-white pb-32 dark:bg-slate-950 dark:text-slate-100">
      <div className="w-full max-w-[1600px] mx-auto px-4 py-8 sm:py-10">
        <span role="status" className="sr-only">Loading analytics…</span>
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between" aria-hidden="true">
          <div className="flex items-center gap-3">
            <Skeleton className="h-7 w-7 rounded-full bg-slate-200" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-56 bg-slate-200" />
              <Skeleton className="h-4 w-72 bg-slate-200" />
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Skeleton className="h-10 w-full sm:w-[12rem] bg-slate-200" />
            <Skeleton className="h-10 w-full sm:w-[200px] bg-slate-200" />
          </div>
        </div>
        <AnalyticsContentSkeleton />
      </div>
    </div>
  )
}
