"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const services = [
  {
    icon: "campaign",
    color: "bg-red-100 dark:bg-red-900/40 text-red-600",
    title: "Report an Issue",
    description: "Submit a structured civic complaint with photos, location tags, and urgency levels. Your report gets routed instantly to the right department.",
    href: "/client/report",
    cta: "File a Report",
    tag: "Most Used",
    tagColor: "bg-red-50 text-red-600 border-red-200",
  },
  {
    icon: "manage_search",
    color: "bg-blue-100 dark:bg-blue-900/40 text-blue-600",
    title: "Track Your Report",
    description: "Use your unique tracking ID to follow your report's progress in real-time — from submission to field resolution and sign-off.",
    href: "/track",
    cta: "Track Now",
    tag: "Live Updates",
    tagColor: "bg-blue-50 text-blue-600 border-blue-200",
  },
  {
    icon: "how_to_reg",
    color: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600",
    title: "Citizen Registration",
    description: "Create a citizen account to get personalized dashboards, report history, and faster future submissions without re-entering your details.",
    href: "/auth/register",
    cta: "Register Now",
    tag: "Free",
    tagColor: "bg-emerald-50 text-emerald-600 border-emerald-200",
  },
  {
    icon: "verified",
    color: "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600",
    title: "Verified Civic ID",
    description: "Verified citizens get priority handling, status email notifications, and access to full report timelines with department notes.",
    href: "/auth/login",
    cta: "Get Verified",
    tag: "Priority Access",
    tagColor: "bg-indigo-50 text-indigo-600 border-indigo-200",
  },
  {
    icon: "location_city",
    color: "bg-amber-100 dark:bg-amber-900/40 text-amber-600",
    title: "Municipal Coverage",
    description: "SeeBu covers all major municipalities and barangays in Cebu City. Select your exact location for hyper-local response routing.",
    href: "/client/report",
    cta: "Find Your Area",
    tag: "All Barangays",
    tagColor: "bg-amber-50 text-amber-600 border-amber-200",
  },
  {
    icon: "photo_camera",
    color: "bg-purple-100 dark:bg-purple-900/40 text-purple-600",
    title: "Photo Evidence Upload",
    description: "Attach up to 5 high-resolution photos to your report. Our smart scanner flags sensitive content automatically before submission.",
    href: "/client/report",
    cta: "Submit with Photos",
    tag: "AI-Powered",
    tagColor: "bg-purple-50 text-purple-600 border-purple-200",
  },
  {
    icon: "shield_person",
    color: "bg-slate-100 dark:bg-slate-800 text-slate-600",
    title: "Anonymous Reporting",
    description: "Report sensitive civic issues anonymously. Only an email is required to receive your tracking ID — your identity is never stored.",
    href: "/client/report",
    cta: "Report Anonymously",
    tag: "Private",
    tagColor: "bg-slate-100 text-slate-600 border-slate-200",
  },
  {
    icon: "analytics",
    color: "bg-teal-100 dark:bg-teal-900/40 text-teal-600",
    title: "Public Transparency Data",
    description: "Browse community-wide resolution statistics, see department performance, and understand how the city is responding to civic concerns.",
    href: "/track",
    cta: "View Stats",
    tag: "Open Data",
    tagColor: "bg-teal-50 text-teal-600 border-teal-200",
  },
];

export default function ServicesPage() {
  const headerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const ctaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      // Header entrance animation
      if (headerRef.current) {
        gsap.from(Array.from(headerRef.current.children), {
          y: 30,
          opacity: 0,
          duration: 0.8,
          stagger: 0.12,
          ease: "power3.out",
        });
      }

      // Cards staggered scroll reveal
      cardsRef.current.forEach((card, i) => {
        if (!card) return;
        gsap.fromTo(
          card,
          { y: 50, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.7,
            ease: "power3.out",
            delay: (i % 3) * 0.1,
            scrollTrigger: {
              trigger: card,
              start: "top 88%",
              toggleActions: "play none none none",
            },
          }
        );
      });

      // Bottom CTA Section scroll reveal
      if (ctaRef.current) {
        gsap.fromTo(
          ctaRef.current,
          { y: 50, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.85,
            ease: "power3.out",
            scrollTrigger: {
              trigger: ctaRef.current,
              start: "top 85%",
              toggleActions: "play none none none",
            },
          }
        );
      }
    });

    return () => ctx.revert();
  }, []);

  return (
    <div className="min-h-screen bg-background dark:bg-gray-950 font-body overflow-x-hidden transition-colors">
      <Navbar
        items={[
          { label: "Home", href: "/#top" },
          { label: "Process", href: "/#process" },
          { label: "Features", href: "/#features" },
          { label: "Services", href: "/services" },
          { label: "Track Report", href: "/track" },
        ]}
      />

      <main className="pt-32 pb-20">
        {/* Services Grid Section */}
        <div className="max-w-7xl mx-auto px-6">
          <div ref={headerRef} className="text-center mb-14">
            <span className="inline-flex items-center gap-2 text-primary font-bold tracking-widest text-xs uppercase mb-3 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20">
              <span className="material-symbols-outlined text-base">explore</span>
              Civic Services
            </span>
            <h1 className="text-4xl lg:text-5xl font-black text-text-main dark:text-white tracking-tight mt-2">
              All Available Services
            </h1>
            <p className="mt-3 text-text-muted dark:text-gray-400 max-w-2xl mx-auto text-base lg:text-lg">
              Explore the full range of citizen services available through SeeBu. Submit reports, track resolutions, and engage with city departments.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, i) => (
              <div
                key={service.title}
                ref={(el) => { cardsRef.current[i] = el; }}
                className="group bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-soft hover:shadow-card hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between overflow-hidden"
              >
                <div className="p-7 flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-5">
                    <div
                      className={`w-12 h-12 rounded-full ${service.color} flex items-center justify-center`}
                    >
                      <span className="material-symbols-outlined transition-transform duration-300 group-hover:scale-125">
                        {service.icon}
                      </span>
                    </div>
                    <span
                      className={`inline-flex items-center text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full border ${service.tagColor}`}
                    >
                      {service.tag}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-text-main dark:text-white mb-2.5 leading-snug">
                    {service.title}
                  </h3>
                  <p className="text-sm text-text-muted dark:text-gray-400 leading-relaxed flex-1">
                    {service.description}
                  </p>
                </div>
                <div className="px-7 pb-7">
                  <Link
                    href={service.href}
                    className="flex items-center justify-center gap-2 w-full h-11 rounded-lg bg-primary/10 hover:bg-primary text-primary hover:text-white text-sm font-bold transition-all duration-300 group-hover:bg-primary group-hover:text-white"
                  >
                    {service.cta}
                    <span className="material-symbols-outlined text-base">arrow_forward</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section - matching landing page style */}
        <div ref={ctaRef} className="max-w-5xl mx-auto px-6 mt-20">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#0d181b] to-[#1a2c33] p-12 lg:p-20 text-center shadow-2xl">
            {/* Abstract ambient glows */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

            <div className="relative z-10">
              <span className="inline-flex items-center gap-2 text-primary font-bold tracking-widest text-xs uppercase mb-4 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                <span className="material-symbols-outlined text-base">star</span>
                Get Started Today
              </span>

              <h2 className="text-4xl lg:text-5xl font-black text-white mb-6">
                Ready to make Cebu{" "}
                <span className="font-display italic text-yellow-500">better</span>?
              </h2>

              <p className="text-gray-400 text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
                Join thousands of Cebuanos already using SeeBu to report issues, track progress, and create a more responsive city.
              </p>

              <div className="flex flex-wrap gap-4 justify-center">
                <Link
                  href="/client/report"
                  className="inline-flex items-center gap-2 bg-secondary hover:bg-secondary-dark text-white font-bold text-base md:text-lg py-4 px-8 rounded-xl transition-transform hover:scale-105 shadow-lg shadow-secondary/30"
                >
                  <span className="material-symbols-outlined">campaign</span>
                  Report an Issue
                </Link>
                <Link
                  href="/auth/register"
                  className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-bold text-base md:text-lg py-4 px-8 rounded-xl transition-transform hover:scale-105 shadow-lg shadow-primary/30"
                >
                  <span className="material-symbols-outlined">how_to_reg</span>
                  Create an Account
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
