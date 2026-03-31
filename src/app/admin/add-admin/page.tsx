"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { UserPlus, HardHat, ShieldCheck, MapPin } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PasswordChecklist } from "@/components/ui/password-checklist"
import { VerificationCodeUI } from "@/components/ui/verification-code"
import { gooeyToast } from "goey-toast"

export default function AdminAddPage() {
  const [activeTab, setActiveTab] = useState("admin")
  const [adminPassword, setAdminPassword] = useState("")
  const [wfPassword, setWfPassword] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const [verifyingEmail, setVerifyingEmail] = useState("")

  // Mocking the inviter's area
  const currentAdminArea = "Cebu City"

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsVerifying(true)
    gooeyToast.success("Verification code sent!")
  }

  const handleVerifySuccess = () => {
    setIsVerifying(false)
    setAdminPassword("")
    setWfPassword("")
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
            <h1 className="text-3xl font-bold">Team Management</h1>
            <p className="text-muted-foreground">Expand your administrative team and register municipal workforce departments.</p>
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
              <ShieldCheck className="w-4 h-4" /> Add Co-Admin
            </TabsTrigger>
            <TabsTrigger 
              value="workforce" 
              className="flex items-center justify-center gap-2 py-3 rounded-lg text-slate-600 dark:text-slate-400 data-[state=active]:bg-[#EAF6FD] dark:data-[state=active]:bg-[#00B2E2]/10 data-[state=active]:text-[#001731] dark:data-[state=active]:text-white data-[state=active]:shadow-none transition-all font-medium"
            >
              <HardHat className="w-4 h-4" /> Add Workforce Admin
            </TabsTrigger>
          </TabsList>

          <TabsContent value="admin" className="!mt-0 outline-none border-0 w-full">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-800">
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-1">Invite Co-Admin</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Invite another admin to help manage {currentAdminArea}. They will automatically inherit your assigned municipality.
                </p>
              </div>
              
              <form className="flex flex-col gap-4" onSubmit={handleAddSubmit}>
                <div className="floating-input !mt-0">
                  <input id="assigned-area" type="text" placeholder=" " value={currentAdminArea} disabled className="bg-slate-50 dark:bg-[#111827] text-slate-500 cursor-not-allowed" />
                  <label htmlFor="assigned-area">Assigned Area</label>
                  <span className="material-symbols-outlined input-icon">map</span>
                </div>

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

                <div className="flex flex-col gap-1">
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
                  Send Invitation
                </Button>
              </form>
            </div>
          </TabsContent>

          <TabsContent value="workforce" className="!mt-0 outline-none border-0 w-full">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-800">
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-1">Register Department Workforce</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Create a new Workforce Admin account. They will be responsible for overseeing their specific department (e.g. Sanitation, Roads).
                </p>
              </div>
              
              <form className="flex flex-col gap-4" onSubmit={handleAddSubmit}>
                
                <div className="floating-input !mt-0">
                  <input id="dept-name" type="text" placeholder=" " required />
                  <label htmlFor="dept-name">Department Name</label>
                  <span className="material-symbols-outlined input-icon">corporate_fare</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="floating-input !mt-0">
                    <input id="wf-name" type="text" placeholder=" " required />
                    <label htmlFor="wf-name">Contact Person (Admin Name)</label>
                    <span className="material-symbols-outlined input-icon">badge</span>
                  </div>
                  <div className="floating-input !mt-0">
                    <input id="wf-contact" type="tel" placeholder=" " required />
                    <label htmlFor="wf-contact">Contact Number</label>
                    <span className="material-symbols-outlined input-icon">call</span>
                  </div>
                </div>
                
                <div className="flex flex-col gap-1">
                  <div className="floating-input !mt-0">
                    <input 
                      id="wf-email" 
                      type="email" 
                      placeholder=" " 
                      required 
                      value={verifyingEmail}
                      onChange={(e) => setVerifyingEmail(e.target.value)}
                    />
                    <label htmlFor="wf-email">Department Email Address</label>
                    <span className="material-symbols-outlined input-icon">mail</span>
                  </div>
                  <p className="text-xs text-slate-500 ml-1">A verification link will be sent to this email.</p>
                </div>

                <div className="flex flex-col gap-1">
                  <div className="floating-input !mt-0">
                    <input 
                      id="wf-password" 
                      type="password" 
                      placeholder=" " 
                      required 
                      minLength={8}
                      value={wfPassword}
                      onChange={(e) => setWfPassword(e.target.value)}
                    />
                    <label htmlFor="wf-password">Temporary Password</label>
                    <span className="material-symbols-outlined input-icon">lock</span>
                  </div>
                  <div className="pt-2 pl-1">
                    <PasswordChecklist password={wfPassword} />
                  </div>
                </div>

                <Button className="w-full h-12 mt-4 text-base bg-[#00B2E2] hover:bg-[#0096C7] text-white font-medium shadow-sm transition-all rounded-lg" type="submit">
                  Create Workforce Admin
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
