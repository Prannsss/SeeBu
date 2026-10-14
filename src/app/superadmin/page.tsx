import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ShieldCheck, Users, UserCog, HardHat, ArrowRight } from "lucide-react"
import { ChartAreaInteractive } from "@/components/ui/chart-area-interactive"
import Link from "next/link"
import { cookies } from "next/headers"

async function getSuperadminData() {
  const reqCookies = await cookies();
  const token = reqCookies.get("auth-token")?.value;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'development' ? "http://localhost:5000" : "https://seebu.onrender.com");

  const getJson = (path: string) =>
    fetch(`${apiUrl}${path}`, { headers: { "Authorization": `Bearer ${token}` }, cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .catch(() => null);

  try {
    const [analyticsData, usersData] = await Promise.all([
      getJson('/api/v1/analytics/superadmin'),
      getJson('/api/v1/users'),
    ]);
    const analytics = analyticsData || { chartData: [] };
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
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">Superadmin Home</h1>
            <p className="mt-1 text-slate-600">System-wide visibility, governance, and platform health analytics.</p>
          </div>
          <Badge className="bg-blue-600 text-white">Global Scope</Badge>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {[
            { label: 'Total Clients', value: totalClients.toLocaleString(), hint: 'Active citizens', icon: Users, chip: 'bg-sky-100 text-sky-800' },
            { label: 'Total Admins', value: totalAdmins.toLocaleString(), hint: 'Across municipalities', icon: UserCog, chip: 'bg-emerald-100 text-emerald-600' },
            { label: 'Total Workforce', value: totalWorkforce.toLocaleString(), hint: 'Officers & Depts', icon: HardHat, chip: 'bg-indigo-100 text-indigo-800' },
            { label: 'Platform Health', value: platformHealth, hint: 'Stable over 30 days', icon: ShieldCheck, chip: 'bg-emerald-100 text-emerald-600' },
          ].map(({ label, value, hint, icon: Icon, chip }) => (
            <Card key={label}>
              <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-2">
                <div className="flex items-center justify-between gap-2">
                  <CardDescription className="text-sm font-medium text-slate-600 truncate" title={label}>{label}</CardDescription>
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${chip}`}><Icon className="h-4 w-4" aria-hidden="true" /></span>
                </div>
                <CardTitle className="text-2xl sm:text-3xl font-bold text-slate-900">{value}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0 text-xs sm:text-sm text-slate-600 truncate">{hint}</CardContent>
            </Card>
          ))}
        </div>

        <div className="relative">
          <ChartAreaInteractive
            title="Reports Overview"
            description="Last 7 days"
            chartData={chartData?.length > 0 ? chartData : [{ date: new Date().toISOString().split('T')[0], reports: 0, resolved: 0 }]}
            defaultTimeRange="7d"
            hideFilter={true}
            headerAction={
              <Link 
                href="/superadmin/analytics" 
                className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/50 px-3 py-1.5 rounded-md transition-colors"
              >
                Full Analytics <ArrowRight className="w-4 h-4" />
              </Link>
            }
            chartConfig={{
              reports: {
                label: "Total Reports",
                color: "#2563eb",
              },
              resolved: {
                label: "Resolved",
                color: "#10b981",
              },
            }}
          />
        </div>
      </div>


    </div>
  )
}
