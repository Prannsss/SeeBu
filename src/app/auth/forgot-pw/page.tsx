"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<'email' | 'code'>('email');

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('code');
  };

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle password reset
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
            Don't worry! Resetting your password is easy. Just follow the steps and you'll be back making a difference in no time.
          </p>
          
          {/* GIF */}
          <div className="rounded-2xl overflow-hidden">
            <img 
              src="/gifs/verify.gif" 
              alt="Password reset process" 
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
              {step === 'email' ? 'Forgot Password?' : 'Enter Verification Code'}
            </h2>
            <p className="text-sm sm:text-base text-text-muted dark:text-gray-400">
              {step === 'email' 
                ? "Enter your email and we'll send you a verification code." 
                : "We've sent a verification code to your email."}
            </p>
          </div>

          <div>
            {step === 'email' ? (
              <form className="space-y-5 sm:space-y-6" onSubmit={handleEmailSubmit}>
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

                <Button className="w-full h-12 text-lg bg-primary hover:bg-primary-dark text-white font-bold shadow-lg" type="submit">
                  Send Verification Code
                </Button>
              </form>
            ) : (
              <form className="space-y-5 sm:space-y-6" onSubmit={handleCodeSubmit}>
                {/* Verification Code */}
                <div className="floating-input">
                  <input 
                    id="code" 
                    type="text"
                    placeholder=" "
                    required 
                    maxLength={6}
                    pattern="[0-9]{6}"
                  />
                  <label htmlFor="code">Verification Code</label>
                  <span className="material-symbols-outlined input-icon">pin</span>
                </div>

                {/* New Password */}
                <div className="floating-input">
                  <input 
                    id="new-password" 
                    type="password"
                    placeholder=" "
                    required 
                    minLength={8}
                    maxLength={50}
                  />
                  <label htmlFor="new-password">New Password</label>
                  <span className="material-symbols-outlined input-icon">lock</span>
                </div>

                {/* Confirm Password */}
                <div className="floating-input">
                  <input 
                    id="confirm-password" 
                    type="password"
                    placeholder=" "
                    required 
                    minLength={8}
                    maxLength={50}
                  />
                  <label htmlFor="confirm-password">Confirm Password</label>
                  <span className="material-symbols-outlined input-icon">lock</span>
                </div>

                <div className="flex gap-3">
                  <Button 
                    type="button"
                    variant="outline" 
                    className="w-full h-12 text-base border-2 hover:border-primary hover:text-primary transition-colors"
                    onClick={() => setStep('email')}
                  >
                    Back
                  </Button>
                  <Button className="w-full h-12 text-base bg-primary hover:bg-primary-dark text-white font-bold shadow-lg" type="submit">
                    Reset Password
                  </Button>
                </div>
              </form>
            )}
            
            <div className="mt-6 pt-6 border-t border-gray-300 dark:border-gray-700 text-center">
              <p className="text-sm text-text-muted dark:text-gray-400">
                Remember your password? <Link href="/auth/login" className="text-primary font-bold hover:underline">Log in</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
