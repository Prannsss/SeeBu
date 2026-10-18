import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, ClipboardList, ArrowRight, Users, UserPlus } from "lucide-react"
import { ChartAreaInteractive } from "@/components/ui/chart-area-interactive"
import Link from "next/link"
import { cookies } from "next/headers"
import { phToday, shiftDay } from "@/lib/ph-date"
import { greeting } from "@/lib/greeting"

const EMPTY_ADMIN_DATA = { name: null as string | null, openReports: 0, withDepartments: 0, departmentHeads: 0, deptWorkforce: 0, chartData: [] as any[] };

async function getAdminData() {
  const reqCookies = await cookies();
  const token = reqCookies.get("auth-token")?.value;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'development' ? "http://localhost:5000" : "https://seebu.onrender.com");
  // Each call resolves to null on failure so one slow/forbidden endpoint never blocks the rest.
  const getJson = (path: string) =>
    fetch(`${apiUrl}${path}`, { headers: { "Authorization": `Bearer ${token}` }, cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .catch(() => null);

  try {
    const profileData = await getJson('/api/v1/users/me');
    const municipalityId = profileData?.data?.municipality_id;
    const name: string | null = profileData?.data?.full_name ?? null;
    if (!municipalityId) return { ...EMPTY_ADMIN_DATA, name };

    const today = phToday();
    // One analytics call carries both the 30-day chart and the "open right now" counts;
    // departments (admin-scoped) carry the staff counts.
    const [analytics, departments] = await Promise.all([
      getJson(`/api/v1/analytics/admin/${municipalityId}?from=${shiftDay(today, -29)}&to=${today}`),
      getJson('/api/v1/departments?include_personnel=true'),
    ]);

    const activeStaff = (departments?.data || [])
      .flatMap((d: any) => d.personnel || [])
      .filter((p: any) => String(p.status || '').toLowerCase() === 'active');

    return {
      name,
      openReports: analytics?.openNow?.total ?? 0,
      withDepartments: analytics?.openNow?.inProgress ?? 0,
      departmentHeads: activeStaff.filter((p: any) => p.role === 'workforce-admin').length,
      deptWorkforce: activeStaff.filter((p: any) => p.role === 'workforce').length,
      chartData: analytics?.chartData || [],
    };
  } catch (error) {
    console.error("Error fetching admin data:", error);
    return EMPTY_ADMIN_DATA;
  }
}

export default async function AdminHomePage() {
  const data = await getAdminData();
  const { name, chartData, openReports, withDepartments, departmentHeads, deptWorkforce } = data;

  return (
    <div className="min-h-screen bg-white pb-32 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto max-w-6xl px-4 py-10">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">{greeting(name)}</h1>
            <p className="mt-1 text-slate-600">Operations overview, urgent cases, and workload signals.</p>
          </div>
          <Badge className="bg-blue-600 text-white">Live Monitoring</Badge>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {[
            { label: 'Open Reports', value: openReports, hint: 'Unresolved cases', icon: ClipboardList, chip: 'bg-sky-100 text-sky-800' },
            { label: 'Delegated', value: withDepartments, hint: 'With departments now', icon: AlertTriangle, chip: 'bg-red-100 text-red-800' },
            { label: 'Department Heads', value: departmentHeads, hint: 'Workforce admins in your area', icon: UserPlus, chip: 'bg-emerald-100 text-emerald-600' },
            { label: 'Dept. Workforce', value: deptWorkforce, hint: 'Across departments', icon: Users, chip: 'bg-indigo-100 text-indigo-800' },
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
            description="Last 30 days"
            chartData={chartData}
            headerAction={
              <Link 
                href="/admin/analytics" 
                className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/50 px-3 py-1.5 rounded-md transition-colors"
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
