"use client";

import { useScrollAnimation } from '@/hooks/use-scroll-animation';

export function Features() {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section className="py-20 bg-background-light dark:bg-gray-900 transition-colors" id="features">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-primary font-bold tracking-widest text-xs uppercase mb-2 block">Key Features</span>
          <h2 className="text-3xl lg:text-4xl font-black text-text-main dark:text-white">Everything you need</h2>
          <p className="mt-4 text-text-muted dark:text-gray-400 max-w-2xl mx-auto">SeeBu is packed with features designed to make city living smoother and more transparent.</p>
        </div>
        <div 
          ref={ref}
          className={`grid md:grid-cols-2 lg:grid-cols-3 gap-6 fade-in-section ${isVisible ? 'is-visible' : ''}`}
        >
          {/* Feature 1 */}
          <div className="bg-white dark:bg-gray-800 p-8 rounded-[20px] shadow-soft hover:shadow-card transition-shadow duration-300 border border-transparent hover:border-blue-50 dark:hover:border-gray-700">
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-primary mb-6">
              <span className="material-symbols-outlined">timeline</span>
            </div>
            <h3 className="text-xl font-bold text-text-main dark:text-white mb-3">Real-time Tracking</h3>
            <p className="text-text-muted dark:text-gray-400 leading-relaxed text-sm">Watch the progress of your reports from submission to completion with live status updates.</p>
          </div>
          {/* Feature 2 */}
          <div className="bg-white dark:bg-gray-800 p-8 rounded-[20px] shadow-soft hover:shadow-card transition-shadow duration-300 border border-transparent hover:border-blue-50 dark:hover:border-gray-700">
            <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/50 flex items-center justify-center text-green-600 mb-6">
              <span className="material-symbols-outlined">location_on</span>
            </div>
            <h3 className="text-xl font-bold text-text-main dark:text-white mb-3">Geo-tagged Reporting</h3>
            <p className="text-text-muted dark:text-gray-400 leading-relaxed text-sm">Pinpoint the exact location of issues on a map to help response teams find them faster.</p>
          </div>
          {/* Feature 3 */}
          <div className="bg-white dark:bg-gray-800 p-8 rounded-[20px] shadow-soft hover:shadow-card transition-shadow duration-300 border border-transparent hover:border-blue-50 dark:hover:border-gray-700">
            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-purple-600 mb-6">
              <span className="material-symbols-outlined">alt_route</span>
            </div>
            <h3 className="text-xl font-bold text-text-main dark:text-white mb-3">Smart Routing</h3>
            <p className="text-text-muted dark:text-gray-400 leading-relaxed text-sm">AI-powered categorization ensures your report lands on the right desk instantly.</p>
          </div>
          {/* Feature 4 */}
          <div className="bg-white dark:bg-gray-800 p-8 rounded-[20px] shadow-soft hover:shadow-card transition-shadow duration-300 border border-transparent hover:border-blue-50 dark:hover:border-gray-700">
            <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center text-orange-600 mb-6">
              <span className="material-symbols-outlined">notifications_active</span>
            </div>
            <h3 className="text-xl font-bold text-text-main dark:text-white mb-3">Instant Notifications</h3>
            <p className="text-text-muted dark:text-gray-400 leading-relaxed text-sm">Receive push notifications or SMS alerts whenever there is an update on your request.</p>
          </div>
          {/* Feature 5 */}
          <div className="bg-white dark:bg-gray-800 p-8 rounded-[20px] shadow-soft hover:shadow-card transition-shadow duration-300 border border-transparent hover:border-blue-50 dark:hover:border-gray-700">
            <div className="w-12 h-12 rounded-xl bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center text-teal-600 mb-6">
              <span className="material-symbols-outlined">description</span>
            </div>
            <h3 className="text-xl font-bold text-text-main dark:text-white mb-3">Service Requests</h3>
            <p className="text-text-muted dark:text-gray-400 leading-relaxed text-sm">Request city documents, permits, or schedule pickups directly through the portal.</p>
          </div>
          {/* Feature 6 */}
          <div className="bg-white dark:bg-gray-800 p-8 rounded-[20px] shadow-soft hover:shadow-card transition-shadow duration-300 border border-transparent hover:border-blue-50 dark:hover:border-gray-700">
            <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/50 flex items-center justify-center text-red-600 mb-6">
              <span className="material-symbols-outlined">analytics</span>
            </div>
            <h3 className="text-xl font-bold text-text-main dark:text-white mb-3">Data Transparency</h3>
            <p className="text-text-muted dark:text-gray-400 leading-relaxed text-sm">View community-wide statistics and see how the city is performing on issue resolution.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
