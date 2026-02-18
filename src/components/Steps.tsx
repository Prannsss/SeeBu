"use client";

import { useScrollAnimation } from '@/hooks/use-scroll-animation';

export function Steps() {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section className="py-20 bg-background-light dark:bg-gray-900 transition-colors" id="process">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-primary font-bold tracking-widest text-xs uppercase mb-2 block">The Process</span>
          <h2 className="text-3xl lg:text-4xl font-black text-text-main dark:text-white">Simple 3-Step Process</h2>
          <p className="mt-4 text-text-muted dark:text-gray-400 max-w-2xl mx-auto">Reporting issues and tracking their resolution has never been easier. We&apos;ve streamlined civic engagement.</p>
        </div>
        <div 
          ref={ref}
          className={`grid md:grid-cols-3 gap-8 relative fade-in-section ${isVisible ? 'is-visible' : ''}`}
        >
          {/* Connecting Line (Desktop) */}
          <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-1 rounded-full bg-primary/30 z-0"></div>
          {/* Step 1 */}
          <div className="relative z-10 flex flex-col items-center text-center group">
            <div className="w-24 h-24 bg-white dark:bg-gray-800 border-4 border-blue-100 dark:border-gray-700 rounded-full flex items-center justify-center shadow-lg mb-6 group-hover:border-primary group-hover:bg-primary transition-colors duration-300">
              <span className="material-symbols-outlined text-4xl text-primary group-hover:text-white transition-colors">add_a_photo</span>
            </div>
            <h3 className="text-xl font-bold text-text-main dark:text-white mb-2">1. Submit Report</h3>
            <p className="text-sm text-text-muted dark:text-gray-400 px-6">Snap a photo, add location details, and send directly through the app.</p>
          </div>
          {/* Step 2 */}
          <div className="relative z-10 flex flex-col items-center text-center group">
            <div className="w-24 h-24 bg-white dark:bg-gray-800 border-4 border-blue-100 dark:border-gray-700 rounded-full flex items-center justify-center shadow-lg mb-6 group-hover:border-primary group-hover:bg-primary transition-colors duration-300">
              <span className="material-symbols-outlined text-4xl text-primary group-hover:text-white transition-colors">settings_suggest</span>
            </div>
            <h3 className="text-xl font-bold text-text-main dark:text-white mb-2">2. LGU Processing</h3>
            <p className="text-sm text-text-muted dark:text-gray-400 px-6">Your report is automatically routed to the correct department for action.</p>
          </div>
          {/* Step 3 */}
          <div className="relative z-10 flex flex-col items-center text-center group">
            <div className="w-24 h-24 bg-white dark:bg-gray-800 border-4 border-blue-100 dark:border-gray-700 rounded-full flex items-center justify-center shadow-lg mb-6 group-hover:border-primary group-hover:bg-primary transition-colors duration-300">
              <span className="material-symbols-outlined text-4xl text-primary group-hover:text-white transition-colors">check_circle</span>
            </div>
            <h3 className="text-xl font-bold text-text-main dark:text-white mb-2">3. Track Status</h3>
            <p className="text-sm text-text-muted dark:text-gray-400 px-6">Get real-time updates on your phone as the issue is resolved.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
