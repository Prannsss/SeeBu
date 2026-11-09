
import type {Metadata} from 'next';
import { Montserrat, Playfair_Display } from 'next/font/google';
import { Suspense } from 'react';
import './globals.css';
import 'goey-toast/styles.css';
import GooeyToasterProvider from '@/components/providers/gooey-toaster-provider';
import { NavigationHistoryProvider } from '@/components/providers/navigation-history-provider';
import { QueryProvider } from '@/components/providers/query-provider';
import GlobalPageSkeleton from '../components/ui/global-page-skeleton';

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-montserrat',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-playfair',
  display: 'swap',
});

// Material Symbols, trimmed to the icons SeeBu uses at one weight: ~15 KB instead of the 1.1 MB
// variable font, which was holding up the first paint on mobile. When you use a new icon, add its
// name here; Google requires the list in alphabetical order.
const MATERIAL_ICONS = [
  'account_balance', 'add_a_photo', 'add_business', 'admin_panel_settings', 'alt_route', 'analytics',
  'arrow_forward', 'assignment_ind', 'badge', 'call', 'campaign', 'check', 'check_circle', 'construction',
  'corporate_fare', 'description', 'domain', 'edit', 'emergency', 'engineering', 'expand_more', 'explore',
  'fact_check', 'groups', 'help', 'how_to_reg', 'info', 'install_mobile', 'location_city', 'location_on',
  'lock', 'mail', 'manage_search', 'map', 'my_location', 'notifications_active', 'park', 'password',
  'person', 'phone', 'photo_camera', 'pin', 'place', 'power', 'recycling', 'school', 'settings_suggest',
  'shield_person', 'star', 'supervisor_account', 'task_alt', 'timeline', 'title', 'traffic', 'verified',
  'volunteer_activism',
];
const MATERIAL_SYMBOLS_URL = `https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&icon_names=${[...MATERIAL_ICONS].sort().join(',')}&display=swap`;

export const metadata: Metadata = {
  title: 'SeeBu | Build a Smarter Cebu City',
  description: 'The digital bridge for Cebu City citizens and local government to collaborate on urban improvements.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`scroll-smooth ${montserrat.variable} ${playfair.variable}`} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* oxlint-disable-next-line nextjs/no-page-custom-font -- App Router root layout loads it on every page (the rule targets pages/_document) */}
        <link href={MATERIAL_SYMBOLS_URL} rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-background text-foreground selection:bg-primary/30" suppressHydrationWarning>
        <QueryProvider>
          <NavigationHistoryProvider>
            <Suspense fallback={<GlobalPageSkeleton />}>
              {children}
            </Suspense>
            <GooeyToasterProvider />
          </NavigationHistoryProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
