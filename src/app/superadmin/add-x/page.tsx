"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { UserPlus, ShieldAlert, ShieldCheck, Loader2, Eye, EyeOff } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PasswordChecklist } from "@/components/ui/password-checklist"
import { VerificationCodeUI } from "@/components/ui/verification-code"
import { gooeyToast } from "goey-toast"
import { useMutation, useQuery } from "@tanstack/react-query"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

export default function SuperadminAddPage() {
  const [activeTab, setActiveTab] = useState("admin")
  const [adminPassword, setAdminPassword] = useState("")
  const [showAdminPassword, setShowAdminPassword] = useState(false)
  const [superadminPassword, setSuperadminPassword] = useState("")
  const [showSuperadminPassword, setShowSuperadminPassword] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [verifyingEmail, setVerifyingEmail] = useState("")
  const [municipalityId, setMunicipalityId] = useState("")
  const [municipalityInput, setMunicipalityInput] = useState("")
  const [showMunicipalityDropdown, setShowMunicipalityDropdown] = useState(false)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const municipalityInputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fetch municipalities from API
  const { data: locationsData } = useQuery({
    queryKey: ["locations"],
    queryFn: async () => {
      const { apiClient } = await import('@/lib/api');
      const json = await apiClient.locations.getAll();
      return json.data || [];
    }
  })

  const municipalities = locationsData || [];

  // Filter municipalities based on input
  const filteredMunicipalities = municipalities.filter((mun: any) =>
    mun.name.toLowerCase().includes(municipalityInput.toLowerCase())
  )

  // Handle blur on input - only close dropdown, don't trigger dialog
  const handleMunicipalityBlur = () => {
    setShowMunicipalityDropdown(false)
  }

  const handleMunicipalityFocus = () => {
    setShowMunicipalityDropdown(true)
  }

  // Check if all required admin fields are filled
  const isAdminFormValid = () => {
    const nameEl = document.querySelector('#admin-name') as HTMLInputElement;
    const contactEl = document.querySelector('#admin-contact') as HTMLInputElement;
    return nameEl?.value?.trim() && contactEl?.value?.trim() && verifyingEmail?.trim() && adminPassword.length >= 8;
  };

  // Check if all required superadmin fields are filled
  const isSuperadminFormValid = () => {
    const nameEl = document.querySelector('#sa-name') as HTMLInputElement;
    const contactEl = document.querySelector('#sa-contact') as HTMLInputElement;
    return nameEl?.value?.trim() && contactEl?.value?.trim() && verifyingEmail?.trim() && superadminPassword.length >= 8;
  };

  const handleSelectOrAddMunicipality = (mun?: any) => {
    if (mun) {
      setMunicipalityInput(mun.name)
      setMunicipalityId(mun.id)
    } else {
      // User clicked "Add new municipality" - validate form first
      if (activeTab === 'admin' && !isAdminFormValid()) {
        gooeyToast.error("Please fill in all required fields before adding a municipality");
        return;
      }
      if (activeTab === 'superadmin' && !isSuperadminFormValid()) {
        gooeyToast.error("Please fill in all required fields before adding a municipality");
        return;
      }
      // Show confirmation dialog for new municipality
      setTimeout(() => setConfirmDialogOpen(true), 100);
    }
    setShowMunicipalityDropdown(false)
  }

  const selectMunicipality = (mun: any) => {
    handleSelectOrAddMunicipality(mun)
  }

  const handleConfirmCreate = () => {
    // Generate ID from name: "Cebu City" -> "cebu-city"
    const generatedId = municipalityInput
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
    setMunicipalityId(generatedId)
    setConfirmDialogOpen(false)
    gooeyToast.success(`Municipality "${municipalityInput}" will be created`)
  }

  const provisionMutation = useMutation({
    mutationFn: async (data: any) => {
      const { apiClient } = await import('@/lib/api');
      const result = await apiClient.auth.provision(data);
      
      return result;
    },
    onSuccess: () => {
      gooeyToast.success("Verification code sent!")
      setIsVerifying(true)
    },
    onError: (error: any) => {
      gooeyToast.error(error.message || "Failed to add user")
    }
  })
  
  const handleAddSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    
    // We get the inputs based on the active tab
    const prefix = activeTab === "admin" ? "admin" : "sa"
    const fullNameElement = form.querySelector(`#${prefix}-name`) as HTMLInputElement
    const contactElement = form.querySelector(`#${prefix}-contact`) as HTMLInputElement
    
    const payload: any = {
      user_role: activeTab,
      full_name: fullNameElement.value,
      contact_number: contactElement.value,
      email: verifyingEmail,
      password: activeTab === "admin" ? adminPassword : superadminPassword,
    }
    
    if (activeTab === "admin") {
      if (!municipalityId) {
        gooeyToast.error("Please select a municipality")
        return
      }
      payload.municipality_id = municipalityId
    }

    provisionMutation.mutate(payload)
  }

  const handleVerifySuccess = () => {
    setIsVerifying(false)
    setAdminPassword("")
    setSuperadminPassword("")
    setVerifyingEmail("")
    setMunicipalityId("")
    // Find inputs to reset them
    const inputs = document.querySelectorAll('input')
    inputs.forEach(input => input.value = '')
    gooeyToast.success(`${activeTab === 'admin' ? 'Admin' : 'Superadmin'} added successfully!`)
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
                  <div className="relative" ref={dropdownRef}>
                    <div className="floating-input !mt-0">
                      <input 
                        ref={municipalityInputRef}
                        type="text" 
                        placeholder=" "
                        title="Select or add municipality"
                        value={municipalityInput}
                        onChange={(e) => {
                          setMunicipalityInput(e.target.value)
                          setMunicipalityId("")
                          setShowMunicipalityDropdown(true)
                        }}
                        onFocus={handleMunicipalityFocus}
                        onBlur={handleMunicipalityBlur}
                        className="pr-10"
                        required
                      />
                      <label htmlFor="municipality-search">Select or Add Municipality</label>
                      <span className="material-symbols-outlined input-icon">map</span>
                    </div>
                    {showMunicipalityDropdown && filteredMunicipalities.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-60 overflow-auto">
                        {filteredMunicipalities.map((mun: any) => (
                          <div 
                            key={mun.id}
                            onMouseDown={() => selectMunicipality(mun)}
                            className="px-4 py-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm"
                          >
                            {mun.name}
                          </div>
                        ))}
                        {municipalityInput && !filteredMunicipalities.some((m: any) => m.name.toLowerCase() === municipalityInput.toLowerCase()) && (
                          <div 
                            onMouseDown={handleMunicipalityBlur}
                            className="px-4 py-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 text-[#00B2E2] dark:text-[#00B2E2] text-sm font-medium border-t border-slate-100 dark:border-slate-700"
                          >
                            + Add "{municipalityInput}"
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 ml-1">Type to search or enter a new municipality name.</p>
                </div>

                <div className="flex flex-col gap-1 mt-2">
                  <div className="floating-input !mt-0">
                    <input 
                      id="admin-password" 
                      type={showAdminPassword ? "text" : "password"}
                      placeholder=" " 
                      required 
                      minLength={8}
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                    />
                    <label htmlFor="admin-password">Temporary Password</label>
                    <span className="material-symbols-outlined input-icon">lock</span>
                    <button 
                      type="button"
                      onClick={() => setShowAdminPassword(!showAdminPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showAdminPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  <div className="pt-2 pl-1">
                    <PasswordChecklist password={adminPassword} />
                  </div>
                </div>

                <Button disabled={provisionMutation.isPending} className="w-full h-12 mt-4 text-base bg-[#00B2E2] hover:bg-[#0096C7] text-white font-medium shadow-sm transition-all rounded-lg" type="submit">
                  {provisionMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
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
                  <div className="floating-input !mt-0 relative">
                    <input 
                      id="sa-password" 
                      type={showSuperadminPassword ? "text" : "password"}
                      placeholder=" " 
                      required 
                      minLength={8}
                      value={superadminPassword}
                      onChange={(e) => setSuperadminPassword(e.target.value)}
                    />
                    <label htmlFor="sa-password">Temporary Password</label>
                    <span className="material-symbols-outlined input-icon">lock</span>
                    <button 
                      type="button"
                      onClick={() => setShowSuperadminPassword(!showSuperadminPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showSuperadminPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  <div className="pt-2 pl-1">
                    <PasswordChecklist password={superadminPassword} />
                  </div>
                </div>

                <Button disabled={provisionMutation.isPending} className="w-full h-12 mt-4 text-base bg-[#00B2E2] hover:bg-[#0096C7] text-white font-medium shadow-sm transition-all rounded-lg" type="submit">
                  {provisionMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Create Global Superadmin
                </Button>
              </form>
            </div>
          </TabsContent>
        </Tabs>
        )}
      </div>

      {/* Confirmation Dialog for New Municipality */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-sm rounded-xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Municipality Not Found</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              "{municipalityInput}" does not exist. Would you like to add it as a new municipality?
            </p>
          </div>
          <DialogFooter className="flex-row gap-3 mt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setConfirmDialogOpen(false)
                setMunicipalityInput("")
                municipalityInputRef.current?.focus()
              }}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white border-red-600"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmCreate}
              className="flex-1 bg-[#00B2E2] hover:bg-[#0096C7] text-white"
            >
              Yes, Add New
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
