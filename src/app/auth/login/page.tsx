
"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function LoginPage() {
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
            Welcome back! Continue making a difference in Cebu. Track your reports and see the impact you're making in your community.
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
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-text-main dark:text-white mb-2 sm:mb-3">Welcome Back</h2>
            <p className="text-sm sm:text-base text-text-muted dark:text-gray-400">Access your SeeBu account to track your reports.</p>
          </div>

          <div>
            <form className="space-y-5 sm:space-y-6">
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

              <div className="flex justify-end -mt-2">
                <Link href="/auth/forgot-pw" className="text-xs text-primary hover:text-primary-dark hover:underline">Forgot password?</Link>
              </div>

              <Button className="w-full h-12 text-lg bg-primary hover:bg-primary-dark text-white font-bold shadow-lg" type="submit">
                Log In
              </Button>
            </form>
            
            <div className="mt-6 pt-6 border-t border-gray-300 dark:border-gray-700 text-center">
              <p className="text-sm text-text-muted dark:text-gray-400">
                Don't have an account? <Link href="/auth/register" className="text-primary font-bold hover:underline">Sign up now</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
