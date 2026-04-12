import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, CheckCircle2, TrendingUp, AlertCircle } from "lucide-react";
import { getUserProfile } from "../actions/user.actions";
import { cookies } from "next/headers";

async function getWorkforceTasks(userId: string) {
  const reqCookies = await cookies();
  const token = reqCookies.get("auth-token")?.value;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  
  try {
    const res = await fetch(`${apiUrl}/api/v1/tasks?delegated_to=${userId}`, {
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
  
  // Calculate specific task counts
  const activeAssignments = tasks.filter((t: any) => t.status === "Assigned" || t.status === "Accepted").length;
  
  // Tasks completed today
  const today = new Date().toDateString();
  const completedToday = tasks.filter((t: any) => {
    if (t.status !== "Resolved") return false;
    const completedDate = new Date(t.updated_at || t.created_at).toDateString();
    return completedDate === today;
  }).length;
  
  // Pending alerts (High or Emergency priority tasks that aren't resolved)
  // Assuming priority isn't in tasks directly or defaults to counting all assigned
  const pendingAlerts = tasks.filter((t: any) => t.status === "Assigned").length;
  
  // Simple efficiency rating formula: (completed / total assigned) * 100
  const totalHandled = activeAssignments + completedToday;
  const efficiency = totalHandled > 0 ? Math.round((completedToday / totalHandled) * 100) : 0;

  return (
    <div className="min-h-screen bg-white pb-32 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
    <div className="container mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workforce Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of your daily assignments and performance.</p>
        </div>
        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-400">
          On Duty
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-2">
            <CardDescription className="text-xs sm:text-sm truncate" title="Active Assignments">Active Assignments</CardDescription>
            <CardTitle className="text-lg sm:text-2xl text-blue-600 dark:text-blue-400">{activeAssignments}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            <div className="text-[10px] sm:text-xs text-muted-foreground flex items-center min-w-0" title="In progress today">
              <Briefcase className="mr-1 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="truncate">In progress today</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-2">
            <CardDescription className="text-xs sm:text-sm truncate" title="Completed Today">Completed Today</CardDescription>
            <CardTitle className="text-lg sm:text-2xl text-emerald-600 dark:text-emerald-400">{completedToday}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            <div className="text-[10px] sm:text-xs text-muted-foreground flex items-center min-w-0" title="Tasks resolved">
              <CheckCircle2 className="mr-1 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="truncate">Tasks resolved</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-2">
            <CardDescription className="text-xs sm:text-sm truncate" title="Efficiency Rating">Efficiency Rating</CardDescription>
            <CardTitle className="text-lg sm:text-2xl text-indigo-600 dark:text-indigo-400">{efficiency}%</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            <div className="text-[10px] sm:text-xs text-muted-foreground flex items-center min-w-0" title={`${efficiency}% completion rate`}>
              <TrendingUp className="mr-1 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 text-emerald-500" />
              <span className="truncate">{efficiency}% completion rate</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-2">
            <CardDescription className="text-xs sm:text-sm truncate" title="Pending Alerts">Pending Alerts</CardDescription>
            <CardTitle className="text-lg sm:text-2xl text-red-600 dark:text-red-400">{pendingAlerts}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            <div className="text-[10px] sm:text-xs text-muted-foreground flex items-center min-w-0" title="Requires attention">
              <AlertCircle className="mr-1 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="truncate">Requires attention</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-1">
        <Card>
          <CardHeader>
            <CardTitle>Recent Announcements</CardTitle>
            <CardDescription className="text-xs sm:text-sm truncate" title="Updates from administration">Updates from administration</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="rounded-lg border p-3">
                <div className="font-medium">Safety Gear Protocol</div>
                <div className="text-sm text-muted-foreground mt-1">Please ensure all high-visibility vests are worn during road repairs.</div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="font-medium">Schedule Update</div>
                <div className="text-sm text-muted-foreground mt-1">Shift changes for the upcoming holiday weekend have been posted.</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </div>
  );
}
