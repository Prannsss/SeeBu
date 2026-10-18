import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, CheckCircle2, TrendingUp, AlertCircle, HardHat } from "lucide-react";
import { greeting } from "@/lib/greeting";
import { getUserProfile } from "../actions/user.actions";
import { cookies } from "next/headers";

async function getWorkforceTasks(userId: string) {
  const reqCookies = await cookies();
  const token = reqCookies.get("auth-token")?.value;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'development' ? "http://localhost:5000" : "https://seebu.onrender.com");
  
  try {
    const res = await fetch(`${apiUrl}/api/v1/tasks?assigned_to=${userId}`, {
      headers: {
        "Authorization": `Bearer ${token}`
      },
      cache: 'no-store'
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return [];
  }
}

export default async function WorkforceDashboard() {
  const user = await getUserProfile();
  const tasks = user ? await getWorkforceTasks(user.id) : [];
  
  const normalizedTasks = Array.isArray(tasks) ? tasks : [];
  const statusOf = (task: any) => String(task?.status || "").trim().toLowerCase();

  // Active work queue for current workforce officer.
  const activeAssignments = normalizedTasks.filter((t: any) => {
    const status = statusOf(t);
    return status === "assigned" || status === "pending" || status === "accepted" || status === "in progress";
  }).length;
  
  // Tasks completed today
  const today = new Date().toDateString();
  const completedToday = normalizedTasks.filter((t: any) => {
    if (statusOf(t) !== "completed") return false;
    const completedDate = new Date(t.completed_at || t.updated_at || t.created_at).toDateString();
    return completedDate === today;
  }).length;
  
  // Pending alerts: high-priority items that are not yet completed.
  const pendingAlerts = normalizedTasks.filter((t: any) => {
    const status = statusOf(t);
    const priority = String(t?.priority || "").trim().toLowerCase();
    const isOutstanding = status !== "completed";
    const isHighPriority = priority === "high" || priority === "urgent" || priority === "critical";
    return isOutstanding && isHighPriority;
  }).length;
  
  // Efficiency rating: completed vs total tasks assigned to this officer.
  const completedTotal = normalizedTasks.filter((t: any) => statusOf(t) === "completed").length;
  const efficiency = normalizedTasks.length > 0
    ? Math.round((completedTotal / normalizedTasks.length) * 100)
    : 0;

  const activeSubtitle = activeAssignments > 0
    ? `${activeAssignments} active assignment${activeAssignments === 1 ? "" : "s"} in queue`
    : "No active assignments right now";
  const completedSubtitle = completedToday > 0
    ? `${completedToday} task${completedToday === 1 ? "" : "s"} resolved today`
    : "No tasks resolved today";
  const efficiencySubtitle = normalizedTasks.length > 0
    ? `${completedTotal}/${normalizedTasks.length} tasks completed overall`
    : "No assigned tasks yet";
  const pendingSubtitle = pendingAlerts > 0
    ? `${pendingAlerts} high-priority alert${pendingAlerts === 1 ? "" : "s"} require attention`
    : "No high-priority alerts";

  return (
    <div className="min-h-screen bg-white pb-32 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
    <div className="container mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50">
            <HardHat className="h-6 w-6 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">{greeting(user?.full_name)}</h1>
            <p className="text-slate-600 mt-1">Overview of your daily assignments and performance.</p>
          </div>
        </div>
        <Badge className="bg-emerald-600 text-white hover:bg-emerald-800">
          On Duty
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4 mb-8">
        {[
          { label: 'Active Assignments', value: activeAssignments, hint: activeSubtitle, icon: Briefcase, chip: 'bg-sky-100 text-sky-800' },
          { label: 'Completed Today', value: completedToday, hint: completedSubtitle, icon: CheckCircle2, chip: 'bg-emerald-100 text-emerald-600' },
          { label: 'Efficiency Rating', value: `${efficiency}%`, hint: efficiencySubtitle, icon: TrendingUp, chip: 'bg-indigo-100 text-indigo-800' },
          { label: 'Pending Alerts', value: pendingAlerts, hint: pendingSubtitle, icon: AlertCircle, chip: 'bg-red-100 text-red-800' },
        ].map(({ label, value, hint, icon: Icon, chip }) => (
          <Card key={label}>
            <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-2">
              <div className="flex items-center justify-between gap-2">
                <CardDescription className="text-sm font-medium text-slate-600 truncate" title={label}>{label}</CardDescription>
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${chip}`}><Icon className="h-4 w-4" aria-hidden="true" /></span>
              </div>
              <CardTitle className="text-2xl sm:text-3xl font-bold text-slate-900">{value}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
              <div className="text-xs sm:text-sm text-slate-600 truncate" title={hint}>{hint}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
    </div>
  );
}
