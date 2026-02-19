"use client";

import { useEffect, useState } from 'react';

export function Hero() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section id="top" className={`relative min-h-screen flex items-center justify-center pt-32 pb-20 overflow-hidden bg-background dark:bg-gray-950 transition-all duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
        {/* Left: Content */}
        <div className={`flex flex-col gap-8 z-10 text-center lg:text-left items-center lg:items-start transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="space-y-4">
            <span className="inline-block py-1 px-3 rounded-full bg-blue-50 dark:bg-blue-900/30 text-primary text-xs font-bold tracking-wider uppercase border border-blue-100 dark:border-blue-800">
              Official Civic Hub
            </span>
            <h1 className="text-5xl lg:text-6xl font-black leading-[1.1] tracking-tight text-text-main dark:text-white">
              Report. Resolve. <br />
              <span className="text-yellow-500 relative inline-block font-display italic">
                Improve Cebu.
                <svg className="absolute w-full h-3 -bottom-1 left-0 text-red-600 -z-10 opacity-100" preserveAspectRatio="none" viewBox="0 0 100 10">
                  <path d="M0 5 Q 50 10 100 5" fill="none" stroke="currentColor" strokeWidth="8"></path>
                </svg>
              </span>
            </h1>
            <p className="text-lg text-text-muted dark:text-gray-400 max-w-lg leading-relaxed mx-auto lg:mx-0">
              The unified civic complaints and services hub for Cebu City residents. 
              Centralized reporting for a smarter, safer, and better community.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
            <a href="client/report" className="flex items-center gap-2 bg-secondary hover:bg-secondary-dark text-white text-base font-bold h-14 px-8 rounded-xl transition-all shadow-lg shadow-secondary/25 hover:scale-105 btn-shine">
              <span className="material-symbols-outlined">campaign</span>
              Report an Issue
            </a>
            <button className="flex items-center gap-2 bg-white dark:bg-gray-800 border-2 border-[#e7f0f3] dark:border-gray-700 hover:border-primary text-text-main dark:text-white hover:text-primary text-base font-bold h-14 px-8 rounded-xl transition-all hover:bg-blue-50 dark:hover:bg-gray-700">
              <span className="material-symbols-outlined">explore</span>
              Explore Services
            </button>
          </div>
        </div>
        {/* Right: Visual */}
        <div className={`relative h-[500px] w-full flex items-center justify-center transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
          {/* Decorative dots pattern */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-10 right-10 w-4 h-4 bg-primary/30 rounded-full"></div>
            <div className="absolute top-20 right-24 w-2 h-2 bg-secondary/40 rounded-full"></div>
            <div className="absolute top-16 right-40 w-3 h-3 bg-primary/20 rounded-full"></div>
            <div className="absolute bottom-20 right-16 w-3 h-3 bg-primary/25 rounded-full"></div>
            <div className="absolute bottom-32 right-32 w-2 h-2 bg-secondary/30 rounded-full"></div>
            <div className="absolute top-1/3 right-8 w-2 h-2 bg-primary/35 rounded-full"></div>
            <div className="absolute bottom-24 left-10 w-4 h-4 bg-primary/20 rounded-full"></div>
            <div className="absolute bottom-40 left-20 w-2 h-2 bg-secondary/30 rounded-full"></div>
            <div className="absolute top-28 left-16 w-3 h-3 bg-primary/25 rounded-full"></div>
            <div className="absolute top-1/2 left-8 w-2 h-2 bg-secondary/35 rounded-full"></div>
            <div className="absolute bottom-16 left-1/3 w-3 h-3 bg-primary/30 rounded-full"></div>
            <div className="absolute top-12 left-1/4 w-2 h-2 bg-primary/40 rounded-full"></div>
          </div>
          <img 
            src="/gifs/build.gif" 
            alt="Cebu City Civic Development Illustration" 
            className="w-full h-full object-contain relative z-10"
          />
        </div>
      </div>
    </section>
  );
}
