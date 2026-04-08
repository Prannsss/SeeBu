"use client";

import { Button } from "@/components/ui/button";
import BackButton from "@/components/navigation/back-button";
import Link from "next/link";
import Image from "next/image";
import { useState, useRef } from "react";
import { Eye, EyeOff } from "lucide-react";
import { gooeyToast } from "goey-toast";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<'email' | 'code' | 'password'>('email');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const newPasswordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // TODO: replace with real API call
      await new Promise(res => setTimeout(res, 700));
      gooeyToast.success("Code Sent!", {
        description: "A 6-digit verification code has been sent to your email.",
      });
      setStep('code');
    } catch {
      gooeyToast.error("Failed to Send", {
        description: "Could not send the code. Please check your email and try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // TODO: validate code against real API
      await new Promise(res => setTimeout(res, 600));
      // Simulated success — replace with real validation
      setStep('password');
    } catch {
      gooeyToast.error("Invalid Code", {
        description: "The code you entered is incorrect or has expired. Try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newPw = newPasswordRef.current?.value ?? '';
    const confirmPw = confirmPasswordRef.current?.value ?? '';
    if (newPw !== confirmPw) {
      gooeyToast.error("Passwords Don't Match", {
        description: "Please make sure both password fields are identical.",
      });
      return;
    }
    setIsLoading(true);
    try {
      // TODO: replace with real API call
      await new Promise(res => setTimeout(res, 800));
      gooeyToast.success("Password Reset!", {
        description: "Your password has been updated. You can now log in.",
      });
    } catch {
      gooeyToast.error("Reset Failed", {
        description: "Something went wrong. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const stepTitles = {
    email: 'Forgot Password?',
    code: 'Enter Verification Code',
    password: 'Set New Password',
  };

  const stepDescriptions = {
    email: "Enter your email and we'll send you a verification code.",
    code: "We've sent a 6-digit code to your email. Enter it below.",
    password: "Create a strong new password for your account.",
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
            Don&apos;t worry! Resetting your password is easy. Just follow the steps and you&apos;ll be back making a difference in no time.
          </p>
          
          {/* GIF */}
          <div className="rounded-2xl overflow-hidden">
            <Image 
              src="/gifs/verify.gif" 
              alt="Password reset process" 
              width={800}
              height={600}
              unoptimized
              className="w-full h-auto"
            />
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 lg:p-12 pt-20 sm:pt-24 lg:pt-12">
        <div className="w-full max-w-md space-y-6 sm:space-y-8 animate-in fade-in duration-500">

          {/* Step indicator */}
          <div className="flex items-center gap-2 justify-center lg:justify-start">
            {(['email', 'code', 'password'] as const).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step === s
                    ? 'bg-primary text-white shadow-md'
                    : ['email', 'code', 'password'].indexOf(step) > i
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                }`}>
                  {['email', 'code', 'password'].indexOf(step) > i ? '✓' : i + 1}
                </div>
                {i < 2 && <div className={`w-8 h-0.5 rounded ${['email', 'code', 'password'].indexOf(step) > i ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'}`} />}
              </div>
            ))}
          </div>

          <div className="text-center lg:text-left">
            <div className="md:hidden mb-4 flex justify-center">
              <Image src="/assets/logo.svg" alt="SeeBu Logo" width={60} height={60} />
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-text-main dark:text-white mb-2 sm:mb-3">
              {stepTitles[step]}
            </h2>
            <p className="text-sm sm:text-base text-text-muted dark:text-gray-400">
              {stepDescriptions[step]}
            </p>
          </div>

          <div>
            {/* ── Step 1: Email ── */}
            {step === 'email' && (
              <form className="space-y-5 sm:space-y-6" onSubmit={handleEmailSubmit}>
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

              <Button
                className="w-full h-12 text-lg bg-primary hover:bg-primary-dark text-white font-bold shadow-lg disabled:opacity-60"
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? "Sending…" : "Send Verification Code"}
              </Button>
              </form>
            )}

            {/* ── Step 2: Verification Code ── */}
            {step === 'code' && (
              <form className="space-y-5 sm:space-y-6" onSubmit={handleCodeSubmit}>
                <div className="floating-input">
                  <input 
                    id="code" 
                    type="text"
                    inputMode="numeric"
                    placeholder=" "
                    required 
                    maxLength={6}
                    pattern="[0-9]{6}"
                  />
                  <label htmlFor="code">6-Digit Verification Code</label>
                  <span className="material-symbols-outlined input-icon">pin</span>
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
                  <Button
                    className="w-full h-12 text-base bg-primary hover:bg-primary-dark text-white font-bold shadow-lg disabled:opacity-60"
                    type="submit"
                    disabled={isLoading}
                  >
                    {isLoading ? "Verifying…" : "Verify Code"}
                  </Button>
                </div>
              </form>
            )}

            {/* ── Step 3: New Password + Confirm Password ── */}
            {step === 'password' && (
              <form className="space-y-5 sm:space-y-6" onSubmit={handlePasswordSubmit}>
                {/* New Password */}
                <div className="floating-input has-right-icon">
                  <input 
                    id="new-password" 
                    ref={newPasswordRef}
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder=" "
                    required 
                    minLength={8}
                    maxLength={50}
                  />
                  <label htmlFor="new-password">New Password</label>
                  <span className="material-symbols-outlined input-icon">lock</span>
                  <button
                    type="button"
                    className="input-icon-right"
                    onClick={() => setShowNewPassword(v => !v)}
                    tabIndex={-1}
                    aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="text-xs text-text-muted dark:text-gray-400 -mt-3 ml-1">Minimum 8 characters.</p>

                {/* Confirm Password */}
                <div className="floating-input has-right-icon">
                  <input 
                    id="confirm-password" 
                    ref={confirmPasswordRef}
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder=" "
                    required 
                    minLength={8}
                    maxLength={50}
                  />
                  <label htmlFor="confirm-password">Confirm Password</label>
                  <span className="material-symbols-outlined input-icon">lock</span>
                  <button
                    type="button"
                    className="input-icon-right"
                    onClick={() => setShowConfirmPassword(v => !v)}
                    tabIndex={-1}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                <div className="flex gap-3">
                  <Button 
                    type="button"
                    variant="outline" 
                    className="w-full h-12 text-base border-2 hover:border-primary hover:text-primary transition-colors"
                    onClick={() => setStep('code')}
                  >
                    Back
                  </Button>
                  <Button
                    className="w-full h-12 text-base bg-primary hover:bg-primary-dark text-white font-bold shadow-lg disabled:opacity-60"
                    type="submit"
                    disabled={isLoading}
                  >
                    {isLoading ? "Resetting…" : "Reset Password"}
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
