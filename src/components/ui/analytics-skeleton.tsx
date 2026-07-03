import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export function AnalyticsSkeleton() {
  return (
    <div className="min-h-screen bg-white pb-32 dark:bg-slate-950 dark:text-slate-100">
      <div className="w-full max-w-[1600px] mx-auto px-4 py-10">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-7 w-7 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          <Skeleton className="h-10 w-[180px]" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm lg:col-span-2 lg:h-[600px]">
            <CardHeader>
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-56" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[460px] w-full" />
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-800 shadow-sm h-[500px] lg:h-[600px]">
            <CardHeader>
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-full w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
