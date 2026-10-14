"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabaseClient } from "@/lib/supabase";
import { gooeyToast } from "goey-toast";

interface RealtimeOptions {
  enableToasts?: boolean;
  userRole?: "client" | "admin" | "workforce-admin" | "workforce" | "superadmin";
  /** Current user's id — scopes client/workforce toasts to their own reports/tasks */
  userId?: string;
  /** Admin's municipality — scopes admin toasts to their municipality */
  municipalityId?: string;
}

export function useRealtimeReports(options: RealtimeOptions = {}) {
  const queryClient = useQueryClient();
  const { enableToasts = false, userRole, userId, municipalityId } = options;

  useEffect(() => {
    // Debounced: one task completion fires ~6 change events across tables
    let timer: ReturnType<typeof setTimeout> | undefined;
    let joinedOnce = false;
    const invalidateAll = () => {
      clearTimeout(timer);
      timer = setTimeout(invalidateNow, 750);
    };
    const invalidateNow = () => {
      queryClient.invalidateQueries({ queryKey: ["client-reports"] });
      queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      queryClient.invalidateQueries({ queryKey: ["workforce-admin-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      queryClient.invalidateQueries({ queryKey: ["admin-analytics"] });
      queryClient.invalidateQueries({ queryKey: ["superadmin-analytics"] });
    };

    const channel = supabaseClient
      .channel("public-reports-tasks-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reports" },
        (payload) => {
          invalidateAll();

          if (enableToasts) {
            if (payload.eventType === "INSERT") {
              const newReport = payload.new;
              if (userRole === "admin" || userRole === "superadmin") {
                gooeyToast.info("New Report Submitted", {
                  description: `Report #${newReport.id || "new"} - ${newReport.title || "In Review"}`,
                });
              }
            } else if (payload.eventType === "UPDATE") {
              const updated = payload.new;
              if (userRole === "workforce-admin" && updated.delegated_to) {
                gooeyToast.info("Report Delegated", {
                  description: `Report #${updated.id} was delegated to your department schedule.`,
                });
              } else if (
                (userRole === "client" && userId && updated.reporter_id === userId) ||
                (userRole === "admin" && (!municipalityId || updated.municipality_id === municipalityId))
              ) {
                gooeyToast.success("Report Status Updated", {
                  description: `Report #${updated.id} is now ${updated.status}`,
                });
              }
            }
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        (payload) => {
          invalidateAll();

          if (enableToasts) {
            if (payload.eventType === "INSERT") {
              const newTask = payload.new;
              if (userRole !== "workforce" || (userId && newTask.assigned_to === userId)) gooeyToast.info("New Task Available", {
                description: `Task #${newTask.id} - ${newTask.title || "New operation assigned"}`,
              });
            } else if (payload.eventType === "UPDATE") {
              const updated = payload.new;
              if (userRole === "workforce") {
                if (userId && updated.assigned_to === userId) gooeyToast.info("Task Assigned", {
                  description: `Task #${updated.id} status is now ${updated.status}.`,
                });
              } else if (userRole === "workforce-admin" || userRole === "admin") {
                gooeyToast.success("Task Updated", {
                  description: `Task #${updated.id} is now ${updated.status}.`,
                });
              }
            }
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "report_photos" },
        () => { invalidateAll(); }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "report_timeline" },
        () => { invalidateAll(); }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "task_proof_photos" },
        () => { invalidateAll(); }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "task_timeline" },
        () => { invalidateAll(); }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("[Realtime] Subscribed to Supabase Realtime changes.");
          // Supabase does not replay events missed while disconnected, so refetch on rejoin
          if (joinedOnce) invalidateNow();
          joinedOnce = true;
        }
      });

    // The socket is suspended while the tab/PWA is in the background; catch up when it returns
    const onVisible = () => { if (document.visibilityState === "visible") invalidateNow(); };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      clearTimeout(timer);
      supabaseClient.removeChannel(channel);
    };
  }, [queryClient, enableToasts, userRole, userId, municipalityId]);
}
