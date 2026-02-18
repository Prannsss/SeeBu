
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, MapPin, FileText, ArrowRight } from "lucide-react";
import Image from "next/image";
import { PlaceHolderImages } from "@/app/lib/placeholder-images";
import Link from "next/link";

const features = [
  {
    title: "Real-time Tracking",
    description: "Never wonder about the status of your request. Monitor every update from 'Submitted' to 'LGU Review' to 'Resolved' in real-time.",
    icon: <Activity className="h-6 w-6" />,
    image: PlaceHolderImages.find(img => img.id === "feature-tracking")!,
    badge: "Most Popular",
    color: "bg-primary/10 text-primary"
  },
  {
    title: "Geo-tagged Reporting",
    description: "Precision matters. Our GPS-integrated reporting ensures the city crew knows exactly where intervention is needed, down to the meter.",
    icon: <MapPin className="h-6 w-6" />,
    image: PlaceHolderImages.find(img => img.id === "feature-reporting")!,
    badge: "Advanced",
    color: "bg-accent/20 text-accent-foreground"
  },
  {
    title: "Direct Service Requests",
    description: "Submit requests for permits, garbage collection, or official documents directly to City Hall without the long queues.",
    icon: <FileText className="h-6 w-6" />,
    image: PlaceHolderImages.find(img => img.id === "feature-service")!,
    badge: "Convenient",
    color: "bg-muted text-muted-foreground"
  }
];

export function Features() {
  return (
    <section id="features" className="py-24 bg-white relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center mb-20 space-y-4">
          <Badge variant="outline" className="border-primary text-primary px-4 py-1 font-semibold uppercase tracking-widest text-[10px]">
            Smart City Solutions
          </Badge>
          <h2 className="text-4xl font-extrabold tracking-tight sm:text-6xl font-headline text-foreground">
            A Modern City in Your Pocket
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl leading-relaxed">
            SeeBu brings cutting-edge technology to our local government, ensuring transparency and efficiency in every civic interaction.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {features.map((feature, index) => (
            <Card key={index} className="group overflow-hidden border border-muted bg-white rounded-3xl transition-all duration-500 hover:shadow-2xl hover:border-primary/20 hover:-translate-y-3">
              <CardHeader className="p-0">
                <div className="relative h-56 w-full overflow-hidden">
                  <Image
                    src={feature.image.imageUrl}
                    alt={feature.image.description}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    data-ai-hint={feature.image.imageHint}
                  />
                  <div className="absolute top-4 right-4 z-10">
                    <Badge className="bg-white/95 text-foreground backdrop-blur-md shadow-lg border-none hover:bg-white">{feature.badge}</Badge>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <div className={`mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl ${feature.color} shadow-sm transition-transform group-hover:rotate-6`}>
                  {feature.icon}
                </div>
                <CardTitle className="mb-4 font-headline text-2xl font-bold">{feature.title}</CardTitle>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  {feature.description}
                </p>
                <Link href="/signup" className="inline-flex items-center text-sm font-bold text-primary group-hover:underline gap-1">
                  Learn more <ArrowRight className="h-4 w-4" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
