"use client"

import { useState, useEffect } from "react"
import { LogOut, Pencil, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { logoutUser, getUserProfile } from "@/app/actions/user.actions"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
import ProfileLoadingSkeleton from "@/components/ui/profile-loading-skeleton"

export default function AdminProfilePage() {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [areaDisplay, setAreaDisplay] = useState<string | null>(null)

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: ""
  })

  useEffect(() => {
    async function loadProfile() {
      const data = await getUserProfile();
      if (data) {
        // Format municipality name: convert 'cebu-city' to 'Cebu City'
        let areaDisplay = data.municipality_name || data.municipality_id || null;
        if (areaDisplay && areaDisplay.includes('-')) {
          areaDisplay = areaDisplay.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
        }
        
        setProfile(data);
        setFormData({
          name: data.full_name || "",
          email: data.email || "",
          phone: data.contact_number || ""
        });
        setAreaDisplay(areaDisplay);
      }
      setIsLoading(false);
    }
    loadProfile();
  }, []);

  const handleLogout = async () => {
    await logoutUser()
    gooeyToast.success("Logged out successfully")
    router.push("/auth/login")
  }

  const handleDeleteAccount = async () => {
    try {
      const { deleteAccount } = await import("@/app/actions/user.actions");
      const res = await deleteAccount();
      if (res.success) {
        gooeyToast.success("Account deleted successfully");
        router.push("/auth/login");
      } else {
        gooeyToast.error(res.error || "Failed to delete account");
      }
    } catch (err) {
      gooeyToast.error("Failed to delete account");
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const { updateUserProfile } = await import("@/app/actions/user.actions");
      const res = await updateUserProfile({
        id: profile.id,
        name: formData.name,
        email: formData.email,
        phone: formData.phone
      });
      
      if (res.success) {
        gooeyToast.success("Profile updated successfully");
        setProfile((prev: any) => ({ ...prev, full_name: formData.name, email: formData.email, contact_number: formData.phone }));
        setIsEditing(false);
      } else {
        gooeyToast.error(res.error || "Update failed");
      }
    } catch (err) {
      gooeyToast.error("Failed to update profile");
    }
  }

  if (isLoading) {
    return <ProfileLoadingSkeleton />
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-32 dark:bg-slate-950 dark:text-slate-100">
      <div className="container mx-auto max-w-4xl px-4 py-8 sm:py-10">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Admin Profile</h1>
            <p className="text-muted-foreground mt-1 tracking-tight">Manage your account settings and preferences.</p>
          </div>
        </div>
        
        <Card className="mb-6 border-slate-200 dark:border-slate-800 shadow-none sm:shadow-sm bg-white dark:bg-slate-900">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-slate-200 dark:border-slate-800 shadow-sm">
                <AvatarFallback className="bg-blue-50 dark:bg-blue-900/30 text-xl font-bold text-blue-600 dark:text-blue-400">
                  {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-slate-500 font-bold uppercase text-xs tracking-wider mb-1">ADMIN</p>
                <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                  {profile?.full_name || 'Loading...'}
                </h2>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6 border-slate-200 dark:border-slate-800 shadow-none sm:shadow-sm bg-white dark:bg-slate-900">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">Information</CardTitle>
              <CardDescription className="mt-1">Keep your details up to date.</CardDescription>
            </div>
            <button 
              onClick={() => setIsEditing(!isEditing)}
              className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors shadow-sm"
              aria-label="Edit Profile"
            >
              <Pencil className="w-4 h-4" />
            </button>
          </CardHeader>
          <CardContent>
            {!isEditing ? (
              <div className="space-y-4 pt-1">
                <div className="pb-4 border-b border-slate-100 dark:border-slate-800/60 last:border-0 last:pb-0">
                  <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-2">Full Name</span>
                  <span className="block text-base text-slate-900 dark:text-white font-medium">{profile?.full_name || 'N/A'}</span>
                </div>
                <div className="pb-4 border-b border-slate-100 dark:border-slate-800/60 last:border-0 last:pb-0">
                  <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-2">Email</span>
                  <span className="block text-base text-slate-900 dark:text-white font-medium">{profile?.email || 'N/A'}</span>
                </div>
                <div className="pb-4 border-b border-slate-100 dark:border-slate-800/60 last:border-0 last:pb-0">
                  <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-2">Phone</span>
                  <span className="block text-base text-slate-900 dark:text-white font-medium">{profile?.contact_number || 'N/A'}</span>
                </div>
              
              
                <div className="pb-4 border-b border-slate-100 dark:border-slate-800/60 last:border-0 last:pb-0">
                  <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-2">Municipality</span>
                  <span className="block text-base text-slate-900 dark:text-white font-medium">{areaDisplay || profile?.municipality_id || 'Global'}</span>
                </div>
              
              </div>
            ) : (
              <form className="space-y-6 pt-2" onSubmit={handleSave}>
                <div className="floating-input">
                  <input type="text" id="full-name" placeholder=" " value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required/>
                  <label htmlFor="full-name">Full Name</label>
                  <span className="material-symbols-outlined input-icon">person</span>
                </div>
                <div className="floating-input">
                  <input type="email" id="email" placeholder=" " value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required/>
                  <label htmlFor="email">Email</label>
                  <span className="material-symbols-outlined input-icon">mail</span>
                </div>
                <div className="floating-input">
                  <input type="tel" id="phone" placeholder=" " value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                  <label htmlFor="phone">Phone</label>
                  <span className="material-symbols-outlined input-icon">call</span>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="button" className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white font-bold shadow-sm" onClick={() => setIsEditing(false)}>Cancel</Button>
                  <Button className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm" type="submit">Save Changes</Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold h-12 rounded-md shadow-sm mb-4 transition-colors">
              <LogOut className="h-4 w-4" />
              <span className="tracking-wide">Logout</span>
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent className="sm:rounded-[16px] rounded-[16px] max-w-[90vw] sm:max-w-md w-full">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl">Logout of account</AlertDialogTitle>
              <AlertDialogDescription className="text-base text-slate-500 dark:text-slate-400">
                Are you sure you want to end your current session?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-4 gap-2 sm:gap-0">
              <AlertDialogCancel className="h-11 rounded-lg font-bold bg-[#13b6ec] hover:bg-[#0fa6d8] text-white border-[#13b6ec]">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleLogout} className="h-11 rounded-md bg-red-600 text-white hover:bg-red-700 font-bold shadow-sm">Logout</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        
      </div>
    </div>
  )
}