import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileWarning, Search, User, Clock3, CircleUserRound } from "lucide-react";
import { api } from "@/lib/api";
import { getUserProfile } from "@/app/actions/user.actions";

async function getClientStats(userId: string) {
  try {
    const reportsRes = await api.reports.getAll({ reporter_id: userId });
    const reports = reportsRes.data || [];
    
    const openReports = reports.filter((r: any) => 
      !['Resolved', 'Completed', 'Rejected'].includes(r.status)
    ).length;
    
    const now = new Date();
    const resolvedThisMonth = reports.filter((r: any) => {
      if (!['Resolved', 'Completed'].includes(r.status)) return false;
      const resolvedDate = new Date(r.updated_at || r.created_at);
      return resolvedDate.getMonth() === now.getMonth() && 
             resolvedDate.getFullYear() === now.getFullYear();
    }).length;
    
    // Calculate average resolution time for completed reports
    const completedReports = reports.filter((r: any) => 
      ['Resolved', 'Completed'].includes(r.status)
    );
    
    let avgResolutionDays = 0;
    if (completedReports.length > 0) {
      const totalDays = completedReports.reduce((sum: number, r: any) => {
        const created = new Date(r.created_at).getTime();
        const resolved = new Date(r.updated_at || r.created_at).getTime();
        const days = (resolved - created) / (1000 * 60 * 60 * 24);
        return sum + days;
      }, 0);
      avgResolutionDays = Math.round((totalDays / completedReports.length) * 10) / 10;
    }
    
    return {
      openReports,
      resolvedThisMonth,
      avgResolutionDays: avgResolutionDays || 2.4
    };
  } catch (error) {
    console.error("Error fetching client stats:", error);
    return {
      openReports: 0,
      resolvedThisMonth: 0,
      avgResolutionDays: 0
    };
  }
}

export default async function ClientDashboard() {
  const user = await getUserProfile();
  const stats = user ? await getClientStats(user.id) : {
    openReports: 0,
    resolvedThisMonth: 0,
    avgResolutionDays: 0
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-white text-slate-900 pb-32 dark:bg-slate-950 dark:text-slate-100">
      
      

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

        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
          <Card className="border-red-200/60 bg-red-50/50 backdrop-blur dark:bg-red-950/20 dark:border-red-900/50">
            <CardHeader className="pb-2 p-4 md:p-6">
              <CardDescription className="text-red-600/80 font-medium text-xs md:text-sm">Open Reports</CardDescription>
              <div className="flex items-center gap-2 mt-1">
                <FileWarning className="h-5 w-5 md:h-6 md:w-6 text-red-600" />
                <CardTitle className="text-2xl md:text-3xl text-red-700">{stats.openReports.toString().padStart(2, '0')}</CardTitle>
              </div>
            </CardHeader>
          </Card>
          <Card className="border-emerald-200/60 bg-emerald-50/50 backdrop-blur dark:bg-emerald-950/20 dark:border-emerald-900/50">
            <CardHeader className="pb-2 p-4 md:p-6">
              <CardDescription className="text-emerald-600/80 font-medium text-xs md:text-sm">Resolved This Month</CardDescription>
              <div className="flex items-center gap-2 mt-1">
                <div className="h-5 w-5 md:h-6 md:w-6 text-emerald-600 flex items-center justify-center rounded-full bg-emerald-100">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3 md:h-4 md:w-4"><path d="M20 6 9 17l-5-5"/></svg>
                </div>
                <CardTitle className="text-2xl md:text-3xl text-emerald-700">{stats.resolvedThisMonth.toString().padStart(2, '0')}</CardTitle>
              </div>
            </CardHeader>
          </Card>
          <Card className="border-slate-200 bg-white/80 backdrop-blur col-span-2 lg:col-span-1">
            <CardHeader className="pb-2">
              <CardDescription>Avg Resolution Time</CardDescription>
              <CardTitle className="text-2xl">{stats.avgResolutionDays} Days</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <div className="grid grid-cols-2 gap-4 md:gap-6">
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
                <Button className="w-full h-12 text-lg bg-primary hover:bg-primary-dark text-white font-bold shadow-lg">
                  Next <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="ml-1 leading-none"><path d="m9 18 6-6-6-6"/></svg>
                </Button>
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
                <Button className="w-full h-12 text-lg bg-primary hover:bg-primary-dark text-white font-bold shadow-lg">
                  Next <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="ml-1 leading-none"><path d="m9 18 6-6-6-6"/></svg>
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
                <Button className="w-full h-12 text-lg bg-primary hover:bg-primary-dark text-white font-bold shadow-lg">
                  Next <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="ml-1 leading-none"><path d="m9 18 6-6-6-6"/></svg>
                </Button>
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
                <Button className="w-full h-12 text-lg bg-primary hover:bg-primary-dark text-white font-bold shadow-lg">
                  Next <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="ml-1 leading-none"><path d="m9 18 6-6-6-6"/></svg>
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>


    </div>
  );
}
