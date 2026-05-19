import { getUserProfile } from "@/app/actions/user.actions";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/query-client";
import { apiFetch } from "@/lib/api";
import { ClientFeedWidget } from "./ClientFeedWidget";

export default async function ClientDashboard() {
  const user = await getUserProfile();
  
  // 1. Initialize SSR Query Client
  const queryClient = getQueryClient();

  if (user?.id) {
    // 2. Prefetch the reports data boundary on the server
    await queryClient.prefetchQuery({
      queryKey: ["reports", { reporter_id: user.id }],
      queryFn: async () => {
        const data = await apiFetch<{ data: any[] }>(`/api/v1/reports?reporter_id=${user.id}`);
        return data.data || [];
      }
    });
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="relative min-h-screen overflow-hidden bg-white text-slate-900 pb-32 dark:bg-slate-950 dark:text-slate-100">
        
        {user?.id ? (
          <ClientFeedWidget userId={user.id} />
        ) : null}

      </div>
    </HydrationBoundary>
  );
}
