import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileWarning, Search, User, Clock3, CircleUserRound } from "lucide-react";
import { ClientDock } from "@/components/navigation/ClientDock";

export default function ClientDashboard() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-sky-50 via-cyan-50 to-white pb-32 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="absolute -left-24 top-16 h-64 w-64 rounded-full bg-cyan-300/30 blur-3xl dark:bg-cyan-500/20" />
      <div className="absolute -right-24 bottom-24 h-64 w-64 rounded-full bg-blue-300/20 blur-3xl dark:bg-blue-500/20" />

      <div className="container relative mx-auto max-w-5xl px-4 py-10 md:py-14">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-blue-500/10 p-4">
              <User className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Client Home</h1>
              <p className="text-muted-foreground">Everything you need to report and monitor civic concerns.</p>
            </div>
          </div>
          <Badge className="hidden bg-blue-600 px-3 py-1 text-white sm:inline-flex">Active</Badge>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="border-blue-200/60 bg-white/80 backdrop-blur">
            <CardHeader className="pb-2">
              <CardDescription>Open Reports</CardDescription>
              <CardTitle className="text-2xl text-blue-700">04</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-cyan-200/60 bg-white/80 backdrop-blur">
            <CardHeader className="pb-2">
              <CardDescription>Resolved This Month</CardDescription>
              <CardTitle className="text-2xl text-cyan-700">17</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-slate-200 bg-white/80 backdrop-blur sm:col-span-2 lg:col-span-1">
            <CardHeader className="pb-2">
              <CardDescription>Avg Resolution Time</CardDescription>
              <CardTitle className="text-2xl">2.4 Days</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="transition-all hover:-translate-y-1 hover:shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileWarning className="h-5 w-5 text-red-500" />
                Report an Issue
              </CardTitle>
              <CardDescription>
                Create a structured report with location, urgency, and photo proof in a guided flow.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/client/report">
                <Button className="w-full bg-blue-600 hover:bg-blue-700">Start Report</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="transition-all hover:-translate-y-1 hover:shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5 text-blue-600" />
                Track Issue
              </CardTitle>
              <CardDescription>
                Search by tracking code and instantly see progress updates from the resolution team.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/client/tracking">
                <Button variant="outline" className="w-full border-blue-300 text-blue-700 hover:bg-blue-50">
                  Open Tracking
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="transition-all hover:-translate-y-1 hover:shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock3 className="h-5 w-5 text-blue-600" />
                History
              </CardTitle>
              <CardDescription>Review your previously submitted reports and result timelines.</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/client/history">
                <Button variant="outline" className="w-full">View History</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="transition-all hover:-translate-y-1 hover:shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CircleUserRound className="h-5 w-5 text-blue-600" />
                Profile
              </CardTitle>
              <CardDescription>Update your contact profile and notification preferences.</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/client/profile">
                <Button variant="outline" className="w-full">Manage Profile</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      <ClientDock />
    </div>
  );
}
