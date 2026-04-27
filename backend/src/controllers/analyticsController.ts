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

      // 3. Fetch reports with issue_type for issue type breakdown (include municipality_id for filtering)
      const { data: reportsWithIssueType, error: issueTypeErr } = await supabase
        .from('reports')
        .select('issue_type, other_type_specification, municipality_id');

      if (issueTypeErr) throw issueTypeErr;

      // 4. Fetch all municipalities for the filter dropdown
      const { data: allMunicipalities, error: munErr } = await supabase
        .from('municipalities')
        .select('id, name')
        .order('name', { ascending: true });

      if (munErr) throw munErr;

      // 4. Aggregate recurring issues by municipality
      const { data: recurringData, error: recErr } = await supabase
        .from('reports')
        .select(`
          issue_type,
          other_type_specification,
          count:id,
          municipalities(name)
        `);

      if (recErr) throw recErr;

      const { data: reportsOverTime, error: reportsOverTimeErr } = await supabase
        .from('reports')
        .select('created_at')
        .order('created_at', { ascending: true });

      if (reportsOverTimeErr) throw reportsOverTimeErr;

      // Format Chart Data & Recurring Data dynamically from SQL grouping instead of JSON!
      const groupedByMun: Record<string, number> = {};
      const groupedByIssueType: Record<string, { count: number; municipalityId: string }> = {};
      const reportsByDate: Record<string, number> = {};
      
      recurringData.forEach((row: any) => {
        const area = row.municipalities?.name || 'Unknown';
        groupedByMun[area] = (groupedByMun[area] || 0) + 1;
      });

      // Group by issue_type for bar chart - use other_type_specification when issue_type is 'other'
      // Include municipalityId so frontend can filter
      (reportsWithIssueType || []).forEach((row: any) => {
        const issueLabel = row.issue_type === 'other' && row.other_type_specification
          ? row.other_type_specification
          : (row.issue_type || 'Unknown');
        const key = `${issueLabel}__${row.municipality_id}`;
        if (!groupedByIssueType[key]) {
          groupedByIssueType[key] = { count: 0, municipalityId: row.municipality_id };
        }
        groupedByIssueType[key].count++;
      });

      (reportsOverTime || []).forEach((row: any) => {
        const dateKey = new Date(row.created_at).toISOString().split('T')[0];
        reportsByDate[dateKey] = (reportsByDate[dateKey] || 0) + 1;
      });

      // Issue type data for bar chart - sorted by count descending, includes municipalityId for filtering
      const issueTypeData = Object.keys(groupedByIssueType)
        .map((key) => {
          const [issueType] = key.split('__');
          return {
            issueType,
            count: groupedByIssueType[key].count,
            municipalityId: groupedByIssueType[key].municipalityId
          };
        })
        .sort((a, b) => b.count - a.count);

      const formattedRecurring = Object.keys(groupedByMun).map((key) => ({
         area: key,
         issue: 'Various',
         count: groupedByMun[key]
      })).sort((a,b) => b.count - a.count);

      const formattedChartData = Object.keys(reportsByDate)
        .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
        .map((date) => ({
          date,
          reports: reportsByDate[date],
        }));

      // Return the dynamically aggregated response
      return res.status(200).json({
        totalReports,
        reportedIssues,
        completedTasks,
        pendingReports: totalReports - completedTasks - reportedIssues,
        chartData: formattedChartData.length > 0
          ? formattedChartData
          : [{ date: new Date().toISOString().split('T')[0], reports: 0 }],
        recurringData: formattedRecurring,
        issueTypeData,
        municipalities: allMunicipalities
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
          other_type_specification,
          created_at,
          barangays(name)
        `)
        .eq('municipality_id', municipality_id);

      if (error) throw error;

      const totalReports = reports.length;
      const reportedIssues = reports.filter(r => r.status === 'In Review').length;
      const completedTasks = reports.filter(r => r.status === 'Completed' || r.status === 'Resolved').length;
      const delayedTasks = reports.filter(r => r.status === 'Delegated' || r.status === 'Delayed').length;

      const groupedByBrgy: Record<string, number> = {};
      const groupedByIssueType: Record<string, number> = {};
      const reportsByDate: Record<string, number> = {};
      reports.forEach((r: any) => {
         const brgy = r.barangays?.name || 'Unknown';
         groupedByBrgy[brgy] = (groupedByBrgy[brgy] || 0) + 1;

         const dateKey = new Date(r.created_at).toISOString().split('T')[0];
         reportsByDate[dateKey] = (reportsByDate[dateKey] || 0) + 1;

         // Group by issue_type for bar chart - use other_type_specification when issue_type is 'other'
         const issueLabel = r.issue_type === 'other' && r.other_type_specification
           ? r.other_type_specification
           : (r.issue_type || 'Unknown');
         groupedByIssueType[issueLabel] = (groupedByIssueType[issueLabel] || 0) + 1;
      });

      // Issue type data for bar chart - sorted by count descending
      const issueTypeData = Object.keys(groupedByIssueType)
        .map((issueType) => ({
          issueType,
          count: groupedByIssueType[issueType]
        }))
        .sort((a, b) => b.count - a.count);

      const formattedRecurring = Object.keys(groupedByBrgy).map((key) => ({
         area: key,
         issue: 'General',
         count: groupedByBrgy[key]
      })).sort((a, b) => b.count - a.count);

      const chartData = Object.keys(reportsByDate)
        .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
        .map((date) => ({
          date,
          reports: reportsByDate[date],
        }));

      return res.status(200).json({
        totalReports,
        reportedIssues,
        completedTasks,
        delayedTasks,
        pendingReports: totalReports - completedTasks - reportedIssues,
        chartData: chartData.length > 0
          ? chartData
          : [{ date: new Date().toISOString().split('T')[0], reports: 0 }],
        recurringData: formattedRecurring,
        issueTypeData
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
};
