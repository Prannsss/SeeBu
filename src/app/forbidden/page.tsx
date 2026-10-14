"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import BackButton from "@/components/navigation/back-button";

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background-light dark:bg-gray-950 p-4">
      <BackButton fallbackPath="/" className="fixed top-6 left-6 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors" />
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <Image 
            src="/assets/forbidden.webp" 
            alt="Forbidden Access" 
            width={300} 
            height={300} 
            className="mb-8"
          />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">Access Denied</h1>
        <p className="text-slate-600 dark:text-gray-400 text-lg">
          You don't have permission to view this page. Please log in with the appropriate credentials.
        </p>
        <div className="pt-6">
          <Button asChild size="lg" className="w-full bg-primary hover:bg-primary-dark text-white font-bold h-14 rounded-full text-lg">
            <Link href="/auth/login">Log In to Continue</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
