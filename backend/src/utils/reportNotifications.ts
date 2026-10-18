import { supabase } from '../config/db';
import { sendClientUpdateEmail } from './emailService';

/**
 * Emails the reporter that their report moved to `status`.
 * Fire-and-forget: never throws, never blocks the caller's response.
 * Callers must only invoke this when the status actually changed (no duplicate emails).
 */
export function notifyReportStatusChange(reportId: string, status: string): void {
  void (async () => {
    const { data: report } = await supabase
      .from('reports')
      .select('id, title, reporter_id, reporter_email, reporter_name, delegated_to, rejection_reason')
      .eq('id', reportId)
      .maybeSingle();
    if (!report) return;

    // Anonymous reports don't store contact details; fall back to the reporter's own account.
    let email: string | null = report.reporter_email;
    let name: string | null = report.reporter_name;
    if (!email && report.reporter_id) {
      const { data: client } = await supabase
        .from('clients')
        .select('email, full_name')
        .eq('id', report.reporter_id)
        .maybeSingle();
      email = client?.email || null;
      name = name || client?.full_name || null;
    }
    if (!email) return;

    let departmentName: string | null = null;
    if (report.delegated_to) {
      const { data: dept } = await supabase
        .from('departments')
        .select('name')
        .eq('id', report.delegated_to)
        .maybeSingle();
      departmentName = dept?.name || null;
    }

    await sendClientUpdateEmail(email, name || '', report.id, report.title || 'Your report', status, {
      departmentName,
      rejectionReason: report.rejection_reason,
    });
  })().catch((err) => console.error(`[notifyReportStatusChange] ${reportId} -> ${status}:`, err));
}
