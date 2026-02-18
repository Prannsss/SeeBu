
"use client";

import { CheckCircle2, Zap, ShieldCheck, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const benefits = [
  {
    icon: <Zap className="h-6 w-6 text-primary" />,
    title: "Faster Response Times",
    description: "Automated routing cuts down bureaucracy, getting help to you when it matters most by reaching the right department instantly."
  },
  {
    icon: <ShieldCheck className="h-6 w-6 text-primary" />,
    title: "Full Transparency",
    description: "Every step is logged and visible. No more hidden processes or lost paperwork. Track your tax pesos at work."
  },
  {
    icon: <CheckCircle2 className="h-6 w-6 text-primary" />,
    title: "Accountability",
    description: "Citizen feedback directly impacts department performance metrics, ensuring city staff remain responsive to your needs."
  },
  {
    icon: <Users className="h-6 w-6 text-primary" />,
    title: "Stronger Community",
    description: "Join thousands of Cebuanos working together for a cleaner, safer, and smarter city for our children."
  }
];

export function Benefits() {
  return (
    <section id="benefits" className="py-24 bg-muted/40 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div>
              <Badge variant="outline" className="mb-4 border-primary text-primary px-3 py-1">Community Trust</Badge>
              <h2 className="text-3xl font-extrabold tracking-tight sm:text-5xl font-headline mb-6 text-foreground">
                Why Thousands of Sugboanons Trust SeeBu
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">
                We're not just an app; we're a movement to reclaim civic efficiency in Cebu.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-10">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex flex-col gap-3 group">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm border border-primary/10 transition-colors group-hover:bg-primary/10 group-hover:border-primary/20">
                    {benefit.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2 text-foreground">{benefit.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            {/* Decorative background element */}
            <div className="absolute -inset-4 bg-primary/10 rounded-3xl blur-3xl -z-10" />
            
            <Card className="border-none shadow-2xl bg-white/90 backdrop-blur-sm overflow-hidden">
              <CardContent className="p-10">
                <div className="flex items-center justify-between mb-10">
                  <div>
                    <h3 className="text-2xl font-bold font-headline">Platform Impact</h3>
                    <p className="text-sm text-muted-foreground">Annual performance review 2024</p>
                  </div>
                  <Badge className="bg-accent text-accent-foreground px-4 py-1">Verified Data</Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10 flex flex-col items-center justify-center text-center transition-transform hover:scale-105">
                    <p className="text-4xl font-extrabold text-primary mb-1">15k+</p>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Reports Fixed</p>
                  </div>
                  <div className="p-6 bg-accent/10 rounded-2xl border border-accent/20 flex flex-col items-center justify-center text-center transition-transform hover:scale-105">
                    <p className="text-4xl font-extrabold text-accent-foreground mb-1">2.4h</p>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Avg. Response</p>
                  </div>
                  <div className="p-6 bg-muted/50 rounded-2xl border border-muted flex flex-col items-center justify-center text-center transition-transform hover:scale-105">
                    <p className="text-4xl font-extrabold text-foreground/80 mb-1">98%</p>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Satisfaction</p>
                  </div>
                  <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10 flex flex-col items-center justify-center text-center transition-transform hover:scale-105">
                    <p className="text-4xl font-extrabold text-primary mb-1">80%</p>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Wait Reduction</p>
                  </div>
                </div>

                <div className="mt-10 pt-10 border-t space-y-4">
                  <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/30 italic text-muted-foreground">
                    <div className="h-10 w-10 rounded-full bg-primary/20 shrink-0 flex items-center justify-center not-italic font-bold text-primary">MS</div>
                    <p className="text-sm">
                      "SeeBu has changed how we view city hall. I reported a pothole in Mabolo and it was patched within 48 hours. Transparent and truly efficient!"
                      <span className="font-bold not-italic block mt-1 text-foreground">— Maria S., Mabolo Resident</span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
