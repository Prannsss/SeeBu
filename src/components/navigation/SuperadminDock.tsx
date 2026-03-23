"use client";

import { useRouter, usePathname } from "next/navigation";
import { Home, BarChart, PlusCircle, User } from "lucide-react";
import Dock from "@/components/ui/dock";

export default function SuperadminDock() {
  const router = useRouter();
  const pathname = usePathname();

  const items = [
    { icon: <Home className={`w-5 h-5 ${pathname === '/superadmin' ? 'text-white' : ''}`} />, label: "Home", onClick: () => router.push('/superadmin'), className: pathname === '/superadmin' ? '!bg-primary dark:!bg-primary !border-primary !text-white dark:!text-white' : '' },
    { icon: <BarChart className={`w-5 h-5 ${pathname === '/superadmin/analytics' ? 'text-white' : ''}`} />, label: "Analytics", onClick: () => router.push('/superadmin/analytics'), className: pathname === '/superadmin/analytics' ? '!bg-primary dark:!bg-primary !border-primary !text-white dark:!text-white' : '' },
    { icon: <PlusCircle className={`w-5 h-5 ${pathname === '/superadmin/add-x' ? 'text-white' : ''}`} />, label: "Add", onClick: () => router.push('/superadmin/add-x'), className: pathname === '/superadmin/add-x' ? '!bg-primary dark:!bg-primary !border-primary !text-white dark:!text-white' : '' },
    { icon: <User className={`w-5 h-5 ${pathname === '/superadmin/profile' ? 'text-white' : ''}`} />, label: "Profile", onClick: () => router.push('/superadmin/profile'), className: pathname === '/superadmin/profile' ? '!bg-primary dark:!bg-primary !border-primary !text-white dark:!text-white' : '' },
  ];

  return (
    <div className="fixed bottom-0 left-0 w-full z-[100] pointer-events-none flex justify-center pb-4">
      <div className="pointer-events-auto relative h-20 w-full max-w-xl">
        <Dock items={items} />
      </div>
    </div>
  );
}
