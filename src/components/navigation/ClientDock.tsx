"use client";

import { useRouter, usePathname } from "next/navigation";
import { Home, History, MapPin, AlertCircle, User } from "lucide-react";
import Dock from "@/components/ui/dock";

export default function ClientDock() {
  const router = useRouter();
  const pathname = usePathname();

  const items = [
    { icon: <Home className={`w-5 h-5 ${pathname === '/client' ? 'text-white' : ''}`} />, label: "Home", onClick: () => router.push('/client'), className: pathname === '/client' ? '!bg-primary dark:!bg-primary !border-primary !text-white dark:!text-white' : '' },
    { icon: <History className={`w-5 h-5 ${pathname === '/client/history' ? 'text-white' : ''}`} />, label: "History", onClick: () => router.push('/client/history'), className: pathname === '/client/history' ? '!bg-primary dark:!bg-primary !border-primary !text-white dark:!text-white' : '' },
    { icon: <MapPin className={`w-5 h-5 ${pathname === '/client/tracking' ? 'text-white' : ''}`} />, label: "Tracking", onClick: () => router.push('/client/tracking'), className: pathname === '/client/tracking' ? '!bg-primary dark:!bg-primary !border-primary !text-white dark:!text-white' : '' },
    { icon: <AlertCircle className={`w-5 h-5 ${pathname === '/client/report' ? 'text-white' : ''}`} />, label: "Report", onClick: () => router.push('/client/report'), className: pathname === '/client/report' ? '!bg-primary dark:!bg-primary !border-primary !text-white dark:!text-white' : '' },
    { icon: <User className={`w-5 h-5 ${pathname === '/client/profile' ? 'text-white' : ''}`} />, label: "Profile", onClick: () => router.push('/client/profile'), className: pathname === '/client/profile' ? '!bg-primary dark:!bg-primary !border-primary !text-white dark:!text-white' : '' },
  ];

  const isReportPage = pathname === '/client/report';

  return (
    <div className={`fixed bottom-0 left-0 w-full z-[100] pointer-events-none flex justify-center pb-4 ${isReportPage ? 'md:hidden' : ''}`}>
      <div className="pointer-events-auto relative h-20 w-full max-w-xl">
        <Dock items={items} />
      </div>
    </div>
  );
}
