"use client";

import { useCurrentUser } from "@/hooks/queries/useCurrentUser";
import GlobalPageSkeleton from "@/components/ui/global-page-skeleton";
import { WorkforceTasksWidget } from "./WorkforceTasksWidget";

export default function WorkforceTasks() {
  const { data: user, isLoading } = useCurrentUser();

  return (
    <div className="relative min-h-screen">
      {user?.id ? <WorkforceTasksWidget userId={user.id} /> : isLoading ? <GlobalPageSkeleton /> : null}
    </div>
  );
}
