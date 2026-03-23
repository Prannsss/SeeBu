import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, CheckCircle2, TrendingUp, AlertCircle } from "lucide-react";

export default function WorkforceDashboard() {
  return (
    <div className="min-h-screen bg-white pb-32 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
    <div className="container mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workforce Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of your daily assignments and performance.</p>
        </div>
        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-400">
          On Duty
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-2">
            <CardDescription className="text-xs sm:text-sm truncate" title="Active Assignments">Active Assignments</CardDescription>
            <CardTitle className="text-lg sm:text-2xl text-blue-600 dark:text-blue-400">3</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            <div className="text-[10px] sm:text-xs text-muted-foreground flex items-center min-w-0" title="In progress today">
              <Briefcase className="mr-1 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="truncate">In progress today</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-2">
            <CardDescription className="text-xs sm:text-sm truncate" title="Completed Today">Completed Today</CardDescription>
            <CardTitle className="text-lg sm:text-2xl text-emerald-600 dark:text-emerald-400">5</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            <div className="text-[10px] sm:text-xs text-muted-foreground flex items-center min-w-0" title="Tasks resolved">
              <CheckCircle2 className="mr-1 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="truncate">Tasks resolved</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-2">
            <CardDescription className="text-xs sm:text-sm truncate" title="Efficiency Rating">Efficiency Rating</CardDescription>
            <CardTitle className="text-lg sm:text-2xl text-indigo-600 dark:text-indigo-400">92%</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            <div className="text-[10px] sm:text-xs text-muted-foreground flex items-center min-w-0" title="+2% from last week">
              <TrendingUp className="mr-1 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 text-emerald-500" />
              <span className="truncate">+2% from last week</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-2">
            <CardDescription className="text-xs sm:text-sm truncate" title="Pending Alerts">Pending Alerts</CardDescription>
            <CardTitle className="text-lg sm:text-2xl text-red-600 dark:text-red-400">1</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            <div className="text-[10px] sm:text-xs text-muted-foreground flex items-center min-w-0" title="Requires attention">
              <AlertCircle className="mr-1 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="truncate">Requires attention</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Announcements</CardTitle>
            <CardDescription className="text-xs sm:text-sm truncate" title="Updates from administration">Updates from administration</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="rounded-lg border p-3">
                <div className="font-medium">Safety Gear Protocol</div>
                <div className="text-sm text-muted-foreground mt-1">Please ensure all high-visibility vests are worn during road repairs.</div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="font-medium">Schedule Update</div>
                <div className="text-sm text-muted-foreground mt-1">Shift changes for the upcoming holiday weekend have been posted.</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription className="text-xs sm:text-sm truncate" title="Common tools">Common tools</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <button className="flex flex-col items-center justify-center rounded-lg border bg-card p-6 text-card-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground">
              <CheckCircle2 className="h-6 w-6 mb-2 text-emerald-500" />
              <span className="text-sm font-medium">Log Task</span>
            </button>
            <button className="flex flex-col items-center justify-center rounded-lg border bg-card p-6 text-card-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground">
              <AlertCircle className="h-6 w-6 mb-2 text-amber-500" />
              <span className="text-sm font-medium">Report Issue</span>
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
    </div>
  );
}
