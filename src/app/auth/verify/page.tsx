
"use client";

import { Button } from "@/components/ui/button";
import BackButton from "@/components/navigation/back-button";
import { Mail } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { gooeyToast } from "goey-toast";

export default function VerifyPage() {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (code.length !== 6) {
        gooeyToast.error("Invalid Code", {
          description: "Please enter a valid 6-digit verification code.",
        });
        return;
      }

      const email = localStorage.getItem('pending_verification_email');
      if (!email) {
        gooeyToast.error("Missing Email", {
          description: "Please register again or check your email for the verification link.",
        });
        return;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://seebu.onrender.com"}/api/v1/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Verification failed');

      gooeyToast.success("Verification Successful!", {
        description: "Your account has been verified. Redirecting to login...",
      });

      localStorage.removeItem('pending_verification_email');

      // Redirect after delay
      setTimeout(() => {
        window.location.href = "/auth/login";
      }, 2000);
    } catch (err: any) {
      gooeyToast.error("Verification Failed", {
        description: err.message || "Something went wrong while verifying your account. Please try again.",
      });
      console.error("Verify flow error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      const email = localStorage.getItem('pending_verification_email');
      if (!email) {
        gooeyToast.error("Missing Email", {
          description: "Please register again.",
        });
        return;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://seebu.onrender.com"}/api/v1/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to resend code');

      gooeyToast.success("Code Sent!", {
        description: "A new verification code has been sent to your email.",
      });
    } catch (err: any) {
      gooeyToast.error("Resend Failed", {
        description: err.message || "Unable to resend verification code right now. Please try again.",
      });
      console.error("Resend flow error:", err);
    }
  };
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(value);
  };

  return (
    <div className="min-h-screen flex bg-background-light dark:bg-gray-950">
      <BackButton
        fallbackPath="/"
        className="fixed top-4 left-4 sm:top-6 sm:left-6 z-50 hidden md:flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors"
      />

      {/* Left Side - CTA & GIF (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 p-12 items-center justify-center relative overflow-hidden auth-bg">
        
        <div className="relative z-10 max-w-lg w-full">
          <h1 className="text-4xl lg:text-5xl font-black text-gray-900 mb-6">
            Be Part of the <span className="font-display italic text-yellow-500">Solution</span>
          </h1>
          <p className="text-gray-700 text-lg mb-8 leading-relaxed">
            Just one more step! Enter the verification code to start making a difference in your community.
          </p>
          
          {/* GIF */}
          <div className="rounded-2xl overflow-hidden">
            <Image 
              src="/gifs/verify.gif" 
              alt="Verification process" 
              width={800}
              height={600}
              unoptimized
              className="w-full h-auto"
            />
          </div>
        </div>
      </div>

      {/* Right Side - Content */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 lg:p-12 pt-20 sm:pt-24 lg:pt-12">
        <div className="w-full max-w-md space-y-6 sm:space-y-8 animate-in fade-in duration-500">
          <div className="text-center lg:text-left">
            <div className="md:hidden mb-4 flex justify-center">
              <Image src="/assets/logo.svg" alt="SeeBu Logo" width={60} height={60} />
            </div>
            <div className="flex justify-center lg:justify-start mb-6">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary animate-pulse">
                <Mail className="h-8 w-8" />
              </div>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-text-main dark:text-white mb-2 sm:mb-3">
              <span className="lg:hidden">Enter Verification Code</span>
              <span className="hidden lg:inline">Check your email</span>
            </h2>
            <p className="text-sm sm:text-base text-text-muted dark:text-gray-400 mb-6">
              We've sent a 6-digit verification code to your email. Please enter it below to verify your account.
            </p>
          </div>

          <div>
            <form className="space-y-5 sm:space-y-6" onSubmit={handleVerify}>
              {/* Verification Code Input */}
              <div className="floating-input">
                <input 
                  id="code" 
                  type="text"
                  placeholder=" "
                  required 
                  maxLength={6}
                  pattern="[0-9]{6}"
                  value={code}
                  onChange={handleCodeChange}
                  className="text-center text-2xl tracking-widest font-bold"
                />
                <label htmlFor="code">Verification Code</label>
                <span className="material-symbols-outlined input-icon">pin</span>
              </div>

              <Button
                className="w-full h-12 text-lg bg-primary hover:bg-primary-dark text-white font-bold shadow-lg disabled:opacity-60"
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? "Verifying…" : "Verify Account"}
              </Button>
            </form>

            <div className="mt-4">
              <Button 
                variant="outline" 
                className="w-full h-12 border-2 hover:border-primary hover:text-primary transition-colors"
                onClick={handleResend}
                type="button"
              >
                Resend verification code
              </Button>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-300 dark:border-gray-700 text-center">
              <p className="text-xs text-text-muted dark:text-gray-400">
                <span className="font-medium">SeeBu Platform</span> - Making Cebu Smarter
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
