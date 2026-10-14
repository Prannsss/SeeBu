"use client";

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ShieldCheck, Lock, Loader2, CheckCircle } from "lucide-react";

interface ReportPrivacyAgreementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
  submittingLabel?: string;
}

export function ReportPrivacyAgreementModal({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting,
  submittingLabel = 'Submitting…',
}: ReportPrivacyAgreementModalProps) {
  const [agreed, setAgreed] = useState(true);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <DialogContent className="sm:max-w-md p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl">
        <DialogHeader className="text-left space-y-2">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-1">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <DialogTitle className="text-xl font-bold text-slate-900">
            Privacy & Submission Agreement
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-700">
            Please review this quick privacy notice before submitting your report.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 my-2 text-sm">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl space-y-2.5">
            <p className="text-sm text-slate-700 leading-relaxed">
              By submitting this report, you confirm that your provided information and attached photos are accurate and free of identifiable persons, vehicle license plates, or confidential personal data.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-700 pt-1 border-t border-slate-200 dark:border-slate-700">
              <Lock className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>Information is securely shared only with authorized local response units.</span>
            </div>
          </div>

          <label className="flex items-start gap-2.5 cursor-pointer select-none pt-1">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              disabled={isSubmitting}
              className="mt-0.5 w-4 h-4 text-primary rounded border-slate-500 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            />
            <span className="text-sm text-slate-700">
              I understand and agree to the privacy terms and confirm this submission is accurate.
            </span>
          </label>
        </div>

        <DialogFooter className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="w-full flex items-center justify-center h-11 px-4 rounded-lg border-2 border-slate-400 bg-white hover:bg-slate-50 text-slate-700 font-medium text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!agreed || isSubmitting}
            onClick={onConfirm}
            className="w-full flex items-center justify-center gap-2 h-11 px-4 rounded-lg bg-primary hover:bg-primary/90 text-white font-semibold text-sm transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                {submittingLabel}
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Confirm and Submit
              </>
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
