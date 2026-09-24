"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";

export function Hero() {
  const containerRef = useRef<HTMLElement>(null);
  const textContentRef = useRef<HTMLDivElement>(null);
  const visualRef = useRef<HTMLDivElement>(null);
  const dotsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Animate text elements with a smooth staggered bottom-to-top entrance
      if (textContentRef.current) {
        gsap.from(Array.from(textContentRef.current.children), {
          y: 40,
          opacity: 0,
          duration: 0.9,
          stagger: 0.15,
          ease: "power3.out",
        });
      }

      // Animate visual illustration
      if (visualRef.current) {
        gsap.from(visualRef.current, {
          scale: 0.92,
          opacity: 0,
          duration: 1.1,
          ease: "power2.out",
          delay: 0.2,
        });
      }

      // Floating micro-animations for decorative dots
      if (dotsRef.current) {
        const dots = Array.from(dotsRef.current.children);
        dots.forEach((dot, i) => {
          gsap.to(dot, {
            y: i % 2 === 0 ? -8 : 8,
            x: i % 3 === 0 ? 5 : -5,
            duration: 2.5 + (i % 4) * 0.5,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
            delay: i * 0.15,
          });
        });
      }
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="top"
      ref={containerRef}
      className="relative min-h-screen flex items-center justify-center pt-32 pb-20 overflow-hidden bg-background dark:bg-gray-950 transition-colors"
    >
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
        {/* Left: Content */}
        <div
          ref={textContentRef}
          className="flex flex-col gap-8 z-10 text-center lg:text-left items-center lg:items-start"
        >
          <div className="space-y-4">
            <h1 className="text-5xl lg:text-6xl font-black leading-[1.1] tracking-tight text-text-main dark:text-white">
              Report. Resolve. <br />
              <span className="text-yellow-500 relative inline-block font-display italic">
                Improve Cebu.
                <svg
                  className="absolute w-full h-3 -bottom-1 left-0 text-red-600 -z-10 opacity-100"
                  preserveAspectRatio="none"
                  viewBox="0 0 100 10"
                >
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
            <Link
              href="/client/report"
              className="flex items-center gap-2 bg-secondary hover:bg-secondary-dark text-white text-base font-bold h-14 px-8 rounded-xl transition-all shadow-lg shadow-secondary/25 hover:scale-105 btn-shine"
            >
              <span className="material-symbols-outlined">campaign</span>
              Report an Issue
            </Link>
            <Link
              href="/services"
              className="flex items-center gap-2 bg-white dark:bg-gray-800 border-2 border-[#e7f0f3] dark:border-gray-700 hover:border-primary text-text-main dark:text-white hover:text-primary text-base font-bold h-14 px-8 rounded-xl transition-all hover:bg-blue-50 dark:hover:bg-gray-700 shadow-sm hover:scale-105"
            >
              <span className="material-symbols-outlined">explore</span>
              Explore Services
            </Link>
          </div>
        </div>

        {/* Right: Visual */}
        <div
          ref={visualRef}
          className="relative h-[500px] w-full flex items-center justify-center"
        >
          {/* Decorative dots pattern */}
          <div ref={dotsRef} className="absolute inset-0 -z-10">
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
          <Image
            src="/gifs/build.gif"
            alt="Cebu City Civic Development Illustration"
            width={800}
            height={600}
            unoptimized
            className="w-full h-full object-contain relative z-10"
          />
        </div>
      </div>
    </section>
  );
}
