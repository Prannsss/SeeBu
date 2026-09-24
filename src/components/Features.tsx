"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function Features() {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      // Header scroll fade-in from bottom
      if (headerRef.current) {
        gsap.fromTo(
          headerRef.current,
          { y: 50, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: {
              trigger: headerRef.current,
              start: "top 85%",
              toggleActions: "play none none none",
            },
          }
        );
      }

      // Cards bottom to top fade scroll trigger animation
      cardsRef.current.forEach((card, index) => {
        if (!card) return;
        gsap.fromTo(
          card,
          {
            y: 60,
            opacity: 0,
          },
          {
            y: 0,
            opacity: 1,
            duration: 0.75,
            ease: "power3.out",
            delay: (index % 3) * 0.12,
            scrollTrigger: {
              trigger: card,
              start: "top 88%",
              toggleActions: "play none none none",
            },
          }
        );
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="py-20 bg-background-light dark:bg-gray-900 transition-colors"
      id="features"
    >
      <div className="max-w-7xl mx-auto px-6">
        <div ref={headerRef} className="text-center mb-16">
          <span className="text-primary font-bold tracking-widest text-xs uppercase mb-2 block">
            Key Features
          </span>
          <h2 className="text-3xl lg:text-4xl font-black text-text-main dark:text-white">
            Everything you need
          </h2>
          <p className="mt-4 text-text-muted dark:text-gray-400 max-w-2xl mx-auto">
            SeeBu is packed with features designed to make city living smoother and more transparent.
          </p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div
            ref={(el) => { cardsRef.current[0] = el; }}
            className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-soft hover:shadow-card transition-all duration-300 border border-transparent hover:border-blue-50 dark:hover:border-gray-700 group hover:-translate-y-1"
          >
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-primary mb-6">
              <span className="material-symbols-outlined transition-all duration-300 group-hover:scale-125 group-hover:rotate-12">
                timeline
              </span>
            </div>
            <h3 className="text-xl font-bold text-text-main dark:text-white mb-3">Real-time Tracking</h3>
            <p className="text-text-muted dark:text-gray-400 leading-relaxed text-sm">
              Watch the progress of your reports from submission to completion with live status updates.
            </p>
          </div>

          {/* Feature 2 */}
          <div
            ref={(el) => { cardsRef.current[1] = el; }}
            className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-soft hover:shadow-card transition-all duration-300 border border-transparent hover:border-blue-50 dark:hover:border-gray-700 group hover:-translate-y-1"
          >
            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center text-green-600 mb-6">
              <span className="material-symbols-outlined transition-all duration-300 group-hover:scale-125 group-hover:-translate-y-1">
                location_on
              </span>
            </div>
            <h3 className="text-xl font-bold text-text-main dark:text-white mb-3">Geo-tagged Reporting</h3>
            <p className="text-text-muted dark:text-gray-400 leading-relaxed text-sm">
              Pinpoint the exact location of issues on a map to help response teams find them faster.
            </p>
          </div>

          {/* Feature 3 */}
          <div
            ref={(el) => { cardsRef.current[2] = el; }}
            className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-soft hover:shadow-card transition-all duration-300 border border-transparent hover:border-blue-50 dark:hover:border-gray-700 group hover:-translate-y-1"
          >
            <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-purple-600 mb-6">
              <span className="material-symbols-outlined transition-all duration-300 group-hover:scale-125 group-hover:rotate-180">
                alt_route
              </span>
            </div>
            <h3 className="text-xl font-bold text-text-main dark:text-white mb-3">Smart Routing</h3>
            <p className="text-text-muted dark:text-gray-400 leading-relaxed text-sm">
              AI-powered categorization ensures your report lands on the right desk instantly.
            </p>
          </div>

          {/* Feature 4 */}
          <div
            ref={(el) => { cardsRef.current[3] = el; }}
            className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-soft hover:shadow-card transition-all duration-300 border border-transparent hover:border-blue-50 dark:hover:border-gray-700 group hover:-translate-y-1"
          >
            <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center text-orange-600 mb-6">
              <span className="material-symbols-outlined transition-all duration-300 group-hover:scale-125 group-hover:animate-pulse">
                notifications_active
              </span>
            </div>
            <h3 className="text-xl font-bold text-text-main dark:text-white mb-3">Instant Notifications</h3>
            <p className="text-text-muted dark:text-gray-400 leading-relaxed text-sm">
              Receive push notifications or SMS alerts whenever there is an update on your request.
            </p>
          </div>

          {/* Feature 5 */}
          <div
            ref={(el) => { cardsRef.current[4] = el; }}
            className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-soft hover:shadow-card transition-all duration-300 border border-transparent hover:border-blue-50 dark:hover:border-gray-700 group hover:-translate-y-1"
          >
            <div className="w-12 h-12 rounded-full bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center text-teal-600 mb-6">
              <span className="material-symbols-outlined transition-all duration-300 group-hover:scale-125 group-hover:-rotate-12">
                description
              </span>
            </div>
            <h3 className="text-xl font-bold text-text-main dark:text-white mb-3">Service Requests</h3>
            <p className="text-text-muted dark:text-gray-400 leading-relaxed text-sm">
              Request city documents, permits, or schedule pickups directly through the portal.
            </p>
          </div>

          {/* Feature 6 */}
          <div
            ref={(el) => { cardsRef.current[5] = el; }}
            className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-soft hover:shadow-card transition-all duration-300 border border-transparent hover:border-blue-50 dark:hover:border-gray-700 group hover:-translate-y-1"
          >
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center text-red-600 mb-6">
              <span className="material-symbols-outlined transition-all duration-300 group-hover:scale-125 group-hover:rotate-45">
                analytics
              </span>
            </div>
            <h3 className="text-xl font-bold text-text-main dark:text-white mb-3">Data Transparency</h3>
            <p className="text-text-muted dark:text-gray-400 leading-relaxed text-sm">
              View community-wide statistics and see how the city is performing on issue resolution.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
