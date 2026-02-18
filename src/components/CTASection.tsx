"use client";

import { useScrollAnimation } from '@/hooks/use-scroll-animation';

export function CTASection() {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section className="py-20 px-6 bg-background-light dark:bg-gray-950 transition-colors">
      <div 
        ref={ref}
        className={`max-w-5xl mx-auto rounded-[2.5rem] bg-gradient-to-br from-[#0d181b] to-[#1a2c33] p-12 lg:p-20 text-center relative overflow-hidden shadow-2xl fade-in-section ${isVisible ? 'is-visible' : ''}`}
      >
        {/* Abstract shapes */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        <div className="relative z-10">
          <h2 className="text-4xl lg:text-5xl font-black text-white mb-6">Be part of a smarter Cebu.</h2>
          <p className="text-gray-400 text-lg mb-10 max-w-2xl mx-auto">Join thousands of residents making a difference. Download the app or sign up online today.</p>
          <button className="bg-primary hover:bg-primary-dark text-white font-bold text-lg py-4 px-10 rounded-xl transition-transform hover:scale-105 shadow-lg shadow-primary/30">
            Get Started Now
          </button>
        </div>
      </div>
    </section>
  );
}
