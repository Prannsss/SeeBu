"use client";

import { Home, FileText, BarChart3, PlusCircle, User } from 'lucide-react';
import { InteractiveMenu, InteractiveMenuItem } from '@/components/ui/modern-mobile-menu';

const adminMenuItems: InteractiveMenuItem[] = [
  { label: 'Home', icon: Home, href: '/admin/home' },
  { label: 'Reports', icon: FileText, href: '/admin/reports' },
  { label: 'Analytics', icon: BarChart3, href: '/admin/analytics' },
  { label: 'Add', icon: PlusCircle, href: '/admin/add-admin' },
  { label: 'Profile', icon: User, href: '/admin/profile' },
];

export function AdminDock() {
  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:bottom-8 z-50 rounded-2xl bg-background/90 backdrop-blur-md border border-border shadow-xl md:w-max overflow-hidden">
      <InteractiveMenu 
        items={adminMenuItems} 
        className="w-full md:min-w-[450px] px-2"
      />
    </div>
  );
}
