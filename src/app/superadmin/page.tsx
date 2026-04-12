import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Activity, ShieldCheck, Users, UserCog, HardHat, ServerCog, TrendingUp, ArrowRight } from "lucide-react"
import { ChartAreaInteractive } from "@/components/ui/chart-area-interactive"
import Link from "next/link"
import { cookies } from "next/headers"

async function getSuperadminData() {
  const reqCookies = await cookies();
  const token = reqCookies.get("auth-token")?.value;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  try {
    // Analytics fetch
    const analyticsRes = await fetch(`${apiUrl}/api/v1/analytics/superadmin`, {
      headers: { "Authorization": `Bearer ${token}` },
      cache: 'no-store'
    });
    const analytics = await analyticsRes.ok ? await analyticsRes.json() : { chartData: [] };

    // Users fetch to get all roles
    const usersRes = await fetch(`${apiUrl}/api/v1/users`, {
      headers: { "Authorization": `Bearer ${token}` },
      cache: 'no-store'
    });
    const usersData = await usersRes.json();
    const allUsers = usersData?.data || [];

    const totalClients = allUsers.filter((u: any) => u.role === 'CLIENT').length;
    const totalAdmins = allUsers.filter((u: any) => u.role === 'ADMIN').length;
    // Combined workforce admins and officers for "Total Workforce"
    const totalWorkforce = allUsers.filter((u: any) => ['WORKFORCE_OFFICER', 'WORKFORCE_ADMIN'].includes(u.role)).length;

    return {
      chartData: analytics.chartData || [],
      totalClients,
      totalAdmins,
      totalWorkforce,
      platformHealth: '99.94%'
    };
  } catch (error) {
    console.error("Error fetching superadmin data:", error);
    return { chartData: [], totalClients: 0, totalAdmins: 0, totalWorkforce: 0, platformHealth: '99.94%' };
  }
}

export default async function SuperadminHomePage() {
  const data = await getSuperadminData();
  const { chartData, totalClients, totalAdmins, totalWorkforce, platformHealth } = data;

  return (
    <div className="min-h-screen bg-white pb-32 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Superadmin Home</h1>
            <p className="text-muted-foreground">System-wide visibility, governance, and platform health analytics.</p>
          </div>
          <Badge className="bg-blue-600 text-white">Global Scope</Badge>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <Card>
            <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-2">
              <CardDescription className="text-xs sm:text-sm truncate" title="Total Clients">Total Clients</CardDescription>
              <CardTitle className="text-lg sm:text-2xl text-blue-600">{totalClients.toLocaleString()}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0 text-[10px] sm:text-xs text-muted-foreground flex items-center min-w-0"><Users className="mr-1 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" /> <span className="truncate">Active citizens</span></CardContent>
          </Card>
          <Card>
            <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-2">
              <CardDescription className="text-xs sm:text-sm truncate" title="Total Admins">Total Admins</CardDescription>
              <CardTitle className="text-lg sm:text-2xl text-emerald-600">{totalAdmins.toLocaleString()}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0 text-[10px] sm:text-xs text-muted-foreground flex items-center min-w-0"><UserCog className="mr-1 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" /> <span className="truncate">Across municipalities</span></CardContent>
          </Card>
          <Card>
            <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-2">
              <CardDescription className="text-xs sm:text-sm truncate" title="Total Workforce">Total Workforce</CardDescription>
              <CardTitle className="text-lg sm:text-2xl text-indigo-600">{totalWorkforce.toLocaleString()}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0 text-[10px] sm:text-xs text-muted-foreground flex items-center min-w-0"><HardHat className="mr-1 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" /> <span className="truncate">Officers & Depts</span></CardContent>
          </Card>
          <Card>
            <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-2">
              <CardDescription className="text-xs sm:text-sm truncate" title="Platform Health">Platform Health</CardDescription>
              <CardTitle className="text-lg sm:text-2xl text-emerald-600">{platformHealth}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0 text-[10px] sm:text-xs text-muted-foreground flex items-center min-w-0"><ShieldCheck className="mr-1 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" /> <span className="truncate">Stable over 30 days</span></CardContent>
          </Card>
        </div>

        <div className="relative">
          <ChartAreaInteractive
            title="Reports Overview"
            description="Last 7 days"
            chartData={chartData?.length > 0 ? chartData : [{ name: 'Loading', reports: 0 }]}
            defaultTimeRange="7d"
            hideFilter={true}
            headerAction={
              <Link 
                href="/superadmin/analytics" 
                className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/50 px-3 py-1.5 rounded-full transition-colors"
              >
                Full Analytics <ArrowRight className="w-4 h-4" />
              </Link>
            }
            chartConfig={{
              views: {
                label: "Reports"
              },
              cebu_city: {
                label: "Cebu City",
                color: "#2563eb"
              },
              mandaue: {
                label: "Mandaue",
                color: "#10b981"
              },
              lapu_lapu: {
                label: "Lapu-Lapu",
                color: "#f59e0b"
              }
            }}
          />
        </div>
      </div>


    </div>
  )
}
