
"use client";

import { Button } from "@/components/ui/button";
import BackButton from "@/components/navigation/back-button";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { gooeyToast } from "goey-toast";
import { useRouter } from "next/navigation";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
import FacebookLogin from "react-facebook-login/dist/facebook-login-render-props";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const apiBase = process.env.NEXT_PUBLIC_API_URL || '';

  const establishSession = async (token: string, role: string) => {
    const res = await fetch('/api/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, role }),
    });
    if (!res.ok) throw new Error('Failed to establish session');
  };

  const handleOAuthBackendSync = async (provider: 'google' | 'facebook', payload: any) => {
    payload.action = 'login';
    const res = await fetch(`${apiBase}/api/v1/auth/${provider}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'OAuth Login failed');

    if (!data.user?.role) throw new Error('OAuth login response missing user role');
    await establishSession(data.token, data.user.role);
    localStorage.setItem('user-profile', JSON.stringify(data.user));

    gooeyToast.success("Welcome back!", { description: `Logged in via ${provider}` });
    router.push('/client'); // OAuth strictly assigns client
  };

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      gooeyToast.error("Google Login Failed", { description: "No credential returned by Google." });
      return;
    }
    try {
      setIsLoading(true);
      await handleOAuthBackendSync('google', { credential: credentialResponse.credential });
    } catch (err: any) {
      gooeyToast.error("Google Login Failed", { description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFacebookCallback = async (response: any) => {
    if (response?.status === "unknown" || response?.error || !response?.accessToken) {
      return;
    }
    setIsLoading(true);
    try {
      await handleOAuthBackendSync('facebook', { accessToken: response.accessToken });
    } catch (err: any) {
       gooeyToast.error("Facebook Login Failed", { description: err.message });
    } finally {
       setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Defaulting role to user for constituent login. 
    // You can adjust this if this page is intended for admins too.
    const payload = {
      email: (document.getElementById("email") as HTMLInputElement).value,
      password: (document.getElementById("password") as HTMLInputElement).value,
      role: "user" 
    };

    try {
      const res = await fetch(`${apiBase}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Login failed');
      }

      if (!data.user?.role) {
        throw new Error('Login response missing user role');
      }

      // Establish an httpOnly session cookie (read by Next.js Middleware server-side)
      await establishSession(data.token, data.user.role);
      localStorage.setItem('user-profile', JSON.stringify(data.user));

      // Determine redirect path based on role
      let redirectPath = '/client';
      if (data.user?.role === 'admin') redirectPath = '/admin';
      else if (data.user?.role === 'superadmin') redirectPath = '/superadmin';
      else if (data.user?.role === 'workforce') redirectPath = '/workforce';
      else if (data.user?.role === 'workforce-admin') redirectPath = '/workforce-admin';

      // Start navigation immediately — React will suspend and show the destination's loading.tsx
      router.push(redirectPath);

      // Show toast after navigation starts (toast renders in a portal, won't block React)
      // Use a small delay to ensure React has started the transition
      setTimeout(() => {
        gooeyToast.success("Welcome back!", {
          description: "You've been logged in successfully.",
        });
      }, 50);
    } catch (err: any) {
      gooeyToast.error("Login Failed", {
        description: err.message || "Invalid email or password. Please try again.",
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

            <div className="mt-8 flex items-center justify-center space-x-4">
              <span className="h-px bg-gray-300 dark:bg-gray-700 w-full"></span>
              <span className="text-gray-500 font-medium text-sm">OR</span>
              <span className="h-px bg-gray-300 dark:bg-gray-700 w-full"></span>
            </div>

            <div className="mt-6 flex flex-col space-y-4">
              <div className="relative w-full h-12">
                <Button
                  type="button"
                  variant="outline"
                  tabIndex={-1}
                  className="w-full h-12 flex items-center justify-center gap-3 font-semibold text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 pointer-events-none"
                >
                  <Image src="/assets/google.svg" alt="Google" width={20} height={20} />
                  Continue with Google
                </Button>
                <div className="absolute inset-0 overflow-hidden opacity-0 [&>div]:w-full [&>div]:h-full [&_iframe]:!w-full [&_iframe]:!h-full">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => gooeyToast.error("Google Login Failed", { description: "Failed to connect to Google." })}
                    width="100%"
                    size="large"
                  />
                </div>
              </div>
              <FacebookLogin
                appId={process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || ""}
                callback={handleFacebookCallback}
                fields="name,email,picture"
                render={(renderProps: any) => (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-12 flex items-center justify-center gap-3 font-semibold text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                    onClick={renderProps.onClick}
                  >
                    <Image src="/assets/facebook.svg" alt="Facebook" width={24} height={24} />
                    Continue with Facebook
                  </Button>
                )}
              />
            </div>
            
            <div className="mt-8 pt-6 border-t border-gray-300 dark:border-gray-700 text-center">
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
