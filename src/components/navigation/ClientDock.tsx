"use client";

import { useRouter, usePathname } from "next/navigation";
import { Home, History, MapPin, AlertCircle, User } from "lucide-react";
import Dock from "@/components/ui/dock";

export default function ClientDock() {
  const router = useRouter();
  const pathname = usePathname();

  const items = [
    { icon: <Home className="w-5 h-5" />, label: "Home", onClick: () => router.push('/client') },
    { icon: <History className="w-5 h-5" />, label: "History", onClick: () => router.push('/client/history') },
    { icon: <MapPin className="w-5 h-5" />, label: "Tracking", onClick: () => router.push('/client/tracking') },
    { icon: <AlertCircle className="w-5 h-5" />, label: "Report", onClick: () => router.push('/client/report') },
    { icon: <User className="w-5 h-5" />, label: "Profile", onClick: () => router.push('/client/profile') },
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
