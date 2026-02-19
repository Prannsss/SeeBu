
"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RegisterPage() {
  const router = useRouter();
  const [contactNumber, setContactNumber] = useState("");

  // Phone number formatter for Philippine format
  const formatPhoneNumber = (value: string) => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');
    
    // If it starts with 63, add +
    if (digits.startsWith('63')) {
      const remaining = digits.slice(2, 12); // Max 10 digits after 63
      return '+63' + remaining;
    }
    
    // If it starts with 0, replace with +63
    if (digits.startsWith('0')) {
      const remaining = digits.slice(1, 11); // Max 10 digits after 0
      return '+63' + remaining;
    }
    
    // Otherwise, add +63 prefix
    const limited = digits.slice(0, 10); // Max 10 digits
    return limited ? '+63' + limited : '';
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    router.push('/auth/verify');
  };

  return (
    <div className="min-h-screen flex bg-background-light dark:bg-gray-950">
      {/* Logo on top left */}
      <Link href="/" className="fixed top-4 left-4 sm:top-6 sm:left-6 z-50 flex items-center gap-2 hover:opacity-80 transition-opacity">
        <img src="/assets/logo.svg" alt="SeeBu Logo" className="h-7 sm:h-8 w-auto" />
      </Link>

      {/* Left Side - CTA & GIF (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 p-12 items-center justify-center relative overflow-hidden auth-bg">
        
        <div className="relative z-10 max-w-lg w-full">
          <h1 className="text-4xl lg:text-5xl font-black text-gray-900 mb-6">
            Be Part of the <span className="font-display italic text-yellow-500">Solution</span>
          </h1>
          <p className="text-gray-700 text-lg mb-8 leading-relaxed">
            Join thousands of Cebu residents making a real impact. Report issues, track progress, and help build a smarter city together.
          </p>
          
          {/* GIF */}
          <div className="rounded-2xl overflow-hidden">
            <img 
              src="/gifs/auth.gif" 
              alt="SeeBu in action" 
              className="w-full h-auto"
            />
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 lg:p-12 pt-20 sm:pt-24 lg:pt-12">
        <div className="w-full max-w-md space-y-6 sm:space-y-8 animate-in fade-in duration-500">
          <div className="text-center lg:text-left">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-text-main dark:text-white mb-2 sm:mb-3">
              <span className="lg:hidden">Be Part of the <span className="font-display italic text-yellow-500">Solution</span></span>
              <span className="hidden lg:inline">Create your account</span>
            </h2>
            <p className="text-sm sm:text-base text-text-muted dark:text-gray-400">Start making a difference in Cebu today.</p>
          </div>

          <div>
            <form className="space-y-5 sm:space-y-6" onSubmit={handleSignup}>
              <div className="grid grid-cols-2 gap-4">
                {/* First Name */}
                <div className="floating-input">
                  <input 
                    id="first-name" 
                    type="text"
                    placeholder=" "
                    required 
                    maxLength={50}
                  />
                  <label htmlFor="first-name">First Name</label>
                  <span className="material-symbols-outlined input-icon">person</span>
                </div>
                
                {/* Last Name */}
                <div className="floating-input">
                  <input 
                    id="last-name" 
                    type="text"
                    placeholder=" "
                    required 
                    maxLength={50}
                  />
                  <label htmlFor="last-name">Last Name</label>
                  <span className="material-symbols-outlined input-icon">person</span>
                </div>
              </div>

              {/* Email */}
              <div className="floating-input">
                <input 
                  id="email" 
                  type="email"
                  placeholder=" "
                  required 
                  maxLength={100}
                />
                <label htmlFor="email">Email</label>
                <span className="material-symbols-outlined input-icon">mail</span>
              </div>

              {/* Contact Number */}
              <div className="floating-input">
                <input 
                  id="contact" 
                  type="tel"
                  placeholder=" "
                  required 
                  value={contactNumber}
                  onChange={(e) => {
                    const formatted = formatPhoneNumber(e.target.value);
                    setContactNumber(formatted);
                  }}
                  maxLength={13}
                />
                <label htmlFor="contact">Contact Number</label>
                <span className="material-symbols-outlined input-icon">phone</span>
              </div>

              {/* Password */}
              <div className="floating-input">
                <input 
                  id="password" 
                  type="password"
                  placeholder=" "
                  required 
                  minLength={8}
                  maxLength={50}
                />
                <label htmlFor="password">Password</label>
                <span className="material-symbols-outlined input-icon">lock</span>
              </div>
              <p className="text-xs text-text-muted dark:text-gray-400 -mt-3 ml-1">Minimum 8 characters with at least one number.</p>

              <div className="flex items-start space-x-2 pt-2">
                <Checkbox id="terms" required />
                <label htmlFor="terms" className="text-xs leading-relaxed peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-text-muted dark:text-gray-400">
                  I agree to SeeBu's <Link href="#" className="text-primary underline hover:text-primary-dark">Terms of Service</Link> and <Link href="#" className="text-primary underline hover:text-primary-dark">Privacy Policy</Link>.
                </label>
              </div>
              <Button className="w-full h-12 text-lg bg-primary hover:bg-primary-dark text-white font-bold shadow-lg" type="submit">
                Create Account
              </Button>
            </form>
            
            <div className="mt-6 pt-6 border-t border-gray-300 dark:border-gray-700 text-center">
              <p className="text-sm text-text-muted dark:text-gray-400">
                Already have an account? <Link href="/auth/login" className="text-primary font-bold hover:underline">Log in</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
