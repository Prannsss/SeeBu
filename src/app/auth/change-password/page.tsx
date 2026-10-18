"use client";

import { useState } from "react";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";
import { gooeyToast } from "goey-toast";
import { Button } from "@/components/ui/button";
import { PasswordChecklist } from "@/components/ui/password-checklist";
import { apiClient } from "@/lib/api";

// Same rules as <PasswordChecklist /> and the backend.
const meetsRules = (pw: string) =>
  pw.length >= 8 && /[A-Z]/.test(pw) && /[a-z]/.test(pw) && /[0-9]/.test(pw) && /[^A-Za-z0-9]/.test(pw);

/**
 * Invited staff land here right after their first sign-in (middleware.ts only lets them in while
 * the account still needs a password), replace the temporary password, then go to their dashboard.
 */
export default function ChangePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const mismatch = confirmPassword.length > 0 && confirmPassword !== password;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetsRules(password)) {
      gooeyToast.error("Password Too Weak", { description: "Please meet every requirement in the list below the password." });
      return;
    }
    if (password !== confirmPassword) {
      gooeyToast.error("Passwords Don't Match", { description: "Please make sure both password fields are identical." });
      return;
    }

    setIsLoading(true);
    try {
      const { data } = await apiClient.auth.changePassword(password);
      await fetch("/api/session", { method: "PATCH" }).catch(() => {});
      gooeyToast.success("You're all set!", { description: "Your password was updated. Taking you to your dashboard…" });
      // Full navigation so the middleware sees the cleared setup cookie.
      window.location.href = data?.home || "/";
    } catch (err: any) {
      gooeyToast.error("Couldn't Update Password", { description: err?.message || "Something went wrong. Please try again." });
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    await fetch("/api/session", { method: "DELETE" }).catch(() => {});
    window.location.href = "/auth/login";
  };

  return (
    <div className="min-h-screen flex bg-background-light dark:bg-gray-950">
      {/* Left Side */}
      <div className="hidden lg:flex lg:w-1/2 p-12 items-center justify-center relative overflow-hidden auth-bg">
        <div className="relative z-10 max-w-lg w-full">
          <h1 className="text-4xl lg:text-5xl font-black text-gray-900 mb-6">
            Be Part of the <span className="font-display italic text-yellow-500">Solution</span>
          </h1>
          <p className="text-gray-700 text-lg mb-8 leading-relaxed">
            You&apos;re almost ready! Set your own password and you&apos;ll be on your way to your dashboard.
          </p>
          <div className="rounded-2xl overflow-hidden">
            <Image src="/gifs/verify.webp" alt="Setting up your account" width={800} height={800} unoptimized className="w-full h-auto" />
          </div>
        </div>
      </div>

      {/* Right Side */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 lg:p-12 pt-20 sm:pt-24 lg:pt-12">
        <div className="w-full max-w-md space-y-6 sm:space-y-8 animate-in fade-in duration-500">
          <div className="text-center lg:text-left">
            <div className="md:hidden mb-4 flex justify-center">
              <Image src="/assets/logo-128.png" alt="SeeBu Logo" width={60} height={60} />
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-text-main dark:text-white mb-2 sm:mb-3">
              Set Your Password
            </h2>
            <p className="text-sm sm:text-base text-text-muted dark:text-gray-400">
              Welcome to SeeBu! For your security, replace the temporary password from your invitation with one only you know.
            </p>
          </div>

          <form className="space-y-5 sm:space-y-6" onSubmit={handleSubmit}>
            <div>
              <div className="floating-input has-right-icon">
                <input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  placeholder=" "
                  required
                  minLength={8}
                  maxLength={50}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-describedby="password-rules"
                />
                <label htmlFor="new-password">New Password</label>
                <span className="material-symbols-outlined input-icon">lock</span>
                <button
                  type="button"
                  className="input-icon-right"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div id="password-rules" className="pl-1">
                <PasswordChecklist password={password} />
              </div>
            </div>

            <div>
              <div className="floating-input has-right-icon">
                <input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder=" "
                  required
                  minLength={8}
                  maxLength={50}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  aria-invalid={mismatch}
                  aria-describedby={mismatch ? "confirm-hint" : undefined}
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
              {mismatch && (
                <p id="confirm-hint" className="text-sm text-red-700 mt-2 ml-1">Passwords don&apos;t match yet.</p>
              )}
            </div>

            <Button
              className="w-full h-12 text-lg bg-primary hover:bg-primary-dark text-white font-bold shadow-lg disabled:opacity-60"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? "Saving…" : "Set Password & Continue"}
            </Button>
          </form>

          <div className="pt-6 border-t border-gray-300 dark:border-gray-700 text-center">
            <p className="text-sm text-text-muted dark:text-gray-400">
              Not you?{" "}
              <button type="button" onClick={signOut} className="text-primary font-bold hover:underline">
                Sign out
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
