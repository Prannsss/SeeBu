import { Request, Response } from 'express';
import { supabase } from '../config/db';
import { serverErrorMessage } from '../utils/errorResponse';

// PostgREST caps responses at 1000 rows, so page through them. `build` must return a FRESH query
// with a stable order. No RPC needed: responses are cached 60s by the cacheResponse('analytics')
// route middleware and invalidated on every report/task mutation.
async function fetchAllRows<T = any>(build: () => any, pageSize = 1000): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await build().range(from, from + pageSize - 1);
    if (error) throw error;
    out.push(...(data || []));
    if (!data || data.length < pageSize) break;
  }
  return out;
}

export const analyticsController = {
  // SUPERADMIN: General overview across ALL municipalities
  async getSuperadminAnalytics(req: Request, res: Response) {
    try {
      const { municipality_id, barangay_id } = req.query;

      const applyFilters = (query: any) => {
        if (municipality_id && municipality_id !== 'all') query = query.eq('municipality_id', municipality_id);
        if (barangay_id && barangay_id !== 'all') query = query.eq('barangay_id', barangay_id);
        return query;
      };

      const [reports, { data: allMunicipalities, error: munErr }, allBarangays] = await Promise.all([
        fetchAllRows(() =>
          applyFilters(
            supabase
              .from('reports')
              .select('status, issue_type, other_type_specification, municipality_id, created_at, municipalities(name)')
          )
            .order('created_at', { ascending: true })
            .order('id', { ascending: true })
        ),
        supabase.from('municipalities').select('id, name').order('name', { ascending: true }),
        fetchAllRows(() =>
          supabase
            .from('barangays')
            .select('id, name, municipality_id')
            .order('name', { ascending: true })
            .order('id', { ascending: true })
        ),
      ]);
      if (munErr) throw munErr;

      const totalReports = reports.length;
      const reportedIssues = reports.filter(r => r.status === 'In Review').length;
      const completedTasks = reports.filter(r => r.status === 'Completed' || r.status === 'Resolved').length;

      // Format Chart Data & Recurring Data dynamically from SQL grouping instead of JSON!
      const groupedByMun: Record<string, number> = {};
      const groupedByIssueType: Record<string, { resolved: number; unresolved: number; municipalityId: string }> = {};
      const reportsByDate: Record<string, { reports: number; resolved: number }> = {};

      reports.forEach((row: any) => {
        const area = row.municipalities?.name || 'Unknown';
        groupedByMun[area] = (groupedByMun[area] || 0) + 1;
      });

      // Group by issue_type for bar chart with resolved/unresolved split
      reports.forEach((row: any) => {
        const issueLabel = row.issue_type === 'other' && row.other_type_specification
          ? row.other_type_specification
          : (row.issue_type || 'Unknown');
        const key = `${issueLabel}__${row.municipality_id}`;
        if (!groupedByIssueType[key]) {
          groupedByIssueType[key] = { resolved: 0, unresolved: 0, municipalityId: row.municipality_id };
        }
        const isResolved = row.status === 'Completed' || row.status === 'Resolved';
        if (isResolved) {
          groupedByIssueType[key].resolved++;
        } else {
          groupedByIssueType[key].unresolved++;
        }
      });

      // Build chartData with resolved/unresolved split per date
      reports.forEach((row: any) => {
        const dateKey = new Date(row.created_at).toISOString().split('T')[0];
        if (!reportsByDate[dateKey]) reportsByDate[dateKey] = { reports: 0, resolved: 0 };
        reportsByDate[dateKey].reports++;
        const isResolved = row.status === 'Completed' || row.status === 'Resolved';
        if (isResolved) reportsByDate[dateKey].resolved++;
      });

      // Issue type data for bar chart - sorted by total count descending
      const issueTypeData = Object.keys(groupedByIssueType)
        .map((key) => {
          const [issueType] = key.split('__');
          return {
            issueType,
            resolved: groupedByIssueType[key].resolved,
            unresolved: groupedByIssueType[key].unresolved,
            municipalityId: groupedByIssueType[key].municipalityId
          };
        })
        .sort((a, b) => (b.resolved + b.unresolved) - (a.resolved + a.unresolved));

      const formattedRecurring = Object.keys(groupedByMun).map((key) => ({
         area: key,
         issue: 'Various',
         count: groupedByMun[key]
      })).sort((a,b) => b.count - a.count);

      const formattedChartData = Object.keys(reportsByDate)
        .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
        .map((date) => ({
          date,
          reports: reportsByDate[date].reports,
          resolved: reportsByDate[date].resolved,
        }));

      // Return the dynamically aggregated response
      return res.status(200).json({
        totalReports,
        reportedIssues,
        completedTasks,
        pendingReports: totalReports - completedTasks - reportedIssues,
        chartData: formattedChartData.length > 0
          ? formattedChartData
          : [{ date: new Date().toISOString().split('T')[0], reports: 0, resolved: 0 }],
        recurringData: formattedRecurring,
        issueTypeData,
        municipalities: allMunicipalities,
        barangays: allBarangays
      });
    } catch (err: any) {
      return res.status(500).json({ error: serverErrorMessage(err) });
    }
  },

  // ADMIN: Filtered exclusively to a single municipality
  async getAdminAnalytics(req: Request, res: Response) {
    try {
      const { municipality_id } = req.params;
      const { barangay_id } = req.query;

      if (!municipality_id) {
        return res.status(400).json({ error: 'municipality_id is required' });
      }

      if (req.user?.role === 'admin') {
        if (!req.user.municipality_id || req.user.municipality_id !== municipality_id) {
          return res.status(403).json({ error: 'You may only view analytics for your own municipality' });
        }
      }

      const buildReportsQuery = () => {
        let query: any = supabase
          .from('reports')
          .select(`
            status,
            issue_type,
            other_type_specification,
            created_at,
            barangays(name)
          `)
          .eq('municipality_id', municipality_id);
        if (barangay_id && barangay_id !== 'all') query = query.eq('barangay_id', barangay_id);
        return query.order('created_at', { ascending: true }).order('id', { ascending: true });
      };

      // Fetch barangays for this municipality for the frontend filter
      const [allBarangays, reports] = await Promise.all([
        fetchAllRows(() =>
          supabase
            .from('barangays')
            .select('id, name, municipality_id')
            .eq('municipality_id', municipality_id)
            .order('name', { ascending: true })
            .order('id', { ascending: true })
        ),
        fetchAllRows(buildReportsQuery),
      ]);

      const totalReports = reports.length;
      const reportedIssues = reports.filter(r => r.status === 'In Review').length;
      const completedTasks = reports.filter(r => r.status === 'Completed' || r.status === 'Resolved').length;
      const delayedTasks = reports.filter(r => r.status === 'Delegated' || r.status === 'Delayed').length;

      const groupedByBrgy: Record<string, number> = {};
      const groupedByIssueType: Record<string, { resolved: number; unresolved: number }> = {};
      const reportsByDate: Record<string, { reports: number; resolved: number }> = {};

      reports.forEach((r: any) => {
        const brgy = r.barangays?.name || 'Unknown';
        groupedByBrgy[brgy] = (groupedByBrgy[brgy] || 0) + 1;

        const dateKey = new Date(r.created_at).toISOString().split('T')[0];
        if (!reportsByDate[dateKey]) reportsByDate[dateKey] = { reports: 0, resolved: 0 };
        reportsByDate[dateKey].reports++;

        // Group by issue_type with resolved/unresolved split
        const issueLabel = r.issue_type === 'other' && r.other_type_specification
          ? r.other_type_specification
          : (r.issue_type || 'Unknown');

        if (!groupedByIssueType[issueLabel]) groupedByIssueType[issueLabel] = { resolved: 0, unresolved: 0 };

        const isResolved = r.status === 'Completed' || r.status === 'Resolved';
        if (isResolved) {
          groupedByIssueType[issueLabel].resolved++;
          reportsByDate[dateKey].resolved++;
        } else {
          groupedByIssueType[issueLabel].unresolved++;
        }
      });

      // Issue type data for bar chart - sorted by total count descending
      const issueTypeData = Object.keys(groupedByIssueType)
        .map((issueType) => ({
          issueType,
          resolved: groupedByIssueType[issueType].resolved,
          unresolved: groupedByIssueType[issueType].unresolved,
        }))
        .sort((a, b) => (b.resolved + b.unresolved) - (a.resolved + a.unresolved));

      const formattedRecurring = Object.keys(groupedByBrgy).map((key) => ({
         area: key,
         issue: 'General',
         count: groupedByBrgy[key]
      })).sort((a, b) => b.count - a.count);

      const chartData = Object.keys(reportsByDate)
        .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
        .map((date) => ({
          date,
          reports: reportsByDate[date].reports,
          resolved: reportsByDate[date].resolved,
        }));

      return res.status(200).json({
        totalReports,
        reportedIssues,
        completedTasks,
        delayedTasks,
        pendingReports: totalReports - completedTasks - reportedIssues,
        chartData: chartData.length > 0
          ? chartData
          : [{ date: new Date().toISOString().split('T')[0], reports: 0, resolved: 0 }],
        recurringData: formattedRecurring,
        issueTypeData,
        barangays: allBarangays
      });
    } catch (err: any) {
      return res.status(500).json({ error: serverErrorMessage(err) });
    }
  }
};
