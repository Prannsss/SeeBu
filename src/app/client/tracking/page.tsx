"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Search } from "lucide-react";

export default function TrackingPage() {
  const [trackingNumber, setTrackingNumber] = useState("");

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingNumber) return;
  };

  return (
    <div className="min-h-screen bg-white pb-32 dark:bg-slate-950">
      <div className="container mx-auto max-w-lg px-4 pt-16">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-text-main dark:text-white mb-2">Track Your Request</h1>
          <p className="text-base text-text-muted dark:text-gray-400">
            Enter your tracking number below to check the status of your reported issue.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 sm:p-8 animate-in fade-in duration-500">
          <form onSubmit={handleTrack} className="space-y-6">
            <div className="floating-input">
              <input
                id="tracking"
                type="text"
                placeholder=" "
                required
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
              />
              <label htmlFor="tracking">Tracking Number</label>
              <span className="material-symbols-outlined input-icon">tag</span>
            </div>
            
            <Button type="submit" className="w-full h-12 text-lg bg-primary hover:bg-primary-dark text-white font-bold shadow-lg">
              <Search className="mr-2 h-5 w-5" />
              Track Status
            </Button>
          </form>
        </div>
      </div>

    </div>
  );
}
