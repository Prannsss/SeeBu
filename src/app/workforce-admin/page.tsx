import { Users, ClipboardList, CheckCircle, Shield } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cookies } from "next/headers";

async function getWorkforceAdminStats() {
  const reqCookies = await cookies();
  const token = reqCookies.get("auth-token")?.value;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'development' ? "http://localhost:5000" : "https://seebu.onrender.com");
  
  try {
    const profileRes = await fetch(`${apiUrl}/api/v1/users/me`, {
      headers: { "Authorization": `Bearer ${token}` },
      cache: 'no-store'
    });
    const profileData = await profileRes.json();
    const deptId = profileData?.data?.department_id;

    if (!deptId) return { activeTasks: 0, headcount: 0, completedToday: 0, departmentName: 'Global' };

    const getJson = (path: string) =>
      fetch(`${apiUrl}${path}`, { headers: { "Authorization": `Bearer ${token}` }, cache: 'no-store' })
        .then((res) => res.json())
        .catch(() => null);

    // Independent fetches run in parallel.
    const [departmentsData, personnelData, tasksData] = await Promise.all([
      getJson('/api/v1/departments'),
      // Department personnel; keep only active workforce officers.
      getJson(`/api/v1/departments/${deptId}/personnel`),
      // Tasks delegated to this department by admin/superadmin.
      getJson(`/api/v1/tasks?delegated_to=${deptId}`),
    ]);
    const departmentName = (departmentsData?.data || []).find((d: any) => String(d.id) === String(deptId))?.name || `Department ${deptId}`;
    const headcount = (personnelData?.data || []).filter((u: any) => u.role === 'workforce' && String(u.status || '').toLowerCase() === 'active').length;
    const tasks = tasksData?.data || [];

    const activeTasks = tasks.filter((t: any) => ["Pending", "Assigned", "Accepted", "In Progress"].includes(t.status)).length;
    
    const today = new Date().toDateString();
    const completedToday = tasks.filter((t: any) => {
      if (t.status !== "Completed") return false;
      const completedDate = new Date(t.completed_at || t.updated_at || t.created_at).toDateString();
      return completedDate === today;
    }).length;

    return { activeTasks, headcount, completedToday, user: profileData.data, departmentName };
  } catch (error) {
    console.error("Error fetching stats:", error);
    return { activeTasks: 0, headcount: 0, completedToday: 0, user: null, departmentName: 'Global' };
  }
}

export default async function WorkforceAdminPage() {
  const { activeTasks, headcount, completedToday, user, departmentName } = await getWorkforceAdminStats();

  return (
    <div className="min-h-screen bg-slate-50 pb-32 dark:bg-slate-950 dark:text-slate-100">
      <div className="container mx-auto max-w-5xl px-5 pt-10 pb-6">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/50">
            <Shield className="h-6 w-6 text-orange-700 dark:text-orange-400" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">Workforce Admin</h1>
            <p className="text-slate-600">Department: {departmentName || user?.department_id || 'Global'}</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3">
            {[
              { label: 'Active Tasks', value: activeTasks, hint: 'Active tasks across workforce', icon: ClipboardList, chip: 'bg-sky-100 text-sky-800', span: '' },
              { label: 'Dept. Headcount', value: headcount, hint: 'Available field officers', icon: Users, chip: 'bg-indigo-100 text-indigo-800', span: '' },
              { label: 'Completed Today', value: completedToday, hint: 'Tasks successfully resolved', icon: CheckCircle, chip: 'bg-emerald-100 text-emerald-600', span: 'col-span-2 lg:col-span-1' },
            ].map(({ label, value, hint, icon: Icon, chip, span }) => (
              <Card key={label} className={span}>
                <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <CardDescription className="text-sm font-medium text-slate-600 truncate">{label}</CardDescription>
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${chip}`}><Icon className="h-4 w-4" aria-hidden="true" /></span>
                  </div>
                  <CardTitle className="text-2xl sm:text-3xl font-bold text-slate-900">{value}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0 text-xs sm:text-sm text-slate-600 truncate">{hint}</CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Task Analytics</CardTitle>
              <CardDescription>Recent completed tasks metrics</CardDescription>
            </CardHeader>
            <CardContent className="h-64 flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/50 dark:bg-slate-900/50">
              <p className="text-slate-600">Detailed chart integration goes here...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
