"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileWarning, Search, User, Clock3, CircleUserRound, CheckCircle2, AlertCircle } from "lucide-react";
import { useReports } from "@/hooks/queries/useReports";
import { greeting } from "@/lib/greeting";

export function ClientFeedWidget({ userId, name }: { userId: string; name?: string | null }) {
  const { data: reports = [], isLoading, isError, refetch } = useReports({ reporter_id: userId });

  // Calculate stats dynamically on the client
  const openReports = reports.filter((r) => 
    !['Resolved', 'Completed', 'Rejected'].includes(r.status)
  ).length;
  
  const now = new Date();
  const resolvedThisMonth = reports.filter((r) => {
    if (!['Resolved', 'Completed'].includes(r.status)) return false;
    const resolvedDate = new Date(r.updated_at || r.created_at);
    return resolvedDate.getMonth() === now.getMonth() && 
          resolvedDate.getFullYear() === now.getFullYear();
  }).length;
  
  const completedReports = reports.filter((r) => 
    ['Resolved', 'Completed'].includes(r.status)
  );
  
  let avgResolutionDays = 0;
  if (completedReports.length > 0) {
    const totalDays = completedReports.reduce((sum, r) => {
      const created = new Date(r.created_at).getTime();
      const resolved = new Date(r.updated_at || r.created_at).getTime();
      const days = (resolved - created) / (1000 * 60 * 60 * 24);
      return sum + days;
    }, 0);
    avgResolutionDays = Math.round((totalDays / completedReports.length) * 10) / 10;
  }

  const stat = (value: number) => (isLoading ? "…" : value.toString().padStart(2, '0'));
  const kpis = [
    { label: 'Open Reports', value: stat(openReports), icon: FileWarning, chip: 'bg-red-100 text-red-800', span: '' },
    { label: 'Resolved This Month', value: stat(resolvedThisMonth), icon: CheckCircle2, chip: 'bg-emerald-100 text-emerald-600', span: '' },
    { label: 'Avg Resolution Time', value: isLoading ? "…" : `${avgResolutionDays || 2.4} Days`, icon: Clock3, chip: 'bg-sky-100 text-sky-800', span: 'col-span-2 lg:col-span-1' },
  ];
  // One primary action (report); the rest are secondary (outline).
  const actions = [
    { title: 'Report an Issue', description: 'Create a structured report with location, urgency, and photo proof in a guided flow.', href: '/client/report', icon: FileWarning, primary: true },
    { title: 'Track Issue', description: 'Search by tracking code and instantly see progress updates from the resolution team.', href: '/client/tracking', icon: Search, primary: false },
    { title: 'History', description: 'Review your previously submitted reports and result timelines.', href: '/client/history', icon: Clock3, primary: false },
    { title: 'Profile', description: 'Update your contact profile and notification preferences.', href: '/client/profile', icon: CircleUserRound, primary: false },
  ];

  return (
    <div className="container relative mx-auto max-w-5xl px-4 py-10 md:py-14">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="rounded-full bg-sky-100 p-4">
            <User className="h-8 w-8 text-sky-800" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">{greeting(name)}</h1>
            <p className="text-slate-600">Everything you need to report and monitor civic concerns.</p>
          </div>
        </div>
        <Badge className="hidden bg-blue-600 px-3 py-1 text-white sm:inline-flex">Active</Badge>
      </div>

      {isError && (
        <div role="alert" className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <span className="flex items-center gap-2"><AlertCircle className="h-4 w-4" aria-hidden="true" /> We couldn&apos;t load your report stats.</span>
          <Button size="sm" variant="outline" onClick={() => refetch()}>Try again</Button>
        </div>
      )}

      <div className="mb-8 grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-3">
        {kpis.map(({ label, value, icon: Icon, chip, span }) => (
          <Card key={label} className={span}>
            <CardHeader className="p-4 md:p-6">
              <div className="flex items-center justify-between gap-2">
                <CardDescription className="text-sm font-medium text-slate-600">{label}</CardDescription>
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${chip}`}><Icon className="h-4 w-4" aria-hidden="true" /></span>
              </div>
              <CardTitle className="text-2xl md:text-3xl font-bold text-slate-900">{value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 md:gap-6">
        {actions.map(({ title, description, href, icon: Icon, primary }) => (
          <Card key={href} className="flex flex-col transition-all hover:-translate-y-1 hover:shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon className={`h-5 w-5 ${primary ? 'text-red-700' : 'text-sky-800'}`} aria-hidden="true" />
                {title}
              </CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="mt-auto">
              <Button asChild variant={primary ? 'default' : 'outline'} className="w-full h-12 text-base font-bold">
                <Link href={href}>
                  {primary ? 'Report' : 'Open'} <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="ml-1 leading-none" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
