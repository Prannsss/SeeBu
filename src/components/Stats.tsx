"use client";

import { useScrollAnimation } from '@/hooks/use-scroll-animation';
import { useCountUp } from '@/hooks/use-count-up';

export function Stats() {
  const { ref: statsRef, isVisible: statsVisible } = useScrollAnimation();
  const { ref: citizensRef, isVisible: citizensVisible } = useScrollAnimation();
  const { ref: lgusRef, isVisible: lgusVisible } = useScrollAnimation();

  const issuesCount = useCountUp({ end: 1200, duration: 2000, isVisible: statsVisible });
  const resolutionRate = useCountUp({ end: 85, duration: 2000, isVisible: statsVisible });

  return (
    <>
      {/* Impact Stats */}
      <section 
        ref={statsRef}
        className={`py-16 bg-gradient-to-r from-primary to-primary-dark text-white relative overflow-hidden fade-in-section ${statsVisible ? 'is-visible' : ''}`}
      >
        {/* Decorative bg pattern */}
        <div className="absolute inset-0 opacity-10" style={{backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "20px 20px"}}></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-white/20">
            <div className="p-4">
              <div className="text-5xl font-black mb-2">{issuesCount.toLocaleString()}+</div>
              <div className="text-blue-100 font-medium text-lg">Issues Reported</div>
            </div>
            <div className="p-4">
              <div className="text-5xl font-black mb-2">{resolutionRate}%</div>
              <div className="text-blue-100 font-medium text-lg">Resolution Rate</div>
            </div>
            <div className="p-4">
              <div className="text-5xl font-black mb-2">24hr</div>
              <div className="text-blue-100 font-medium text-lg">Avg Response Time</div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Community & Gov Split - Separate Cards */}
      <section className="py-20 bg-white dark:bg-gray-900 transition-colors">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Citizens Card */}
            <div 
              ref={citizensRef}
              className={`bg-white dark:bg-gray-800 rounded-3xl overflow-hidden shadow-xl border border-gray-100 dark:border-gray-700 fade-in-section ${citizensVisible ? 'is-visible' : ''}`}
            >
              <div className="p-10 lg:p-12 flex flex-col justify-center h-full">
                <div className="inline-flex items-center gap-2 text-primary font-bold uppercase tracking-wider text-xs mb-4">
                  <span className="material-symbols-outlined text-lg">groups</span>
                  For Citizens
                </div>
                <h3 className="text-3xl font-black text-text-main dark:text-white mb-4">Empowering your voice.</h3>
                <p className="text-text-muted dark:text-gray-400 mb-8 leading-relaxed">
                  No more long lines or unanswered calls. SeeBu puts the power of civic engagement in your pocket. Report issues instantly and see the change happen.
                </p>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-secondary shrink-0">check_circle</span>
                    <span className="text-text-main dark:text-white font-medium">Easy mobile reporting</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-secondary shrink-0">check_circle</span>
                    <span className="text-text-main dark:text-white font-medium">Transparent status updates</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-secondary shrink-0">check_circle</span>
                    <span className="text-text-main dark:text-white font-medium">Direct line to city services</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* LGU Card */}
            <div 
              ref={lgusRef}
              className={`bg-gradient-to-br from-blue-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-3xl overflow-hidden shadow-xl border border-gray-100 dark:border-gray-700 fade-in-section ${lgusVisible ? 'is-visible' : ''}`}
            >
              <div className="p-10 lg:p-12 flex flex-col justify-center h-full">
                <div className="inline-flex items-center gap-2 text-text-main dark:text-white font-bold uppercase tracking-wider text-xs mb-4">
                  <span className="material-symbols-outlined text-lg">account_balance</span>
                  For LGUs
                </div>
                <h3 className="text-3xl font-black text-text-main dark:text-white mb-4">Data-driven governance.</h3>
                <p className="text-text-muted dark:text-gray-400 mb-8 leading-relaxed">
                  Streamline operations and allocate resources where they are needed most. SeeBu provides real-time insights into community needs.
                </p>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-primary shrink-0">check_circle</span>
                    <span className="text-text-main dark:text-white font-medium">Centralized dashboard</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-primary shrink-0">check_circle</span>
                    <span className="text-text-main dark:text-white font-medium">Automated workflows</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-primary shrink-0">check_circle</span>
                    <span className="text-text-main dark:text-white font-medium">Heatmaps & Analytics</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
