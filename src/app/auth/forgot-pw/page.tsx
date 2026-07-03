"use client";

import { Button } from "@/components/ui/button";
import BackButton from "@/components/navigation/back-button";
import Link from "next/link";
import Image from "next/image";
import { useState, useRef } from "react";
import { Eye, EyeOff } from "lucide-react";
import { gooeyToast } from "goey-toast";
import { useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'development' ? "http://localhost:5000" : "https://seebu.onrender.com");

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'code' | 'password'>('email');
  const [email, setEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [channel, setChannel] = useState<'email' | 'sms'>('email');
  const [contactNumber, setContactNumber] = useState("+63");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const newPasswordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const codeRef = useRef<HTMLInputElement>(null);

  // Phone number formatter for Philippine format (same as signup page)
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

  // ── Step 1: Request OTP ─────────────────────────────────────────────────
  // Note: the backend intentionally responds identically whether or not an
  // account exists (prevents account enumeration), so we always advance to
  // the code step and use the email/number the user typed, not anything
  // echoed back by the server.
  const requestCode = async (channelVal: 'email' | 'sms', emailVal?: string, contactNumberVal?: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: channelVal,
          ...(channelVal === "sms" ? { contact_number: contactNumberVal } : { email: emailVal }),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        if (emailVal) setEmail(emailVal);
        setChannel(channelVal);
        gooeyToast.success("Code Sent", {
          description: data.message || `If an account exists, a 6-digit verification code has been sent via ${channelVal === "sms" ? "SMS" : "email"}.`,
        });
        setStep("code");
      } else {
        gooeyToast.error("Failed to Send", {
          description: data.error || "Could not send the code. Please try again.",
        });
      }
    } catch {
      gooeyToast.error("Network Error", {
        description: "Could not connect to the server. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (channel === "sms") {
      if (contactNumber.replace(/\D/g, '').length < 12) {
        gooeyToast.error("Invalid Number", {
          description: "Please enter a complete phone number.",
        });
        return;
      }
      await requestCode("sms", undefined, contactNumber);
      return;
    }

    const emailVal = emailRef.current?.value?.trim() ?? "";
    if (!emailVal) return;
    await requestCode("email", emailVal);
  };

  // ── Step 2: Validate OTP ────────────────────────────────────────────────
  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const codeVal = codeRef.current?.value?.trim() ?? "";

    if (codeVal.length !== 6 || !/^\d{6}$/.test(codeVal)) {
      gooeyToast.error("Invalid Code", {
        description: "Please enter the 6-digit code sent to your email.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/verify-reset-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: codeVal }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Invalid or expired code");
      }

      setResetCode(codeVal);
      gooeyToast.success("Code Verified!", {
        description: "You can now set a new password.",
      });
      setStep("password");
    } catch (err: any) {
      gooeyToast.error("Invalid Code", {
        description: err.message || "The code you entered is incorrect or has expired.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ── Step 3: Reset Password ──────────────────────────────────────────────
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newPw = newPasswordRef.current?.value ?? "";
    const confirmPw = confirmPasswordRef.current?.value ?? "";

    if (newPw !== confirmPw) {
      gooeyToast.error("Passwords Don't Match", {
        description: "Please make sure both password fields are identical.",
      });
      return;
    }

    if (newPw.length < 8) {
      gooeyToast.error("Password Too Short", {
        description: "Password must be at least 8 characters.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: resetCode, new_password: newPw }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Password reset failed");
      }

      gooeyToast.success("Password Reset!", {
        description: "Your password has been updated. Redirecting to login…",
      });

      setTimeout(() => router.push("/auth/login"), 2000);
    } catch (err: any) {
      gooeyToast.error("Reset Failed", {
        description: err.message || "Something went wrong. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const stepTitles = {
    email: "Forgot Password?",
    code: "Enter Verification Code",
    password: "Set New Password",
  };

  const stepDescriptions = {
    email: channel === "sms"
      ? "Enter your phone number and we'll send you a verification code via SMS."
      : "Enter your email and we'll send you a verification code.",
    code: channel === "sms"
      ? "We've sent a 6-digit code to your phone via SMS. Enter it below."
      : `We've sent a 6-digit code to ${email || "your email"}. Enter it below.`,
    password: "Create a strong new password for your account.",
  };

  return (
    <div className="min-h-screen flex bg-background-light dark:bg-gray-950">
      <BackButton
        fallbackPath="/"
        className="fixed top-4 left-4 sm:top-6 sm:left-6 z-50 hidden md:flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors"
      />

      {/* Left Side */}
      <div className="hidden lg:flex lg:w-1/2 p-12 items-center justify-center relative overflow-hidden auth-bg">
        <div className="relative z-10 max-w-lg w-full">
          <h1 className="text-4xl lg:text-5xl font-black text-gray-900 mb-6">
            Be Part of the <span className="font-display italic text-yellow-500">Solution</span>
          </h1>
          <p className="text-gray-700 text-lg mb-8 leading-relaxed">
            Don&apos;t worry! Resetting your password is easy. Just follow the steps and you&apos;ll be back making a difference in no time.
          </p>
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

      {/* Right Side */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 lg:p-12 pt-20 sm:pt-24 lg:pt-12">
        <div className="w-full max-w-md space-y-6 sm:space-y-8 animate-in fade-in duration-500">

          {/* Step indicator */}
          <div className="flex items-center gap-2 justify-center lg:justify-start">
            {(["email", "code", "password"] as const).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    step === s
                      ? "bg-primary text-white shadow-md"
                      : ["email", "code", "password"].indexOf(step) > i
                      ? "bg-green-500 text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-400"
                  }`}
                >
                  {["email", "code", "password"].indexOf(step) > i ? "✓" : i + 1}
                </div>
                {i < 2 && (
                  <div
                    className={`w-8 h-0.5 rounded ${
                      ["email", "code", "password"].indexOf(step) > i
                        ? "bg-green-500"
                        : "bg-gray-200 dark:bg-gray-700"
                    }`}
                  />
                )}
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
            {/* ── Step 1: Email or Phone ── */}
            {step === "email" && (
              <form className="space-y-5 sm:space-y-6" onSubmit={handleEmailSubmit}>
                {channel === "email" ? (
                  <div className="floating-input">
                    <input
                      id="email"
                      type="email"
                      ref={emailRef}
                      placeholder=" "
                      required
                      maxLength={100}
                    />
                    <label htmlFor="email">Email</label>
                    <span className="material-symbols-outlined input-icon">mail</span>
                  </div>
                ) : (
                  <div className="floating-input">
                    <input
                      id="contact"
                      type="tel"
                      placeholder=" "
                      required
                      value={contactNumber}
                      onChange={(e) => setContactNumber(formatPhoneNumber(e.target.value))}
                      maxLength={13}
                    />
                    <label htmlFor="contact">Contact Number</label>
                    <span className="material-symbols-outlined input-icon">phone</span>
                  </div>
                )}

                <Button
                  className="w-full h-12 text-lg bg-primary hover:bg-primary-dark text-white font-bold shadow-lg disabled:opacity-60"
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? "Sending…" : "Send Verification Code"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-12 text-base border-2 hover:border-primary hover:text-primary transition-colors"
                  onClick={() => setChannel(channel === "email" ? "sms" : "email")}
                  disabled={isLoading}
                >
                  {channel === "email" ? "Send via SMS instead" : "Send via email instead"}
                </Button>
              </form>
            )}

            {/* ── Step 2: Verification Code ── */}
            {step === "code" && (
              <form className="space-y-5 sm:space-y-6" onSubmit={handleCodeSubmit}>
                <div className="floating-input">
                  <input
                    id="code"
                    type="text"
                    inputMode="numeric"
                    ref={codeRef}
                    placeholder=" "
                    required
                    maxLength={6}
                    pattern="[0-9]{6}"
                    className="text-center text-2xl tracking-widest font-bold"
                  />
                  <label htmlFor="code">6-Digit Verification Code</label>
                  <span className="material-symbols-outlined input-icon">pin</span>
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-12 text-base border-2 hover:border-primary hover:text-primary transition-colors"
                    onClick={() => setStep("email")}
                    disabled={isLoading}
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

            {/* ── Step 3: New Password ── */}
            {step === "password" && (
              <form className="space-y-5 sm:space-y-6" onSubmit={handlePasswordSubmit}>
                {/* New Password */}
                <div className="floating-input has-right-icon">
                  <input
                    id="new-password"
                    ref={newPasswordRef}
                    type={showNewPassword ? "text" : "password"}
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
                    onClick={() => setShowNewPassword((v) => !v)}
                    tabIndex={-1}
                    aria-label={showNewPassword ? "Hide password" : "Show password"}
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
                    type={showConfirmPassword ? "text" : "password"}
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
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    tabIndex={-1}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-12 text-base border-2 hover:border-primary hover:text-primary transition-colors"
                    onClick={() => setStep("code")}
                    disabled={isLoading}
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
                Remember your password?{" "}
                <Link href="/auth/login" className="text-primary font-bold hover:underline">
                  Log in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
