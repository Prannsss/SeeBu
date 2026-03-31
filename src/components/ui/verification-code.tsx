"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { gooeyToast } from "goey-toast"
import { ShieldCheck, ArrowLeft } from "lucide-react"

interface VerificationCodeUIProps {
  onVerify: () => void
  onCancel: () => void
  email?: string
}

export function VerificationCodeUI({ onVerify, onCancel, email = "the user" }: VerificationCodeUIProps) {
  const [code, setCode] = useState(["", "", "", "", "", ""])
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value
    if (/[^0-9]/.test(value)) return

    const newCode = [...code]
    newCode[index] = value
    setCode(newCode)

    if (value && index < 5) {
      inputs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus()
    }
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const finalCode = code.join("")
    if (finalCode.length < 6) {
      gooeyToast.error("Please enter a 6-digit code")
      return
    }
    
    // Simulate verification
    if (finalCode === "123456" || finalCode.length === 6) {
      gooeyToast.success("Verification successful! User has been added.")
      onVerify()
    } else {
      gooeyToast.error("Invalid verification code")
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-300">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#EAF6FD] dark:bg-[#00B2E2]/10 text-[#00B2E2] mb-6">
        <ShieldCheck className="w-8 h-8" />
      </div>
      
      <h2 className="text-2xl font-bold mb-2">Verification Required</h2>
      <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-sm">
        Please enter the 6-digit verification code sent to {email}.
      </p>

      <form onSubmit={onSubmit} className="w-full max-w-sm">
        <div className="flex justify-between gap-2 mb-8">
          {code.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputs.current[index] = el
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              title={`Digit ${index + 1}`}
              aria-label={`Digit ${index + 1}`}
              onChange={(e) => handleChange(e, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className="w-12 h-14 text-center text-2xl font-bold bg-slate-50 border border-slate-200 rounded-[8px] focus:border-[#00B2E2] focus:ring-2 focus:ring-[#00B2E2]/20 outline-none transition-all dark:bg-slate-800 dark:border-slate-700"
            />
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <Button type="submit" className="w-full h-12 text-base font-bold shadow-sm bg-[#00B2E2] hover:bg-[#0096C7] text-white rounded-[8px]">
            Verify & Add User
          </Button>
          <Button type="button" onClick={onCancel} className="w-full h-12 text-base font-bold shadow-sm bg-red-500 hover:bg-red-600 dark:bg-red-900/80 dark:hover:bg-red-900 text-white rounded-[8px] gap-2">
            <ArrowLeft className="w-4 h-4" /> Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
