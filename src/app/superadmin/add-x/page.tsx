"use client"

import { Button } from "@/components/ui/button"
import { PlusSquare } from "lucide-react"
import { SuperadminDock } from "@/components/navigation/SuperadminDock"

export default function SuperadminAddPage() {
  return (
    <div className="min-h-screen bg-white pb-32 dark:bg-slate-950 dark:text-slate-100">
      <div className="container mx-auto max-w-2xl px-5 pt-10 pb-6">
        <div className="mb-6 flex items-center gap-3">
          <PlusSquare className="h-7 w-7 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold">Add Resource</h1>
            <p className="text-muted-foreground">Provision global resources and assign governance ownership.</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-6">
          <div>
            <h3 className="font-bold text-lg text-text-main dark:text-white">Create Platform Resource</h3>
            <p className="text-sm text-text-muted dark:text-gray-400">Add a new managed entity with traceable metadata.</p>
          </div>
          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            <div className="floating-input">
              <input type="text" id="resource-name" placeholder=" " />
              <label htmlFor="resource-name">Resource Name</label>
              <span className="material-symbols-outlined input-icon">dashboard_customize</span>
            </div>
            <div className="floating-input">
              <input type="text" id="resource-owner" placeholder=" " />
              <label htmlFor="resource-owner">Owner Team</label>
              <span className="material-symbols-outlined input-icon">group</span>
            </div>
            <div className="floating-input">
              <input type="text" id="resource-zone" placeholder=" " />
              <label htmlFor="resource-zone">Coverage Zone</label>
              <span className="material-symbols-outlined input-icon">share_location</span>
            </div>
            <Button className="w-full h-12 mt-2 text-lg bg-primary hover:bg-primary-dark text-white font-bold shadow-lg" type="submit">
              Create Resource
            </Button>
          </form>
        </div>
      </div>

      <SuperadminDock />
    </div>
  )
}
