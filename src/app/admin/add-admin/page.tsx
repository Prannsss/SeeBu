"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UserPlus } from "lucide-react"
import { AdminDock } from "@/components/navigation/AdminDock"

export default function AddAdminPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white pb-32 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto max-w-3xl px-4 py-10">
        <div className="mb-6 flex items-center gap-3">
          <UserPlus className="h-7 w-7 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold">Add Admin</h1>
            <p className="text-muted-foreground">Invite and provision new admin access.</p>
          </div>
        </div>

        <Card className="border-blue-100/70 bg-white/85 backdrop-blur">
          <CardHeader>
            <CardTitle>Admin Account Setup</CardTitle>
            <CardDescription>Provide verified details for role assignment.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" placeholder="Maria Santos" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Work Email</Label>
              <Input id="email" type="email" placeholder="maria@seebu.gov" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <Input id="role" placeholder="Operations Admin" />
            </div>
            <Button className="w-full bg-blue-600 hover:bg-blue-700">Create Admin</Button>
          </CardContent>
        </Card>
      </div>

      <AdminDock />
    </div>
  )
}
