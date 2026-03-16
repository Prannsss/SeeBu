"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PlusSquare } from "lucide-react"
import { SuperadminDock } from "@/components/navigation/SuperadminDock"

export default function SuperadminAddPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white pb-32 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto max-w-3xl px-4 py-10">
        <div className="mb-6 flex items-center gap-3">
          <PlusSquare className="h-7 w-7 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold">Add Resource</h1>
            <p className="text-muted-foreground">Provision global resources and assign governance ownership.</p>
          </div>
        </div>

        <Card className="border-blue-100/70 bg-white/85 backdrop-blur">
          <CardHeader>
            <CardTitle>Create Platform Resource</CardTitle>
            <CardDescription>Add a new managed entity with traceable metadata.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="resource-name">Resource Name</Label>
              <Input id="resource-name" placeholder="Emergency Dispatch Feed" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="resource-owner">Owner Team</Label>
              <Input id="resource-owner" placeholder="Incident Operations" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="resource-zone">Coverage Zone</Label>
              <Input id="resource-zone" placeholder="Metro Cebu" />
            </div>
            <Button className="w-full bg-blue-600 hover:bg-blue-700">Create Resource</Button>
          </CardContent>
        </Card>
      </div>

      <SuperadminDock />
    </div>
  )
}
