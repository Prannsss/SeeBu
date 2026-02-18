
"use client";

import { Send, Clock, CheckCircle2 } from "lucide-react";

const steps = [
  {
    icon: <Send className="h-8 w-8" />,
    title: "1. Submit Report",
    description: "Spot an issue in your neighborhood? Capture a photo, add the geo-tag, and submit it instantly via our mobile app."
  },
  {
    icon: <Clock className="h-8 w-8" />,
    title: "2. LGU Processing",
    description: "Your report is automatically routed to the right city department. Watch as it moves from review to scheduling."
  },
  {
    icon: <CheckCircle2 className="h-8 w-8" />,
    title: "3. Track & Verify",
    description: "Receive real-time progress alerts. Once fixed, you'll get a completion report with photos for verification."
  }
];

export function Steps() {
  return (
    <section id="how-it-works" className="py-24 bg-background relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20 space-y-4">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-5xl font-headline text-foreground">
            A Smarter Cebu in 3 Easy Steps
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            We've simplified civic duty so every Sugboanon can contribute to our city's progress with zero friction.
          </p>
        </div>

        <div className="relative">
          {/* Connecting line for desktop */}
          <div className="hidden md:block absolute top-[40px] left-[15%] right-[15%] h-1 bg-primary/20 rounded-full -z-10" />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-20">
            {steps.map((step, index) => (
              <div key={index} className="flex flex-col items-center text-center group">
                <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary text-white shadow-[0_10px_30px_rgba(100,181,246,0.3)] transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                  {step.icon}
                </div>
                <h3 className="text-2xl font-bold mb-4 font-headline text-foreground">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed px-4">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
