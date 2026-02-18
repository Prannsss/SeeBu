
"use client";

import { Button } from "@/components/ui/button";
import { Building2, Mail, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function VerifyPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in-95 duration-500">
        <div className="bg-white p-12 rounded-3xl shadow-2xl border text-center flex flex-col items-center">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-8 animate-pulse">
            <Mail className="h-10 w-10" />
          </div>
          <h1 className="text-3xl font-bold font-headline tracking-tight mb-4">Check your email</h1>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            We've sent a verification link to your email. Please click the link to verify your account and start using SeeBu.
          </p>
          
          <div className="w-full space-y-4">
            <Button variant="outline" className="w-full h-12">
              Resend verification email
            </Button>
            <Button className="w-full h-12 bg-primary text-primary-foreground" asChild>
              <Link href="/login">
                Go to Login <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          
          <div className="mt-12 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary/50" />
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-widest">SeeBu Platform</span>
          </div>
        </div>
      </div>
    </div>
  );
}
