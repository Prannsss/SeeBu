"use client";

import { useRouter } from "next/navigation";
import { Home, BarChart, PlusCircle, User } from "lucide-react";
import Dock from "@/components/ui/dock";

export default function SuperadminDock() {
  const router = useRouter();

  const items = [
    { icon: <Home className="w-5 h-5" />, label: "Home", onClick: () => router.push('/superadmin') },
    { icon: <BarChart className="w-5 h-5" />, label: "Analytics", onClick: () => router.push('/superadmin/analytics') },
    { icon: <PlusCircle className="w-5 h-5" />, label: "Add", onClick: () => router.push('/superadmin/add-x') },
    { icon: <User className="w-5 h-5" />, label: "Profile", onClick: () => router.push('/superadmin/profile') },
  ];

  return (
    <div className="fixed bottom-0 left-0 w-full z-[100] pointer-events-none flex justify-center pb-4">
      <div className="pointer-events-auto relative h-20 w-full max-w-xl">
        <Dock items={items} />
      </div>
    </div>
  );
}
