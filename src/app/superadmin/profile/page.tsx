"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UserCog } from "lucide-react"
import { SuperadminDock } from "@/components/navigation/SuperadminDock"

export default function SuperadminProfilePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white pb-32 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto max-w-3xl px-4 py-10">
        <div className="mb-6 flex items-center gap-3">
          <UserCog className="h-7 w-7 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold">Superadmin Profile</h1>
            <p className="text-muted-foreground">Maintain elevated account settings and incident contact details.</p>
          </div>
        </div>

        <Card className="border-blue-100/70 bg-white/85 backdrop-blur">
          <CardHeader>
            <CardTitle>Governance Profile</CardTitle>
            <CardDescription>Configure identity and escalation controls.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="super-name">Name</Label>
              <Input id="super-name" defaultValue="Superadmin User" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="super-email">Email</Label>
              <Input id="super-email" type="email" defaultValue="superadmin@seebu.gov" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="super-contact">Emergency Contact</Label>
              <Input id="super-contact" defaultValue="+639171234500" />
            </div>
            <Button className="w-full bg-blue-600 hover:bg-blue-700">Save Profile</Button>
          </CardContent>
        </Card>
      </div>

      <SuperadminDock />
    </div>
  )
}
