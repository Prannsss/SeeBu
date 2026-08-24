"use client";

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ShieldAlert, UserX, Hash, FileWarning, CheckCircle2 } from "lucide-react";

interface CameraPrivacyNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceed: () => void;
}

export function CameraPrivacyNoticeModal({
  isOpen,
  onClose,
  onProceed,
}: CameraPrivacyNoticeModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl">
        <DialogHeader className="text-left space-y-2">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-1">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
            Photo Privacy & Guidelines
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600 dark:text-gray-400">
            To protect community privacy and ensure rapid resolution, please follow these photo capture guidelines:
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 my-2 text-sm">
          <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl space-y-2">
            <p className="font-semibold text-red-800 dark:text-red-300 flex items-center gap-1.5 text-xs uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
              Do NOT include in your photo:
            </p>
            <ul className="space-y-1.5 text-xs text-red-700 dark:text-red-300/90 pl-1">
              <li className="flex items-start gap-2">
                <UserX className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span><strong>People or faces:</strong> Avoid photographing identifiable individuals or bystanders.</span>
              </li>
              <li className="flex items-start gap-2">
                <Hash className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span><strong>Vehicle plate numbers:</strong> Do not capture visible license plates.</span>
              </li>
              <li className="flex items-start gap-2">
                <FileWarning className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span><strong>Sensitive documents:</strong> Avoid personal IDs, house addresses, or private papers.</span>
              </li>
            </ul>
          </div>

          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-xl flex items-start gap-2.5 text-emerald-800 dark:text-emerald-300 text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <span><strong>Tip:</strong> Keep the camera centered on the infrastructure defect, damage, or hazard.</span>
          </div>
        </div>

        <DialogFooter className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full flex items-center justify-center px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium text-sm transition-colors shadow-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onProceed();
            }}
            className="w-full flex items-center justify-center px-4 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-white font-medium text-sm transition-colors shadow-sm"
          >
            I Understand
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
