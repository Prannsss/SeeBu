import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-32 dark:bg-slate-950 dark:text-slate-100">
      <div className="container mx-auto max-w-4xl px-4 py-8 sm:py-10 animate-pulse">
        <div className="mb-6">
          <Skeleton className="h-9 w-56 bg-slate-200 dark:bg-slate-800" />
          <Skeleton className="mt-2 h-4 w-80 max-w-full bg-slate-200 dark:bg-slate-800" />
        </div>

        <div className="mb-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full bg-slate-200 dark:bg-slate-800" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-24 bg-slate-200 dark:bg-slate-800" />
              <Skeleton className="h-8 w-56 max-w-[70vw] bg-slate-200 dark:bg-slate-800" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-6 w-36 bg-slate-200 dark:bg-slate-800" />
              <Skeleton className="h-4 w-56 max-w-[70vw] bg-slate-200 dark:bg-slate-800" />
            </div>
            <Skeleton className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-800" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-16 bg-slate-200 dark:bg-slate-800" />
            <Skeleton className="h-16 bg-slate-200 dark:bg-slate-800" />
            <Skeleton className="h-16 bg-slate-200 dark:bg-slate-800" />
            <Skeleton className="h-16 bg-slate-200 dark:bg-slate-800" />
          </div>
        </div>
      </div>
    </div>
  );
}
