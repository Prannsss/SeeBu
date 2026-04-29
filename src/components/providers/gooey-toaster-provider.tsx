"use client";

import { useEffect, useRef } from "react";
import { GooeyToaster, gooeyToast } from "goey-toast";

export default function GooeyToasterProvider() {
  const isPatchedRef = useRef(false);

  useEffect(() => {
    if (isPatchedRef.current) return;

    const patchToastMethod = (
      method: "success" | "error" | "warning" | "info" | "loading",
      fallbackTitle: string,
      fallbackDescription: string,
    ) => {
      const toastApi = gooeyToast as any;
      const originalMethod = toastApi[method];
      if (typeof originalMethod !== "function") return;

      toastApi[method] = (title: unknown, options?: Record<string, unknown>) => {
        const normalizedTitle = typeof title === "string" ? title.trim() : "";
        const normalizedOptions =
          options && typeof options === "object" ? { ...options } : {};

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

    patchToastMethod("success", "Success", "Operation completed successfully.");
    patchToastMethod("error", "Something went wrong", "Please try again.");
    patchToastMethod("warning", "Warning", "Please review the message.");
    patchToastMethod("info", "Notice", "Here is an update.");
    patchToastMethod("loading", "Loading", "Please wait...");

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