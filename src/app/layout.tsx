
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
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
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
