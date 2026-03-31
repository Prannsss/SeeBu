"use client";

import { useRouter, usePathname } from "next/navigation";
import { LayoutDashboard, UserPlus, User, ClipboardList } from "lucide-react";
import Dock from "@/components/ui/dock";

export default function WorkforceAdminDock() {
  const router = useRouter();
  const pathname = usePathname();

  const items = [
    { icon: <LayoutDashboard className={`w-5 h-5 ${pathname === '/workforce-admin' ? 'text-white' : ''}`} />, label: "Dashboard", onClick: () => router.push('/workforce-admin'), className: pathname === '/workforce-admin' ? '!bg-primary dark:!bg-primary !border-primary !text-white dark:!text-white' : '' },
    { icon: <UserPlus className={`w-5 h-5 ${pathname === '/workforce-admin/add-officer' ? 'text-white' : ''}`} />, label: "Add Officer", onClick: () => router.push('/workforce-admin/add-officer'), className: pathname === '/workforce-admin/add-officer' ? '!bg-primary dark:!bg-primary !border-primary !text-white dark:!text-white' : '' },
    { icon: <ClipboardList className={`w-5 h-5 ${pathname === '/workforce-admin/tasks' ? 'text-white' : ''}`} />, label: "Tasks", onClick: () => router.push('/workforce-admin/tasks'), className: pathname === '/workforce-admin/tasks' ? '!bg-primary dark:!bg-primary !border-primary !text-white dark:!text-white' : '' },
    { icon: <User className={`w-5 h-5 ${pathname === '/workforce-admin/profile' ? 'text-white' : ''}`} />, label: "Profile", onClick: () => router.push('/workforce-admin/profile'), className: pathname === '/workforce-admin/profile' ? '!bg-primary dark:!bg-primary !border-primary !text-white dark:!text-white' : '' },
  ];

  return (
    <div className="fixed bottom-0 left-0 w-full z-[100] pointer-events-none flex justify-center pb-4">
      <div className="pointer-events-auto relative h-20 w-full max-w-xl">
        <Dock items={items} />
      </div>
    </div>
  );
}