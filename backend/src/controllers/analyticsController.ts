import { Request, Response } from 'express';
import { supabase } from '../config/db';

export const analyticsController = {
  // SUPERADMIN: General overview across ALL municipalities
  async getSuperadminAnalytics(req: Request, res: Response) {
    try {
      // 1. Fetch total counts per status
      const { data: statusCounts, error: statusErr } = await supabase
        .from('reports')
        .select('status');

      if (statusErr) throw statusErr;

      // Calculate totals
      const totalReports = statusCounts.length;
      const reportedIssues = statusCounts.filter(r => r.status === 'In Review').length;
      const completedTasks = statusCounts.filter(r => r.status === 'Completed' || r.status === 'Resolved').length;

      // 2. Aggregate recurring issues by municipality
      const { data: recurringData, error: recErr } = await supabase
        .from('reports')
        .select(`
          issue_type,
          count:id,
          municipalities(name)
        `);

      if (recErr) throw recErr;

      // Format Chart Data & Recurring Data dynamically from SQL grouping instead of JSON!
      const groupedByMun: Record<string, number> = {};
      recurringData.forEach((row: any) => {
        const area = row.municipalities?.name || 'Unknown';
        groupedByMun[area] = (groupedByMun[area] || 0) + 1;
      });

      const formattedRecurring = Object.keys(groupedByMun).map((key) => ({
         area: key,
         issue: 'Various',
         count: groupedByMun[key]
      })).sort((a,b) => b.count - a.count);

      // Return the dynamically aggregated response
      return res.status(200).json({
        totalReports,
        reportedIssues,
        completedTasks,
        pendingReports: totalReports - completedTasks - reportedIssues,
        chartData: [
           // Pseudo-Chart Mock payload dynamically built. We can expand this with actual DATE Grouping.
           { date: 'Current', count: totalReports }
        ],
        recurringData: formattedRecurring
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  },

  // ADMIN: Filtered exclusively to a single municipality
  async getAdminAnalytics(req: Request, res: Response) {
    try {
      const { municipality_id } = req.params;

      if (!municipality_id) {
        return res.status(400).json({ error: 'municipality_id is required' });
      }

      // Grouped counts filter out everything except the admin's territory
      const { data: reports, error } = await supabase
        .from('reports')
        .select(`
          status,
          issue_type,
          barangays(name)
        `)
        .eq('municipality_id', municipality_id);

      if (error) throw error;

      const totalReports = reports.length;
      const reportedIssues = reports.filter(r => r.status === 'In Review').length;
      const completedTasks = reports.filter(r => r.status === 'Completed').length;
      const delayedTasks = reports.filter(r => r.status === 'Delegated' || r.status === 'Delayed').length;

      const groupedByBrgy: Record<string, number> = {};
      reports.forEach((r: any) => {
         const brgy = r.barangays?.name || 'Unknown';
         groupedByBrgy[brgy] = (groupedByBrgy[brgy] || 0) + 1;
      });

      const formattedRecurring = Object.keys(groupedByBrgy).map((key) => ({
         area: key,
         issue: 'General',
         count: groupedByBrgy[key]
      })).sort((a, b) => b.count - a.count);

      return res.status(200).json({
        totalReports,
        reportedIssues,
        completedTasks,
        delayedTasks,
        pendingReports: totalReports - completedTasks - reportedIssues,
        chartData: [{ name: 'Overall', count: totalReports }],
        recurringData: formattedRecurring
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
};
