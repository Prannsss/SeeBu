
"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Building2 } from "lucide-react";

export function CTASection() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-primary px-8 py-16 shadow-2xl text-center lg:py-24">
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 opacity-10">
            <Building2 className="h-96 w-96 text-white" />
          </div>
          <div className="relative z-10 flex flex-col items-center max-w-2xl mx-auto">
            <h2 className="text-4xl font-extrabold tracking-tight text-primary-foreground sm:text-5xl font-headline mb-6">
              Be Part of the Solution for a Better Cebu
            </h2>
            <p className="text-xl text-primary-foreground/80 mb-10 leading-relaxed">
              Join thousands of your fellow Sugboanons today. Every report you file brings us one step closer to the smart city Cebu deserves.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
              <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground text-lg h-14 px-10 shadow-lg" asChild>
                <Link href="/signup">Sign Up for Free</Link>
              </Button>
              <Button size="lg" variant="outline" className="bg-transparent border-white/30 text-white hover:bg-white/10 text-lg h-14 px-10" asChild>
                <Link href="/login">Login to Account</Link>
              </Button>
            </div>
            <p className="mt-8 text-sm text-primary-foreground/60 font-medium">
              Join 50,000+ active citizens today
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
