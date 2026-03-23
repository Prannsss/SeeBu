"use client";

import { useRouter, usePathname } from "next/navigation";
import { Home, FileText, BarChart, UserPlus, User } from "lucide-react";
import Dock from "@/components/ui/dock";

export default function AdminDock() {
  const router = useRouter();
  const pathname = usePathname();

  const items = [
    { icon: <Home className={`w-5 h-5 ${pathname === '/admin' ? 'text-white' : ''}`} />, label: "Home", onClick: () => router.push('/admin'), className: pathname === '/admin' ? '!bg-primary dark:!bg-primary !border-primary !text-white dark:!text-white' : '' },
    { icon: <FileText className={`w-5 h-5 ${pathname === '/admin/reports' ? 'text-white' : ''}`} />, label: "Reports", onClick: () => router.push('/admin/reports'), className: pathname === '/admin/reports' ? '!bg-primary dark:!bg-primary !border-primary !text-white dark:!text-white' : '' },
    { icon: <BarChart className={`w-5 h-5 ${pathname === '/admin/analytics' ? 'text-white' : ''}`} />, label: "Analytics", onClick: () => router.push('/admin/analytics'), className: pathname === '/admin/analytics' ? '!bg-primary dark:!bg-primary !border-primary !text-white dark:!text-white' : '' },
    { icon: <UserPlus className={`w-5 h-5 ${pathname === '/admin/add-admin' ? 'text-white' : ''}`} />, label: "Add Admin", onClick: () => router.push('/admin/add-admin'), className: pathname === '/admin/add-admin' ? '!bg-primary dark:!bg-primary !border-primary !text-white dark:!text-white' : '' },
    { icon: <User className={`w-5 h-5 ${pathname === '/admin/profile' ? 'text-white' : ''}`} />, label: "Profile", onClick: () => router.push('/admin/profile'), className: pathname === '/admin/profile' ? '!bg-primary dark:!bg-primary !border-primary !text-white dark:!text-white' : '' },
  ];

  return (
    <div className="fixed bottom-0 left-0 w-full z-[100] pointer-events-none flex justify-center pb-4">
      <div className="pointer-events-auto relative h-20 w-full max-w-xl">
        <Dock items={items} />
      </div>
    </div>
  );
}
