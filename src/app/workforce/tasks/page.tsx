import { getUserProfile } from "@/app/actions/user.actions";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/query-client";
import { apiFetch } from "@/lib/api";
import { WorkforceTasksWidget } from "./WorkforceTasksWidget";

export default async function WorkforceTasks() {
  const user = await getUserProfile();
  
  const queryClient = getQueryClient();

  if (user?.id) {
    await queryClient.prefetchQuery({
      queryKey: ["tasks", { assigned_to: user.id }],
      queryFn: async () => {
        const data = await apiFetch<{ data: any[] }>(`/api/v1/tasks?assigned_to=${user.id}`);
        return data.data || [];
      }
    });
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="relative min-h-screen">
        {user?.id ? (
          <WorkforceTasksWidget userId={user.id} />
        ) : null}
      </div>
    </HydrationBoundary>
  );
}
