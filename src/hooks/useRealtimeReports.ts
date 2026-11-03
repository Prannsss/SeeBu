"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabaseClient } from "@/lib/supabase";
import { gooeyToast } from "goey-toast";

interface RealtimeOptions {
  enableToasts?: boolean;
  userRole?: "client" | "admin" | "workforce-admin" | "workforce" | "superadmin";
  /** Current user's id — scopes officer updates to their own tasks */
  userId?: string;
  /** Admin's municipality — scopes admin updates to their municipality */
  municipalityId?: string;
  /** Workforce admin's department — scopes their updates to their department */
  departmentId?: string | number | null;
}

/**
 * What the database broadcasts on every change (public.broadcast_change trigger). Deliberately
 * minimal: the topic is public, so no report ids (they double as tracking codes), names, contact
 * details or coordinates; pages refetch the details through the authenticated API.
 */
type ChangeSignal = {
  table: "reports" | "tasks" | "report_photos" | "report_timeline" | "task_proof_photos" | "task_timeline" | string;
  op: "INSERT" | "UPDATE" | "DELETE";
  status?: string | null;
  municipality_id?: string | null; // reports
  department_id?: number | null; // reports (delegated department), tasks (via the linked report)
  task_id?: string | null; // tasks
  assigned_to?: string | null; // tasks
};

const TOPIC = "seebu:changes";
const QUERY_KEYS = ["client-reports", "admin-reports", "reports", "workforce-admin-tasks", "tasks", "analytics", "admin-analytics", "superadmin-analytics"];

/**
 * Live updates: refetches the page's data (and optionally toasts) when a report or task changes.
 * Listens to a Realtime Broadcast topic fed by a database trigger; postgres_changes can't be used
 * because these tables are closed to the browser's public key by row-level security.
 */
export function useRealtimeReports(options: RealtimeOptions = {}) {
  const queryClient = useQueryClient();
  const { enableToasts = false, userRole, userId, municipalityId, departmentId } = options;
  const department = departmentId === null || departmentId === undefined || departmentId === "" ? null : Number(departmentId);

  // Read the latest scope inside the handler without resubscribing when it changes.
  const scope = useRef({ enableToasts, userRole, userId, municipalityId, department });
  scope.current = { enableToasts, userRole, userId, municipalityId, department };

  useEffect(() => {
    // Debounced: one task completion fires ~6 change events across tables
    let timer: ReturnType<typeof setTimeout> | undefined;
    let joinedOnce = false;
    const invalidateNow = () => QUERY_KEYS.forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
    const invalidateSoon = () => {
      clearTimeout(timer);
      timer = setTimeout(invalidateNow, 750);
    };

    /** Does this change touch data the current user's pages show? */
    const isRelevant = (c: ChangeSignal) => {
      const { userRole: role, userId: me, municipalityId: muni, department: dept } = scope.current;
      if (c.table === "reports") {
        if (role === "admin") return !muni || c.municipality_id === muni;
        if (role === "workforce-admin") return dept === null || c.department_id === dept;
        if (role === "workforce") return false; // officers see reports through their tasks
        return true; // superadmin, client (history), unknown
      }
      if (c.table === "tasks") {
        if (role === "workforce") return !me || c.assigned_to === me;
        if (role === "workforce-admin") return dept === null || c.department_id === dept;
        return role === "superadmin" || role === undefined; // admins and clients track reports, not tasks
      }
      // Photos and timelines carry no scope; they normally arrive with their report/task change,
      // and the debounce folds them into the same refetch.
      return true;
    };

    const toastFor = (c: ChangeSignal) => {
      const { enableToasts: on, userRole: role, municipalityId: muni, department: dept, userId: me } = scope.current;
      if (!on) return;
      if (c.table === "reports") {
        const mine = role === "superadmin" || (role === "admin" && (!muni || c.municipality_id === muni));
        if (c.op === "INSERT" && mine) {
          gooeyToast.info("New report", { description: "A new report is waiting for review." });
        } else if (c.op === "UPDATE" && role === "admin" && mine && c.status) {
          gooeyToast.success("Report updated", { description: `A report in your area is now ${c.status}.` });
        } else if (c.op === "UPDATE" && role === "workforce-admin" && dept !== null && c.department_id === dept && c.status === "Action Taken") {
          gooeyToast.info("Report delegated", { description: "A report was delegated to your department." });
        }
      } else if (c.table === "tasks" && c.task_id) {
        const status = c.status === "Accepted" ? "In Progress" : c.status;
        if (role === "workforce" && me && c.assigned_to === me) {
          if (c.op === "INSERT") gooeyToast.info("New task", { description: `Task ${c.task_id} was assigned to you.` });
          else if (c.op === "UPDATE") gooeyToast.info("Task updated", { description: `Task ${c.task_id} is now ${status}.` });
        } else if (role === "workforce-admin" && dept !== null && c.department_id === dept) {
          if (c.op === "INSERT") gooeyToast.info("New task", { description: `Task ${c.task_id} is waiting to be assigned.` });
          else if (c.op === "UPDATE") gooeyToast.success("Task updated", { description: `Task ${c.task_id} is now ${status}.` });
        }
      }
    };

    const channel = supabaseClient
      .channel(TOPIC)
      .on("broadcast", { event: "change" }, ({ payload }) => {
        const change = payload as ChangeSignal;
        if (!change?.table || !isRelevant(change)) return;
        invalidateSoon();
        toastFor(change);
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          // Broadcasts aren't replayed after a disconnect, so refetch on rejoin
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
  }, [queryClient]);
}
