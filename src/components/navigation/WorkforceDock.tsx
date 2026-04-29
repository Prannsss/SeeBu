"use client";

import { useRouter, usePathname } from "next/navigation";
import { Home, ClipboardList, User, ShieldCheck } from "lucide-react";
import Dock from "@/components/ui/dock";

export default function WorkforceDock() {
  const router = useRouter();
  const pathname = usePathname();

  const items = [
    { icon: <Home className={`w-5 h-5 ${pathname === '/workforce' ? 'text-white' : ''}`} />, label: "Home", onClick: () => router.push('/workforce'), className: pathname === '/workforce' ? '!bg-primary dark:!bg-primary !border-primary !text-white dark:!text-white' : '' },
    { icon: <ClipboardList className={`w-5 h-5 ${pathname === '/workforce/tasks' ? 'text-white' : ''}`} />, label: "Tasks", onClick: () => router.push('/workforce/tasks'), className: pathname === '/workforce/tasks' ? '!bg-primary dark:!bg-primary !border-primary !text-white dark:!text-white' : '' },
    { icon: <User className={`w-5 h-5 ${pathname === '/workforce/profile' ? 'text-white' : ''}`} />, label: "Profile", onClick: () => router.push('/workforce/profile'), className: pathname === '/workforce/profile' ? '!bg-primary dark:!bg-primary !border-primary !text-white dark:!text-white' : '' },
  ];

  return (
    <div className="fixed bottom-0 left-0 w-full z-[49] pointer-events-none flex justify-center pb-4">
      <div className="pointer-events-auto relative h-20 w-full max-w-xl">
        <Dock items={items} />
      </div>
    </div>
  );
}