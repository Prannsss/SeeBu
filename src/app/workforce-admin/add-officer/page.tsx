"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { PasswordChecklist } from "@/components/ui/password-checklist"

export default function AddOfficerPage() {
  const [officerPassword, setOfficerPassword] = useState("")

  const handleAddOfficer = (e: React.FormEvent) => {
    e.preventDefault()
    alert("Workforce Officer account created. Invitation sent.")
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-32 dark:bg-slate-950 dark:text-slate-100">
      <div className="container mx-auto max-w-lg px-4 pt-10 pb-6">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-text-main dark:text-white mb-2">Register Officer</h1>
          <p className="text-base text-text-muted dark:text-gray-400">
            Create an account for a new officer in your department.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 sm:p-8 animate-in fade-in duration-500">
          <form className="space-y-6" onSubmit={handleAddOfficer}>
            
            <div className="floating-input">
              <input id="officer-name" type="text" placeholder=" " required />
              <label htmlFor="officer-name">Full Name</label>
              <span className="material-symbols-outlined input-icon">person</span>
            </div>
            
            <div className="floating-input">
              <input id="officer-email" type="email" placeholder=" " required />
              <label htmlFor="officer-email">Email Address</label>
              <span className="material-symbols-outlined input-icon">mail</span>
            </div>

            <div className="floating-input">
              <input id="officer-contact" type="tel" placeholder=" " required />
              <label htmlFor="officer-contact">Contact Number</label>
              <span className="material-symbols-outlined input-icon">call</span>
            </div>

            <div className="floating-input">
              <input 
                id="officer-password" 
                type="password" 
                placeholder=" " 
                required 
                minLength={8}
                value={officerPassword}
                onChange={(e) => setOfficerPassword(e.target.value)}
              />
              <label htmlFor="officer-password">Temporary Password</label>
              <span className="material-symbols-outlined input-icon">lock</span>
            </div>
            
            <div className="pt-1">
              <PasswordChecklist password={officerPassword} />
            </div>

            <Button className="w-full h-12 mt-4 text-lg bg-primary hover:bg-primary-dark text-white font-bold shadow-lg transition-all" type="submit">
              Create Officer Account
            </Button>
            
          </form>
        </div>

      </div>
    </div>
  )
}