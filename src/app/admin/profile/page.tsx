"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UserCircle2 } from "lucide-react"
import { AdminDock } from "@/components/navigation/AdminDock"

export default function AdminProfilePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white pb-32 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto max-w-3xl px-4 py-10">
        <div className="mb-6 flex items-center gap-3">
          <UserCircle2 className="h-7 w-7 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold">Admin Profile</h1>
            <p className="text-muted-foreground">Manage your admin identity and security preferences.</p>
          </div>
        </div>

        <Card className="border-blue-100/70 bg-white/85 backdrop-blur">
          <CardHeader>
            <CardTitle>Profile Details</CardTitle>
            <CardDescription>Maintain accurate information for audit and accountability.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="display-name">Display Name</Label>
              <Input id="display-name" defaultValue="Admin User" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="team">Team</Label>
              <Input id="team" defaultValue="Operations" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contact">Contact Number</Label>
              <Input id="contact" defaultValue="+639171112222" />
            </div>
            <Button className="w-full bg-blue-600 hover:bg-blue-700">Update Profile</Button>
          </CardContent>
        </Card>
      </div>

      <AdminDock />
    </div>
  )
}
