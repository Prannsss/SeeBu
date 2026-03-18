"use client"

import { Button } from "@/components/ui/button"
import { UserPlus } from "lucide-react"
import { AdminDock } from "@/components/navigation/AdminDock"

export default function AddAdminPage() {
  return (
    <div className="min-h-screen bg-white pb-32 dark:bg-slate-950 dark:text-slate-100">
      <div className="container mx-auto max-w-2xl px-5 pt-10 pb-6">
        <div className="mb-6 flex items-center gap-3">
          <UserPlus className="h-7 w-7 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold">Add Admin</h1>
            <p className="text-muted-foreground">Invite and provision new admin access.</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-6">
          <div>
            <h3 className="font-bold text-lg text-text-main dark:text-white">Admin Account Setup</h3>
            <p className="text-sm text-text-muted dark:text-gray-400">Provide verified details for role assignment.</p>
          </div>
          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            <div className="floating-input">
              <input type="text" id="name" placeholder=" " />
              <label htmlFor="name">Name</label>
              <span className="material-symbols-outlined input-icon">person</span>
            </div>
            <div className="floating-input">
              <input type="email" id="email" placeholder=" " />
              <label htmlFor="email">Work Email</label>
              <span className="material-symbols-outlined input-icon">mail</span>
            </div>
            <div className="floating-input">
              <input type="text" id="role" placeholder=" " />
              <label htmlFor="role">Role</label>
              <span className="material-symbols-outlined input-icon">badge</span>
            </div>
            <Button className="w-full h-12 mt-2 text-lg bg-primary hover:bg-primary-dark text-white font-bold shadow-lg" type="submit">
              Create Admin
            </Button>
          </form>
        </div>
      </div>

      <AdminDock />
    </div>
  )
}
