
"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import BackButton from "@/components/navigation/back-button";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import FacebookLogin from "react-facebook-login/dist/facebook-login-render-props";
import { Eye, EyeOff } from "lucide-react";
import { gooeyToast } from "goey-toast";

export default function RegisterPage() {
  const router = useRouter();
  const [contactNumber, setContactNumber] = useState("+63");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const handleOAuthBackendSync = async (provider: 'google' | 'facebook', payload: any) => {
    const res = await fetch(`http://localhost:5000/api/v1/auth/${provider}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'OAuth Registration failed');

    document.cookie = `auth-token=${data.token}; path=/; max-age=86400; SameSite=Lax`;
    if (data.user && data.user.role) {
      document.cookie = `user-role=${data.user.role}; path=/; max-age=86400; SameSite=Lax`;
    }

    gooeyToast.success('Registration via OAuth successful!', { description: `Logged in via ${provider}` });
    router.push('/client');
  };

  const loginGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setIsLoading(true);
        const userInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        }).then(res => res.json());
        
        await handleOAuthBackendSync('google', {
          email: userInfo.email,
          full_name: userInfo.name,
          google_id: userInfo.sub
        });
      } catch (err: any) {
        gooeyToast.error('Google Login Failed', { description: err.message });
      } finally {
        setIsLoading(false);
      }
    },
    onError: () => {
      gooeyToast.error('Google Login Failed', { description: 'Failed to connect to Google.' });
    }
  });

  const handleFacebookCallback = async (response: any) => {
    if (response?.status === 'unknown' || response?.error) {
      return;
    }
    setIsLoading(true);
    try {
      await handleOAuthBackendSync('facebook', {
        email: response.email,
        full_name: response.name,
        facebook_id: response.id
      });
    } catch (err: any) {
       gooeyToast.error('Facebook Login Failed', { description: err.message });
    } finally {
       setIsLoading(false);
    }
  };

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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // TODO: replace with real API call
      await new Promise(res => setTimeout(res, 800));
      gooeyToast.success("Account Created!", {
        description: "Check your email to verify your account.",
      });
      router.push('/auth/verify');
    } catch {
      gooeyToast.error("Sign Up Failed", {
        description: "Something went wrong. Please try again.",
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
            Join thousands of Cebu residents making a real impact. Report issues, track progress, and help build a smarter city together.
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
              <p className="text-xs text-text-muted dark:text-gray-400 -mt-3 ml-1">Minimum 8 characters with at least one number.</p>

              <div className="flex items-start space-x-2 pt-2">
                <Checkbox id="terms" required />
                <label htmlFor="terms" className="text-xs leading-relaxed peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-text-muted dark:text-gray-400">
                  I agree to SeeBu's <Link href="#" className="text-primary underline hover:text-primary-dark">Terms of Service</Link> and <Link href="#" className="text-primary underline hover:text-primary-dark">Privacy Policy</Link>.
                </label>
              </div>
              <Button
                className="w-full h-12 text-lg bg-primary hover:bg-primary-dark text-white font-bold shadow-lg disabled:opacity-60"
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? "Creating account…" : "Create Account"}
              </Button>
            </form>
            
            <div className="mt-8 flex items-center justify-center space-x-4">
              <span className="h-px bg-gray-300 dark:bg-gray-700 w-full"></span>
              <span className="text-gray-500 font-medium text-sm">OR</span>
              <span className="h-px bg-gray-300 dark:bg-gray-700 w-full"></span>
            </div>

            <div className="mt-6 flex flex-col space-y-4">
              <Button
                type="button"
                variant="outline"
                className="w-full h-12 flex items-center justify-center gap-3 font-semibold text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                onClick={() => loginGoogle()}
              >
                <Image src="/assets/google.svg" alt="Google" width={24} height={24} />
                Continue with Google
              </Button>
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
