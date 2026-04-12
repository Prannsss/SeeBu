import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Activity, AlertTriangle, BarChart3, ClipboardList, ArrowRight, Users, UserPlus } from "lucide-react"
import { ChartAreaInteractive } from "@/components/ui/chart-area-interactive"
import Link from "next/link"
import { cookies } from "next/headers"

async function getAdminData() {
  const reqCookies = await cookies();
  const token = reqCookies.get("auth-token")?.value;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  try {
    const profileRes = await fetch(`${apiUrl}/api/v1/users/me`, {
      headers: { "Authorization": `Bearer ${token}` },
      cache: 'no-store'
    });
    const profileData = await profileRes.json();
    const municipalityId = profileData?.data?.municipality_id;

    if (!municipalityId) {
      return { reportedIssues: 0, delayedTasks: 0, subordinateAdmins: 0, deptWorkforce: 0, chartData: [] };
    }

    // Reports fetch
    const reportsRes = await fetch(`${apiUrl}/api/v1/reports`, {
      headers: { "Authorization": `Bearer ${token}` },
      cache: 'no-store'
    });
    const reportsData = await reportsRes.json();
    const allReports = reportsData?.data || [];
    const openReports = allReports.filter((r: any) => 
      r.municipality_id === municipalityId && 
      !['Resolved', 'Completed', 'Rejected'].includes(r.status)
    ).length;

    // Users fetch
    const usersRes = await fetch(`${apiUrl}/api/v1/users`, {
      headers: { "Authorization": `Bearer ${token}` },
      cache: 'no-store'
    });
    const usersData = await usersRes.json();
    const subAdmins = (usersData?.data || []).filter((u: any) => u.area === municipalityId && u.role === 'ADMIN').length;
    const workforce = (usersData?.data || []).filter((u: any) => u.area === municipalityId && u.role === 'WORKFORCE_OFFICER').length;

    // Analytics / tasks
    const analyticsRes = await fetch(`${apiUrl}/api/v1/analytics/admin/${municipalityId}`, {
      headers: { "Authorization": `Bearer ${token}` },
      cache: 'no-store'
    });
    const analytics = await analyticsRes.ok ? await analyticsRes.json() : { chartData: [], delayedTasks: 0 };
    
    // Fallback delayedTasks via tasks if we didn't get from analytics
    // Wait, the prompt asked to count "Delegated" tasks
    const tasksRes = await fetch(`${apiUrl}/api/v1/tasks`, {
      headers: { "Authorization": `Bearer ${token}` },
      cache: 'no-store'
    });
    const tasksData = await tasksRes.json();
    const delegatedTasksCount = (tasksData?.data || []).filter((t: any) => t.status === 'Delegated').length;

    return {
      reportedIssues: openReports,
      delayedTasks: delegatedTasksCount || analytics.delayedTasks || 0,
      subordinateAdmins: subAdmins,
      deptWorkforce: workforce,
      chartData: analytics.chartData || []
    };
  } catch (error) {
    console.error("Error fetching admin data:", error);
    return { reportedIssues: 0, delayedTasks: 0, subordinateAdmins: 0, deptWorkforce: 0, chartData: [] };
  }
}

export default async function AdminHomePage() {
  const data = await getAdminData();
  const { chartData, reportedIssues, delayedTasks, subordinateAdmins, deptWorkforce } = data;

  return (
    <div className="min-h-screen bg-white pb-32 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Admin Home</h1>
            <p className="text-muted-foreground">Operations overview, urgent cases, and workload signals.</p>
          </div>
          <Badge className="bg-blue-600 text-white">Live Monitoring</Badge>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <Card>
            <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-2">
              <CardDescription className="text-xs sm:text-sm truncate" title="Open Reports">Open Reports</CardDescription>
              <CardTitle className="text-lg sm:text-2xl">{reportedIssues}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0 text-[10px] sm:text-xs text-muted-foreground flex items-center min-w-0"><ClipboardList className="mr-1 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" /> <span className="truncate">Unresolved Cases</span></CardContent>
          </Card>
          <Card>
            <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-2">
              <CardDescription className="text-xs sm:text-sm truncate" title="Delegated Tasks">Delegated</CardDescription>
              <CardTitle className="text-lg sm:text-2xl text-red-600">{delayedTasks}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0 text-[10px] sm:text-xs text-muted-foreground flex items-center min-w-0"><AlertTriangle className="mr-1 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" /> <span className="truncate">Needs action</span></CardContent>
          </Card>
          <Card>
            <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-2">
              <CardDescription className="text-xs sm:text-sm truncate" title="Subordinate Admins">Subordinate Admins</CardDescription>
              <CardTitle className="text-lg sm:text-2xl text-emerald-600">{subordinateAdmins}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0 text-[10px] sm:text-xs text-muted-foreground flex items-center min-w-0"><UserPlus className="mr-1 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" /> <span className="truncate">In assigned area</span></CardContent>
          </Card>
          <Card>
            <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-2">
              <CardDescription className="text-xs sm:text-sm truncate" title="Dept. Workforce">Dept. Workforce</CardDescription>
              <CardTitle className="text-lg sm:text-2xl text-blue-600">{deptWorkforce}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0 text-[10px] sm:text-xs text-muted-foreground flex items-center min-w-0"><Users className="mr-1 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" /> <span className="truncate">Across departments</span></CardContent>
          </Card>
        </div>


        <div className="relative">
          <ChartAreaInteractive
            title="Reports Overview"
            description="Last 7 days"
            chartData={chartData.length > 0 ? chartData : [{ name: 'Loading', reports: 0 }]}
            defaultTimeRange="7d"
            hideFilter={true}
            headerAction={
              <Link 
                href="/admin/analytics" 
                className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/50 px-3 py-1.5 rounded-full transition-colors"
              >
                Full Analytics <ArrowRight className="w-4 h-4" />
              </Link>
            }
            chartConfig={{
              views: {
                label: "Reports",
              },
              reports: {
                label: "Reports",
                color: "#2563eb",
              },
            }}
          />
        </div>
      </div>


    </div>
  )
}
