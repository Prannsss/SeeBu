"use client";

import { useEffect, useRef } from "react";
import { GooeyToaster, gooeyToast } from "goey-toast";

// Longest title that fits the toast's one-line pill (12px bold, ~260px wide).
const MAX_TITLE_LENGTH = 32;

export default function GooeyToasterProvider() {
  const isPatchedRef = useRef(false);

  useEffect(() => {
    if (isPatchedRef.current) return;

    const patchToastMethod = (
      method: "success" | "error" | "warning" | "info" | "loading",
      fallbackTitle: string,
      fallbackDescription: string,
      shortTitle: string,
    ) => {
      const toastApi = gooeyToast as any;
      const originalMethod = toastApi[method];
      if (typeof originalMethod !== "function") return;

      toastApi[method] = (title: unknown, options?: Record<string, unknown>) => {
        let normalizedTitle = typeof title === "string" ? title.trim() : "";
        const normalizedOptions =
          options && typeof options === "object" ? { ...options } : {};

        // The title sits in a one-line pill; a longer one wraps out of its outline. Move it into the
        // description (which wraps freely) under a short title for the toast's type.
        if (normalizedTitle.length > MAX_TITLE_LENGTH) {
          const existing = typeof normalizedOptions.description === "string" ? normalizedOptions.description.trim() : "";
          normalizedOptions.description = existing ? `${normalizedTitle} ${existing}` : normalizedTitle;
          normalizedTitle = shortTitle;
        }

        const rawDescription = normalizedOptions.description;
        const normalizedDescription =
          typeof rawDescription === "string" ? rawDescription.trim() : rawDescription;

        let finalDescription = typeof normalizedDescription === "string" && normalizedDescription.length > 0
          ? normalizedDescription
          : (normalizedDescription || fallbackDescription);

        if (typeof finalDescription === "string") {
          const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          normalizedOptions.description = `${finalDescription} • ${timeString}`;
        } else {
          normalizedOptions.description = finalDescription;
        }

        return originalMethod.call(
          gooeyToast,
          normalizedTitle.length > 0 ? normalizedTitle : fallbackTitle,
          normalizedOptions,
        );
      };
    };

    patchToastMethod("success", "Success", "Operation completed successfully.", "Success");
    patchToastMethod("error", "Something went wrong", "Please try again.", "Action needed");
    patchToastMethod("warning", "Warning", "Please review the message.", "Warning");
    patchToastMethod("info", "Notice", "Here is an update.", "Notice");
    patchToastMethod("loading", "Loading", "Please wait...", "Loading");

    isPatchedRef.current = true;
  }, []);

  return (
    <GooeyToaster
      position="top-center"
      theme="light"
      showTimestamp
      classNames={{
        wrapper: "gooey-wrapper",
        content: "gooey-content",
        header: "gooey-header",
        title: "gooey-title",
        description: "gooey-description",
      }}
    />
  );
}