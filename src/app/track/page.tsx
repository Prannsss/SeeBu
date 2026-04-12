"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import Image from "next/image";
import { Navbar } from "@/components/Navbar";
import { gooeyToast } from "goey-toast";

import { useRouter } from "next/navigation";

export default function TrackPage() {
  const router = useRouter();
  const [trackingNumber, setTrackingNumber] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingNumber.trim()) return;

    setIsSearching(true);
    try {
      const res = await fetch(`http://localhost:5000/api/v1/reports/${trackingNumber.trim().toUpperCase()}`);
      
      if (!res.ok) {
        throw new Error("Failed to find the tracking number.");
      }
      
      // If found, redirect to client tracking page where info is displayed 
      // OR display it right here. We'll redirect to client tracking page for better UI
      router.push(`/client/tracking?id=${trackingNumber.trim().toUpperCase()}`);

    } catch {
      gooeyToast.error("Error", {
        description: "Failed to find the tracking number."
      });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Navbar />

      <div className="flex-1 flex flex-col items-center justify-center p-6 w-full max-w-lg mx-auto pt-24">
        <div className="bg-white dark:bg-gray-900 shadow-xl rounded-3xl p-8 w-full border border-gray-100 dark:border-gray-800 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <Search className="w-10 h-10 text-primary" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mb-2">
            Track Issue
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8 text-sm sm:text-base">
            Enter the tracking number provided when you submitted your report to
            view its current status.
          </p>

          <form onSubmit={handleSearch} className="space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="e.g. RPT-1234"
                className="w-full pl-11 pr-4 py-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-gray-900 dark:text-white uppercase font-mono tracking-wider"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                maxLength={20}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary-dark text-white font-bold h-14 rounded-2xl text-lg shadow-lg disabled:opacity-70 transition-all"
              disabled={isSearching || !trackingNumber.trim()}
            >
              {isSearching ? "Searching..." : "Track Status"}
            </Button>
          </form>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>Need help finding your tracking number?</p>
          <p>
            Check the email address you provided when submitting the report.
          </p>
        </div>
      </div>
    </main>
  );
}
