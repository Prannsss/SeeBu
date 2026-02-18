
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Steps } from "@/components/Steps";
import { Features } from "@/components/Features";
import { Stats } from "@/components/Stats";
import { CTASection } from "@/components/CTASection";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-background dark:bg-gray-950 font-body overflow-x-hidden transition-colors">
      <Navbar 
        items={[
          { label: 'Home', href: '#top' },
          { label: 'Process', href: '#process' },
          { label: 'Features', href: '#features' },
          { label: 'Contact', href: '#contact' }
        ]}
      />
      <main>
        <Hero />
        <Steps />
        <Features />
        <Stats />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
