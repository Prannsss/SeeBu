"use client";

import { Home, BarChart3, PlusCircle, User } from 'lucide-react';
import { InteractiveMenu, InteractiveMenuItem } from '@/components/ui/modern-mobile-menu';

const superadminMenuItems: InteractiveMenuItem[] = [
  { label: 'Home', icon: Home, href: '/superadmin/home' },
  { label: 'Analytics', icon: BarChart3, href: '/superadmin/analytics' },
  { label: 'Add', icon: PlusCircle, href: '/superadmin/add-x' },
  { label: 'Profile', icon: User, href: '/superadmin/profile' },
];

export function SuperadminDock() {
  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:bottom-8 z-50 rounded-2xl bg-background/90 backdrop-blur-md border border-border shadow-xl md:w-max overflow-hidden">
      <InteractiveMenu 
        items={superadminMenuItems} 
        className="w-full md:min-w-[400px] px-2"
      />
    </div>
  );
}
