
"use client";

import { Button } from "@/components/ui/button";
import BackButton from "@/components/navigation/back-button";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { gooeyToast } from "goey-toast";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // TODO: replace with real API call
      await new Promise(res => setTimeout(res, 800));
      gooeyToast.success("Welcome back!", {
        description: "You've been logged in successfully.",
      });
      router.push("/client");
    } catch {
      gooeyToast.error("Login Failed", {
        description: "Invalid email or password. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
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
            Welcome back! Continue making a difference in Cebu. Track your reports and see the impact you're making in your community.
          </p>
          
          {/* GIF */}
          <div className="rounded-2xl overflow-hidden">
            <Image 
              src="/gifs/auth.gif" 
              alt="SeeBu in action" 
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
          <div className="text-center lg:text-left">
            <div className="md:hidden mb-4 flex justify-center">
              <Image src="/assets/logo.svg" alt="SeeBu Logo" width={60} height={60} />
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-text-main dark:text-white mb-2 sm:mb-3">Welcome Back</h2>
            <p className="text-sm sm:text-base text-text-muted dark:text-gray-400">Access your SeeBu account to track your reports.</p>
          </div>

          <div>
            <form className="space-y-5 sm:space-y-6" onSubmit={handleLogin}>
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
              <div className="floating-input has-right-icon">
                <input 
                  id="password" 
                  type={showPassword ? 'text' : 'password'}
                  placeholder=" "
                  required 
                  minLength={8}
                  maxLength={50}
                />
                <label htmlFor="password">Password</label>
                <span className="material-symbols-outlined input-icon">lock</span>
                <button
                  type="button"
                  className="input-icon-right"
                  onClick={() => setShowPassword(v => !v)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <div className="flex justify-end -mt-2">
                <Link href="/auth/forgot-pw" className="text-xs text-primary hover:text-primary-dark hover:underline">Forgot password?</Link>
              </div>

              <Button
                className="w-full h-12 text-lg bg-primary hover:bg-primary-dark text-white font-bold shadow-lg disabled:opacity-60"
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? "Logging in…" : "Log In"}
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
