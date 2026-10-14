"use client";

import { useCurrentUser } from "@/hooks/queries/useCurrentUser";
import GlobalPageSkeleton from "@/components/ui/global-page-skeleton";
import { ClientFeedWidget } from "./ClientFeedWidget";

export default function ClientDashboard() {
  const { data: user, isLoading } = useCurrentUser();

  return (
    <div className="relative min-h-screen overflow-hidden bg-white text-slate-900 pb-32 dark:bg-slate-950 dark:text-slate-100">
      {user?.id ? <ClientFeedWidget userId={user.id} /> : isLoading ? <GlobalPageSkeleton /> : null}
    </div>
  );
}
