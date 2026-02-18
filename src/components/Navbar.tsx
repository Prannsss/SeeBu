
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Building2, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={cn(
      "fixed top-0 z-50 w-full transition-all duration-300 border-b",
      scrolled ? "bg-white/90 backdrop-blur-md h-16 shadow-sm border-muted" : "bg-transparent h-20 border-transparent"
    )}>
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="bg-primary p-2 rounded-xl transition-transform group-hover:scale-110">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-black tracking-tighter font-headline text-foreground">SeeBu</span>
        </Link>
        
        <div className="hidden md:flex items-center gap-10">
          <Link href="#features" className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors">Features</Link>
          <Link href="#how-it-works" className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors">How it Works</Link>
          <Link href="#benefits" className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors">Benefits</Link>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Button variant="ghost" className="font-bold text-muted-foreground hover:text-primary" asChild>
            <Link href="/login">Login</Link>
          </Button>
          <Button className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold px-6 h-11 rounded-xl shadow-md transition-all hover:translate-y-[-1px]" asChild>
            <Link href="/signup">Get Started</Link>
          </Button>
        </div>

        <div className="md:hidden">
          <button 
            onClick={() => setIsOpen(!isOpen)} 
            className="p-2 rounded-lg bg-muted text-foreground transition-colors hover:bg-primary/10 hover:text-primary"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white border-b shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex flex-col gap-1 p-6">
            <Link href="#features" className="px-4 py-3 text-lg font-bold text-foreground border-b border-muted" onClick={() => setIsOpen(false)}>Features</Link>
            <Link href="#how-it-works" className="px-4 py-3 text-lg font-bold text-foreground border-b border-muted" onClick={() => setIsOpen(false)}>How it Works</Link>
            <Link href="#benefits" className="px-4 py-3 text-lg font-bold text-foreground border-b border-muted" onClick={() => setIsOpen(false)}>Benefits</Link>
            <div className="pt-6 grid grid-cols-1 gap-3">
              <Button variant="outline" className="h-12 text-lg font-bold rounded-xl" asChild>
                <Link href="/login">Login</Link>
              </Button>
              <Button className="h-12 text-lg font-bold bg-accent text-accent-foreground rounded-xl" asChild>
                <Link href="/signup">Create Free Account</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
