"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, MapPin, CheckCircle, Shield } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { PlaceHolderImages } from "@/app/lib/placeholder-images";
import { Badge } from "@/components/ui/badge";

export function Hero() {
  const heroImage = PlaceHolderImages?.find(img => img.id === "hero-cebu") || {
    id: "hero-cebu",
    description: "Cebu City Skyline",
    imageUrl: "https://picsum.photos/seed/cebu-city-panorama/1200/800",
    imageHint: "city aerial"
  };

  return (
    <section className="relative overflow-hidden pt-12 pb-24 lg:pt-28 lg:pb-36 bg-gradient-to-b from-background to-white">
      {/* Decorative patterns */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-96 w-96 rounded-full bg-accent/5 blur-3xl" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="lg:grid lg:grid-cols-12 lg:gap-16 items-center">
          <div className="lg:col-span-7 flex flex-col space-y-8 animate-in fade-in slide-in-from-left-8 duration-700">
            <div className="inline-flex items-center self-start rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary border border-primary/20 shadow-sm">
              <MapPin className="mr-2 h-4 w-4" />
              Serving the Queen City of the South
            </div>
            
            <h1 className="text-5xl font-extrabold tracking-tight sm:text-7xl font-headline leading-[1.1] text-foreground">
              Empowering Every <span className="text-primary italic">Sugboanon</span> to Build a Better City
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed">
              SeeBu is the digital pulse of Cebu City. Report community issues, track real-time fixes, and collaborate directly with the LGU—all from your pocket.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground text-lg h-16 px-10 rounded-2xl shadow-lg transition-all hover:translate-y-[-2px] hover:shadow-xl" asChild>
                <Link href="/signup">
                  Join the Solution <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-lg h-16 px-10 rounded-2xl border-2 hover:bg-muted/50" asChild>
                <Link href="#how-it-works">Watch the Process</Link>
              </Button>
            </div>

            <div className="flex items-center gap-8 pt-6 border-t border-muted">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium text-muted-foreground">Secure & Official</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium text-muted-foreground">Real-time Fixes</span>
              </div>
            </div>
          </div>

          <div className="mt-16 lg:mt-0 lg:col-span-5 relative">
            <div className="relative aspect-[4/5] sm:aspect-square overflow-hidden rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border-8 border-white animate-in fade-in slide-in-from-right-8 duration-1000">
              <Image
                src={heroImage.imageUrl}
                alt={heroImage.description}
                fill
                className="object-cover"
                data-ai-hint={heroImage.imageHint}
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/30 to-transparent" />
            </div>

            {/* Interactive Floating Status Card */}
            <div className="absolute -bottom-10 -left-10 bg-white p-6 rounded-3xl shadow-2xl border border-primary/10 max-w-[280px] animate-float hidden sm:block">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-accent flex items-center justify-center shadow-inner">
                  <CheckCircle className="h-6 w-6 text-accent-foreground" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-primary uppercase tracking-wider">Report Fixed</span>
                    <Badge variant="secondary" className="text-[10px] py-0">Just Now</Badge>
                  </div>
                  <p className="text-sm font-bold mt-1">Streetlight Restored</p>
                  <p className="text-xs text-muted-foreground">Osmeña Blvd., Sector 4</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-muted/50 flex justify-between items-center">
                <div className="flex -space-x-2">
                  {[1,2,3].map(i => (
                    <div key={i} className="h-6 w-6 rounded-full border-2 border-white bg-muted" />
                  ))}
                  <div className="h-6 w-6 rounded-full border-2 border-white bg-primary text-[8px] flex items-center justify-center text-white font-bold">+12</div>
                </div>
                <span className="text-[10px] font-bold text-muted-foreground">Upvoted by neighbors</span>
              </div>
            </div>
            
            {/* Secondary Floating element */}
            <div className="absolute -top-6 -right-6 bg-white py-3 px-5 rounded-2xl shadow-xl border border-primary/5 hidden md:block">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs font-bold">542 Active Reports today</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
