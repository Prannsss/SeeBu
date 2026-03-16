"use client";

import { Home, History, Search, User } from 'lucide-react';
import { InteractiveMenu, InteractiveMenuItem } from '@/components/ui/modern-mobile-menu';

const clientMenuItems: InteractiveMenuItem[] = [
  { label: 'Home', icon: Home, href: '/client' },
  { label: 'History', icon: History, href: '/client/history' }, // Placeholder for history
  { label: 'Track', icon: Search, href: '/client/tracking' },
  { label: 'Profile', icon: User, href: '/client/profile' },
];

export function ClientDock() {
  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:bottom-8 z-50 rounded-2xl bg-background/90 backdrop-blur-md border border-border shadow-xl md:w-max overflow-hidden">
      <InteractiveMenu 
        items={clientMenuItems} 
        className="w-full md:min-w-[400px] px-2"
      />
    </div>
  );
}
