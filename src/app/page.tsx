
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Steps } from "@/components/Steps";
import { Features } from "@/components/Features";
import { Benefits } from "@/components/Benefits";
import { CTASection } from "@/components/CTASection";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-background font-body">
      <Navbar />
      <main>
        <Hero />
        <Steps />
        <Features />
        <Benefits />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
