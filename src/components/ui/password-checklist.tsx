"use client"

import { Check, X } from "lucide-react"

interface PasswordChecklistProps {
  password: string
}

export function PasswordChecklist({ password }: PasswordChecklistProps) {
  const requirementList = [
    { text: "At least 8 characters", met: password.length >= 8 },
    { text: "At least one uppercase letter", met: /[A-Z]/.test(password) },
    { text: "At least one lowercase letter", met: /[a-z]/.test(password) },
    { text: "At least one number", met: /[0-9]/.test(password) },
    { text: "At least one special character", met: /[^A-Za-z0-9]/.test(password) }
  ]

  return (
    <ul className="text-sm mt-3 space-y-1.5">
      {requirementList.map((req, i) => (
        <li key={i} className="flex items-center gap-2">
          {req.met ? (
            <Check className="w-4 h-4 text-emerald-500" />
          ) : (
            <X className="w-4 h-4 text-red-500" />
          )}
          <span className={req.met ? "text-emerald-700 dark:text-emerald-400" : "text-slate-600 dark:text-slate-400"}>
            {req.text}
          </span>
        </li>
      ))}
    </ul>
  )
}
