"use client";

import { useRouter } from "next/navigation";
import { Home, ClipboardList, User } from "lucide-react";
import Dock from "@/components/ui/dock";

export default function WorkforceDock() {
  const router = useRouter();

  const items = [
    { icon: <Home className="w-5 h-5" />, label: "Home", onClick: () => router.push('/workforce') },
    { icon: <ClipboardList className="w-5 h-5" />, label: "Tasks", onClick: () => router.push('/workforce/tasks') },
    { icon: <User className="w-5 h-5" />, label: "Profile", onClick: () => router.push('/workforce/profile') },
  ];

  return (
    <div className="fixed bottom-0 left-0 w-full z-[100] pointer-events-none flex justify-center pb-4">
      <div className="pointer-events-auto relative h-20 w-full max-w-xl">
        <Dock items={items} />
      </div>
    </div>
  );
}