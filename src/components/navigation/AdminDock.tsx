"use client";

import { useRouter } from "next/navigation";
import { Home, FileText, BarChart, UserPlus, User } from "lucide-react";
import Dock from "@/components/ui/dock";

export default function AdminDock() {
  const router = useRouter();

  const items = [
    { icon: <Home className="w-5 h-5" />, label: "Home", onClick: () => router.push('/admin') },
    { icon: <FileText className="w-5 h-5" />, label: "Reports", onClick: () => router.push('/admin/reports') },
    { icon: <BarChart className="w-5 h-5" />, label: "Analytics", onClick: () => router.push('/admin/analytics') },
    { icon: <UserPlus className="w-5 h-5" />, label: "Add Admin", onClick: () => router.push('/admin/add-admin') },
    { icon: <User className="w-5 h-5" />, label: "Profile", onClick: () => router.push('/admin/profile') },
  ];

  return (
    <div className="fixed bottom-0 left-0 w-full z-[100] pointer-events-none flex justify-center pb-4">
      <div className="pointer-events-auto relative h-20 w-full max-w-xl">
        <Dock items={items} />
      </div>
    </div>
  );
}
