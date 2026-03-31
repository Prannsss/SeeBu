"use client"

import { useState } from "react"
import { LogOut, Pencil } from "lucide-react"
import { useRouter } from "next/navigation"
import { logoutUser } from "@/app/actions/user.actions"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { gooeyToast } from "goey-toast"

export default function SuperadminProfilePage() {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)

  const handleLogout = async () => {
    await logoutUser()
    gooeyToast.success("Logged out successfully")
    router.push("/auth/login")
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setIsEditing(false)
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-32 dark:bg-slate-950 dark:text-slate-100">
      <div className="container mx-auto max-w-2xl px-5 pt-10 pb-6">
        <h1 className="text-3xl font-extrabold mb-8 text-text-main dark:text-white">Profile</h1>
        
        <div className="mb-6 flex items-center gap-4">
          <Avatar className="h-16 w-16 border-2 border-primary/10">
            <AvatarImage src="/placeholder-user.jpg" alt="Profile" />
            <AvatarFallback className="bg-primary/5 text-xl">U</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-slate-500 text-sm mb-1">Welcome,</p>
            <h2 className="text-[22px] font-black uppercase tracking-tight text-text-main dark:text-white">USER</h2>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm mb-6 p-5 sm:p-6 space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold text-lg text-text-main dark:text-white">Personal Information</h3>
              <p className="text-sm text-text-muted dark:text-gray-400">Keep your details up to date.</p>
            </div>
            <button 
              onClick={() => setIsEditing(!isEditing)}
              className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
              aria-label="Edit Profile"
            >
              <Pencil className="w-5 h-5" />
            </button>
          </div>

          {!isEditing ? (
            <div className="space-y-4 pt-2">
              
              <div className="pb-3 border-b border-slate-100 dark:border-slate-800 last:border-0 last:pb-0">
                <span className="block text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">System Admin Name</span>
                <span className="block text-base text-text-main dark:text-white font-medium">Super Admin</span>
              </div>
              
              <div className="pb-3 border-b border-slate-100 dark:border-slate-800 last:border-0 last:pb-0">
                <span className="block text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">Master Email</span>
                <span className="block text-base text-text-main dark:text-white font-medium">master@system.com</span>
              </div>
              
              <div className="pb-3 border-b border-slate-100 dark:border-slate-800 last:border-0 last:pb-0">
                <span className="block text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">Access Level</span>
                <span className="block text-base text-text-main dark:text-white font-medium">Level 5 (Unrestricted)</span>
              </div>
              
            </div>
          ) : (
            <form className="space-y-6 pt-2" onSubmit={handleSave}>
              
              <div className="floating-input">
                <input type="text" id="system-admin-name" placeholder=" " defaultValue="Super Admin" />
                <label htmlFor="system-admin-name">System Admin Name</label>
                <span className="material-symbols-outlined input-icon">shield_person</span>
              </div>
              
              <div className="floating-input">
                <input type="email" id="master-email" placeholder=" " defaultValue="master@system.com" />
                <label htmlFor="master-email">Master Email</label>
                <span className="material-symbols-outlined input-icon">mail</span>
              </div>
              
              <div className="floating-input">
                <input type="text" id="access-level" placeholder=" " defaultValue="Level 5 (Unrestricted)" />
                <label htmlFor="access-level">Access Level</label>
                <span className="material-symbols-outlined input-icon">admin_panel_settings</span>
              </div>
              
              
              <Button className="w-full h-12 mt-2 text-lg bg-primary hover:bg-primary-dark text-white font-bold shadow-lg" type="submit">
                Save Changes
              </Button>
            </form>
          )}
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 dark:bg-red-900/80 dark:hover:bg-red-900 text-white border border-transparent font-bold h-12 rounded-[8px] shadow-sm mb-8 transition-colors"
            >
              <LogOut className="h-4 w-4 text-white" />
              <span className="text-base text-white">Logout</span>
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to logout?</AlertDialogTitle>
              <AlertDialogDescription>
                You will need to sign in again to access your account.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleLogout} className="bg-red-600 text-white hover:bg-red-700">Logout</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>


    </div>
  )
}
