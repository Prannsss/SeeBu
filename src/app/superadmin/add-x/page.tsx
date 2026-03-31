"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { UserPlus, ShieldAlert, ShieldCheck } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PasswordChecklist } from "@/components/ui/password-checklist"
import { VerificationCodeUI } from "@/components/ui/verification-code"
import { gooeyToast } from "goey-toast"

export default function SuperadminAddPage() {
  const [activeTab, setActiveTab] = useState("admin")
  const [adminPassword, setAdminPassword] = useState("")
  const [superadminPassword, setSuperadminPassword] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const [verifyingEmail, setVerifyingEmail] = useState("")
  
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsVerifying(true)
    gooeyToast.success("Verification code sent!")
  }

  const handleVerifySuccess = () => {
    setIsVerifying(false)
    setAdminPassword("")
    setSuperadminPassword("")
  }

  const handleVerifyCancel = () => {
    setIsVerifying(false)
  }

  return (
    <div className="min-h-screen overflow-y-scroll bg-slate-50 pb-32 dark:bg-slate-950 dark:text-slate-100">
      <div className="container mx-auto max-w-3xl px-5 pt-10 pb-6">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#e5f7fd] dark:bg-[#00B2E2]/20">
            <UserPlus className="h-6 w-6 text-[#00B2E2] dark:text-[#00B2E2]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">User Management</h1>
            <p className="text-muted-foreground">Provision high-level administrative access and assign municipal jurisdictions.</p>
          </div>
        </div>

        {isVerifying ? (
          <div className="max-w-md mx-auto mt-12">
            <VerificationCodeUI 
              onVerify={handleVerifySuccess} 
              onCancel={handleVerifyCancel} 
              email={verifyingEmail || "the provided email"} 
            />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8 bg-transparent p-0 gap-2">
            <TabsTrigger 
              value="admin" 
              className="flex items-center justify-center gap-2 py-3 rounded-lg text-slate-600 dark:text-slate-400 data-[state=active]:bg-[#EAF6FD] dark:data-[state=active]:bg-[#00B2E2]/10 data-[state=active]:text-[#001731] dark:data-[state=active]:text-white data-[state=active]:shadow-none transition-all font-medium"
            >
              <ShieldCheck className="w-4 h-4" /> Add Admin
            </TabsTrigger>
            <TabsTrigger 
              value="superadmin" 
              className="flex items-center justify-center gap-2 py-3 rounded-lg text-slate-600 dark:text-slate-400 data-[state=active]:bg-[#EAF6FD] dark:data-[state=active]:bg-[#00B2E2]/10 data-[state=active]:text-[#001731] dark:data-[state=active]:text-white data-[state=active]:shadow-none transition-all font-medium"
            >
              <ShieldAlert className="w-4 h-4" /> Add Superadmin
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="admin" className="!mt-0 outline-none border-0 w-full">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-800">
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-1">Create Municipal Admin</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Admins manage resources and receive client reports for a specific municipality.
                </p>
              </div>

              <form className="flex flex-col gap-4" onSubmit={handleAddSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="floating-input !mt-0">
                    <input id="admin-name" type="text" placeholder=" " required />
                    <label htmlFor="admin-name">Full Name</label>
                    <span className="material-symbols-outlined input-icon">person</span>
                  </div>
                  <div className="floating-input !mt-0">
                    <input id="admin-contact" type="tel" placeholder=" " required />
                    <label htmlFor="admin-contact">Contact Number</label>
                    <span className="material-symbols-outlined input-icon">call</span>
                  </div>
                </div>
                
                <div className="flex flex-col gap-1">
                  <div className="floating-input !mt-0">
                    <input 
                      id="admin-email" 
                      type="email" 
                      placeholder=" " 
                      required 
                      value={verifyingEmail}
                      onChange={(e) => setVerifyingEmail(e.target.value)}
                    />
                    <label htmlFor="admin-email">Email Address</label>
                    <span className="material-symbols-outlined input-icon">mail</span>
                  </div>
                  <p className="text-xs text-slate-500 ml-1">A verification link will be sent to this email.</p>
                </div>

                <div className="space-y-1 mt-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">Assigned Area (Municipality/City)</label>
                  <Select required>
                    <SelectTrigger className="w-full h-[52px] sm:h-[56px] rounded-[1rem] border-2 border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] text-base px-4 focus:ring-0 focus:border-[#00B2E2] focus:shadow-[0_0_0_3px_rgba(0,178,226,0.1)] transition-all">
                      <SelectValue placeholder="Select a municipality" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 z-[100] shadow-xl">
                      <SelectItem value="cebu_city" className="py-2">Cebu City</SelectItem>
                      <SelectItem value="mandaue_city" className="py-2">Mandaue City</SelectItem>
                      <SelectItem value="lapu_lapu_city" className="py-2">Lapu-Lapu City</SelectItem>
                      <SelectItem value="talisay_city" className="py-2">Talisay City</SelectItem>
                      <SelectItem value="consolacion" className="py-2">Consolacion</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-1 mt-2">
                  <div className="floating-input !mt-0">
                    <input 
                      id="admin-password" 
                      type="password" 
                      placeholder=" " 
                      required 
                      minLength={8}
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                    />
                    <label htmlFor="admin-password">Temporary Password</label>
                    <span className="material-symbols-outlined input-icon">lock</span>
                  </div>
                  <div className="pt-2 pl-1">
                    <PasswordChecklist password={adminPassword} />
                  </div>
                </div>

                <Button className="w-full h-12 mt-4 text-base bg-[#00B2E2] hover:bg-[#0096C7] text-white font-medium shadow-sm transition-all rounded-lg" type="submit">
                  Send Admin Invitation
                </Button>
              </form>
            </div>
          </TabsContent>

          <TabsContent value="superadmin" className="!mt-0 outline-none border-0 w-full">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-800">
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-1">Create Superadmin</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Superadmins have unrestricted global access across all municipalities.
                </p>
              </div>

              <form className="flex flex-col gap-4" onSubmit={handleAddSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="floating-input !mt-0">
                    <input id="sa-name" type="text" placeholder=" " required />
                    <label htmlFor="sa-name">Full Name</label>
                    <span className="material-symbols-outlined input-icon">person</span>
                  </div>
                  <div className="floating-input !mt-0">
                    <input id="sa-contact" type="tel" placeholder=" " required />
                    <label htmlFor="sa-contact">Contact Number</label>
                    <span className="material-symbols-outlined input-icon">call</span>
                  </div>
                </div>
                
                <div className="flex flex-col gap-1">
                  <div className="floating-input !mt-0">
                    <input 
                      id="sa-email" 
                      type="email" 
                      placeholder=" " 
                      required 
                      value={verifyingEmail}
                      onChange={(e) => setVerifyingEmail(e.target.value)}
                    />
                    <label htmlFor="sa-email">Email Address</label>
                    <span className="material-symbols-outlined input-icon">mail</span>
                  </div>
                  <p className="text-xs text-slate-500 ml-1">A verification link will be sent to this email.</p>
                </div>

                <div className="flex flex-col gap-1 mt-2">
                  <div className="floating-input !mt-0">
                    <input 
                      id="sa-password" 
                      type="password" 
                      placeholder=" " 
                      required 
                      minLength={8}
                      value={superadminPassword}
                      onChange={(e) => setSuperadminPassword(e.target.value)}
                    />
                    <label htmlFor="sa-password">Temporary Password</label>
                    <span className="material-symbols-outlined input-icon">lock</span>
                  </div>
                  <div className="pt-2 pl-1">
                    <PasswordChecklist password={superadminPassword} />
                  </div>
                </div>

                <Button className="w-full h-12 mt-4 text-base bg-[#00B2E2] hover:bg-[#0096C7] text-white font-medium shadow-sm transition-all rounded-lg" type="submit">
                  Create Global Superadmin
                </Button>
              </form>
            </div>
          </TabsContent>
        </Tabs>
        )}
      </div>
    </div>
  )
}
