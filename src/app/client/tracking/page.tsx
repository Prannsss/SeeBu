"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Search } from "lucide-react";
import { ClientDock } from "@/components/navigation/ClientDock";

export default function TrackingPage() {
  const [trackingNumber, setTrackingNumber] = useState("");

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingNumber) return;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white pb-32 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto mt-8 max-w-3xl px-4">
        <Card className="w-full border-blue-200/60 bg-white/85 backdrop-blur dark:bg-slate-900/60">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Track Your Request</CardTitle>
            <CardDescription>
              Enter your tracking number below to check the status of your reported issue.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleTrack} className="flex flex-col gap-3 sm:flex-row">
              <Input
                type="text"
                placeholder="e.g. TRK-123456"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                <Search className="mr-2 h-4 w-4" />
                Track
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
      <ClientDock />
    </div>
  );
}
