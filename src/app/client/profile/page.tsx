"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UserRound } from "lucide-react"
import { ClientDock } from "@/components/navigation/ClientDock"

export default function ClientProfilePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white pb-32 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto max-w-3xl px-4 py-10">
        <div className="mb-6 flex items-center gap-3">
          <UserRound className="h-7 w-7 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold">Profile</h1>
            <p className="text-muted-foreground">Manage your account and contact details.</p>
          </div>
        </div>

        <Card className="border-blue-100/70 bg-white/85 backdrop-blur">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Keep your information current for report follow-up updates.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="full-name">Full Name</Label>
              <Input id="full-name" placeholder="Juan Dela Cruz" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="juan@email.com" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" placeholder="+639171234567" />
            </div>
            <Button className="w-full bg-blue-600 hover:bg-blue-700">Save Changes</Button>
          </CardContent>
        </Card>
      </div>

      <ClientDock />
    </div>
  )
}
