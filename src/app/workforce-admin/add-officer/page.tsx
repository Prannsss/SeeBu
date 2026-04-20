"use client"

import { useEffect, useState } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { PasswordChecklist } from "@/components/ui/password-checklist"
import { VerificationCodeUI } from "@/components/ui/verification-code"
import { gooeyToast } from "goey-toast"

export default function AddOfficerPage() {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [department, setDepartment] = useState("")
    const { data: profileData } = useQuery({
      queryKey: ['workforce-admin-me'],
      queryFn: async () => {
        const { apiClient } = await import('@/lib/api');
        const result = await apiClient.users.me();
        return result.data;
      }
    })

    const { data: departmentsData } = useQuery({
      queryKey: ['workforce-admin-departments'],
      queryFn: async () => {
        const { apiClient } = await import('@/lib/api');
        const result = await apiClient.departments.getAll();
        return result.data || [];
      }
    })

    useEffect(() => {
      const scopedDepartment = Array.isArray(departmentsData)
        ? departmentsData.find((d: any) => String(d.id) === String(profileData?.department_id)) || departmentsData[0]
        : null;

      if (scopedDepartment?.id) {
        setDepartment(String(scopedDepartment.id));
      }
    }, [departmentsData, profileData?.department_id]);

    const selectedDepartmentName = Array.isArray(departmentsData)
      ? (departmentsData.find((d: any) => String(d.id) === String(department))?.name || "")
      : "";

  const [officerPassword, setOfficerPassword] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)

  const mutation = useMutation({
    mutationFn: async (payload: any) => {
      const { apiClient } = await import('@/lib/api');
      const result = await apiClient.auth.provision({
        ...payload,
        user_role: "workforce"
      });
      return result;
    },
    onSuccess: () => {
      gooeyToast.success("Officer generated successfully! Proceed to verify email.");
      setIsVerifying(true);
    },
    onError: (error) => {
      gooeyToast.error(error?.message?.trim() || "Failed to generate officer account.");
    }
  })

  const handleAddOfficer = (e: React.FormEvent) => {
    e.preventDefault()

    if (!department) {
      gooeyToast.error("Unable to resolve your department. Please reload and try again.");
      return;
    }
    
    mutation.mutate({
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      department_id: department,
      password: officerPassword,
      user_role: "workforce"
    })
  }

  const handleVerifySuccess = () => {
    setIsVerifying(false)
    setFirstName("")
    setLastName("")
    setEmail("")
    setPhone("")
    setDepartment("")
    setOfficerPassword("")
  }

  const handleVerifyCancel = () => {
    setIsVerifying(false)
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

        {isVerifying ? (
          <div className="max-w-md mx-auto mt-6">
            <VerificationCodeUI
              onVerify={handleVerifySuccess}
              onCancel={handleVerifyCancel}
              email={email || "the provided email"}
            />
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 sm:p-8 animate-in fade-in duration-500">
            <form className="space-y-6" onSubmit={handleAddOfficer}>

              <div className="grid grid-cols-2 gap-4">
                <div className="floating-input">
                  <input 
                    id="officer-first-name" 
                    type="text" 
                    placeholder=" " 
                    required 
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />        
                  <label htmlFor="officer-first-name">First Name</label>
                  <span className="material-symbols-outlined input-icon">person</span>    
                </div>
                <div className="floating-input">
                  <input 
                    id="officer-last-name" 
                    type="text" 
                    placeholder=" " 
                    required 
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />        
                  <label htmlFor="officer-last-name">Last Name</label>
                  <span className="material-symbols-outlined input-icon">person</span>    
                </div>
              </div>

              <div className="floating-input">
                <input
                  id="officer-email"
                  type="email"
                  placeholder=" "
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <label htmlFor="officer-email">Email Address</label>
                <span className="material-symbols-outlined input-icon">mail</span>      
              </div>

            <div className="floating-input">
              <input 
                id="officer-contact" 
                type="tel" 
                placeholder=" " 
                required 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />        
              <label htmlFor="officer-contact">Contact Number</label>
              <span className="material-symbols-outlined input-icon">call</span>        
            </div>

            <div className="floating-input">
              <input 
                id="officer-department" 
                type="text" 
                placeholder=" " 
                required 
                value={selectedDepartmentName || "Loading department..."}
                disabled
              />        
              <label htmlFor="officer-department">Assigned Department</label>
              <span className="material-symbols-outlined input-icon">domain</span>        
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

            <Button 
              className="w-full h-12 mt-4 text-lg bg-primary hover:bg-primary-dark text-white font-bold shadow-lg transition-all" 
              type="submit"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Creating..." : "Create Officer Account"}
            </Button>

          </form>
        </div>
        )}

      </div>
    </div>
  )
}
