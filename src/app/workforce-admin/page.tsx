import { Users, ClipboardList, CheckCircle, TrendingUp, Shield } from "lucide-react"
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

    const departmentsRes = await fetch(`${apiUrl}/api/v1/departments`, {
      headers: { "Authorization": `Bearer ${token}` },
      cache: 'no-store'
    });
    const departmentsData = await departmentsRes.json();
    const departmentName = (departmentsData?.data || []).find((d: any) => String(d.id) === String(deptId))?.name || `Department ${deptId}`;

    // Fetch department personnel and keep only active workforce officers.
    const personnelRes = await fetch(`${apiUrl}/api/v1/departments/${deptId}/personnel`, {
      headers: { "Authorization": `Bearer ${token}` },
      cache: 'no-store'
    });
    const personnelData = await personnelRes.json();
    const headcount = (personnelData?.data || []).filter((u: any) => u.role === 'workforce' && String(u.status || '').toLowerCase() === 'active').length;

    // Fetch tasks delegated to this department by admin/superadmin.
    const taskRes = await fetch(`${apiUrl}/api/v1/tasks?delegated_to=${deptId}`, {
      headers: { "Authorization": `Bearer ${token}` },
      cache: 'no-store'
    });
    const tasksData = await taskRes.json();
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
            <Shield className="h-6 w-6 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Workforce Admin</h1>
            <p className="text-muted-foreground">Department: {departmentName || user?.department_id || 'Global'}</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
            <Card>
              <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-2">
                <CardDescription className="text-xs sm:text-sm truncate">Active Tasks</CardDescription>
                <CardTitle className="text-lg sm:text-3xl text-blue-600">{activeTasks}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0 text-[10px] sm:text-sm text-muted-foreground flex items-center gap-2">
                <ClipboardList className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" /> <span className="truncate">Active tasks across workforce</span>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-2">
                <CardDescription className="text-xs sm:text-sm truncate">Dept. Headcount</CardDescription>
                <CardTitle className="text-lg sm:text-3xl text-indigo-600">{headcount}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0 text-[10px] sm:text-sm text-muted-foreground flex items-center gap-2">
                <Users className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" /> <span className="truncate">Available field officers</span>
              </CardContent>
            </Card>

            <Card className="col-span-2 lg:col-span-1">
              <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-2">
                <CardDescription className="text-xs sm:text-sm truncate">Completed Today</CardDescription>
                <CardTitle className="text-lg sm:text-3xl text-emerald-600">{completedToday}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0 text-[10px] sm:text-sm text-muted-foreground flex items-center gap-2">
                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" /> <TrendingUp className="w-3 h-3 text-emerald-500 flex-shrink-0"/> <span className="truncate">Tasks successfully resolved</span>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Task Analytics</CardTitle>
              <CardDescription>Recent completed tasks metrics</CardDescription>
            </CardHeader>
            <CardContent className="h-64 flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/50 dark:bg-slate-900/50">
              <p className="text-muted-foreground">Detailed chart integration goes here...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
