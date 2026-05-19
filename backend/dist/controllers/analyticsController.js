"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsController = void 0;
const db_1 = require("../config/db");
exports.analyticsController = {
    // SUPERADMIN: General overview across ALL municipalities
    async getSuperadminAnalytics(req, res) {
        try {
            const { municipality_id, barangay_id } = req.query;
            let queryStatus = db_1.supabase.from('reports').select('status');
            let queryIssue = db_1.supabase.from('reports').select('issue_type, other_type_specification, municipality_id, status');
            let queryRec = db_1.supabase.from('reports').select(`
          issue_type,
          other_type_specification,
          count:id,
          municipalities(name)
        `);
            let queryTime = db_1.supabase.from('reports').select('created_at, status').order('created_at', { ascending: true });
            if (municipality_id && municipality_id !== 'all') {
                queryStatus = queryStatus.eq('municipality_id', municipality_id);
                queryIssue = queryIssue.eq('municipality_id', municipality_id);
                queryRec = queryRec.eq('municipality_id', municipality_id);
                queryTime = queryTime.eq('municipality_id', municipality_id);
            }
            if (barangay_id && barangay_id !== 'all') {
                queryStatus = queryStatus.eq('barangay_id', barangay_id);
                queryIssue = queryIssue.eq('barangay_id', barangay_id);
                queryRec = queryRec.eq('barangay_id', barangay_id);
                queryTime = queryTime.eq('barangay_id', barangay_id);
            }
            const { data: statusCounts, error: statusErr } = await queryStatus;
            if (statusErr)
                throw statusErr;
            const totalReports = statusCounts.length;
            const reportedIssues = statusCounts.filter(r => r.status === 'In Review').length;
            const completedTasks = statusCounts.filter(r => r.status === 'Completed' || r.status === 'Resolved').length;
            const { data: reportsWithIssueType, error: issueTypeErr } = await queryIssue;
            if (issueTypeErr)
                throw issueTypeErr;
            const { data: allMunicipalities, error: munErr } = await db_1.supabase
                .from('municipalities')
                .select('id, name')
                .order('name', { ascending: true });
            if (munErr)
                throw munErr;
            const { data: allBarangays, error: brgyErr } = await db_1.supabase
                .from('barangays')
                .select('id, name, municipality_id')
                .order('name', { ascending: true });
            if (brgyErr)
                throw brgyErr;
            const { data: recurringData, error: recErr } = await queryRec;
            if (recErr)
                throw recErr;
            const { data: reportsOverTime, error: reportsOverTimeErr } = await queryTime;
            if (reportsOverTimeErr)
                throw reportsOverTimeErr;
            // Format Chart Data & Recurring Data dynamically from SQL grouping instead of JSON!
            const groupedByMun = {};
            const groupedByIssueType = {};
            const reportsByDate = {};
            recurringData.forEach((row) => {
                const area = row.municipalities?.name || 'Unknown';
                groupedByMun[area] = (groupedByMun[area] || 0) + 1;
            });
            // Group by issue_type for bar chart with resolved/unresolved split
            (reportsWithIssueType || []).forEach((row) => {
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
                }
                else {
                    groupedByIssueType[key].unresolved++;
                }
            });
            // Build chartData with resolved/unresolved split per date
            (reportsOverTime || []).forEach((row) => {
                const dateKey = new Date(row.created_at).toISOString().split('T')[0];
                if (!reportsByDate[dateKey])
                    reportsByDate[dateKey] = { reports: 0, resolved: 0 };
                reportsByDate[dateKey].reports++;
                const isResolved = row.status === 'Completed' || row.status === 'Resolved';
                if (isResolved)
                    reportsByDate[dateKey].resolved++;
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
            })).sort((a, b) => b.count - a.count);
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
        }
        catch (err) {
            return res.status(500).json({ error: err.message });
        }
    },
    // ADMIN: Filtered exclusively to a single municipality
    async getAdminAnalytics(req, res) {
        try {
            const { municipality_id } = req.params;
            const { barangay_id } = req.query;
            if (!municipality_id) {
                return res.status(400).json({ error: 'municipality_id is required' });
            }
            let reportsQuery = db_1.supabase
                .from('reports')
                .select(`
          status,
          issue_type,
          other_type_specification,
          created_at,
          barangays(name)
        `)
                .eq('municipality_id', municipality_id);
            if (barangay_id && barangay_id !== 'all') {
                reportsQuery = reportsQuery.eq('barangay_id', barangay_id);
            }
            // Fetch barangays for this municipality for the frontend filter
            const { data: allBarangays, error: brgyErr } = await db_1.supabase
                .from('barangays')
                .select('id, name, municipality_id')
                .eq('municipality_id', municipality_id)
                .order('name', { ascending: true });
            if (brgyErr)
                throw brgyErr;
            const { data: reports, error } = await reportsQuery;
            if (error)
                throw error;
            const totalReports = reports.length;
            const reportedIssues = reports.filter(r => r.status === 'In Review').length;
            const completedTasks = reports.filter(r => r.status === 'Completed' || r.status === 'Resolved').length;
            const delayedTasks = reports.filter(r => r.status === 'Delegated' || r.status === 'Delayed').length;
            const groupedByBrgy = {};
            const groupedByIssueType = {};
            const reportsByDate = {};
            reports.forEach((r) => {
                const brgy = r.barangays?.name || 'Unknown';
                groupedByBrgy[brgy] = (groupedByBrgy[brgy] || 0) + 1;
                const dateKey = new Date(r.created_at).toISOString().split('T')[0];
                if (!reportsByDate[dateKey])
                    reportsByDate[dateKey] = { reports: 0, resolved: 0 };
                reportsByDate[dateKey].reports++;
                // Group by issue_type with resolved/unresolved split
                const issueLabel = r.issue_type === 'other' && r.other_type_specification
                    ? r.other_type_specification
                    : (r.issue_type || 'Unknown');
                if (!groupedByIssueType[issueLabel])
                    groupedByIssueType[issueLabel] = { resolved: 0, unresolved: 0 };
                const isResolved = r.status === 'Completed' || r.status === 'Resolved';
                if (isResolved) {
                    groupedByIssueType[issueLabel].resolved++;
                    reportsByDate[dateKey].resolved++;
                }
                else {
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
        }
        catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }
};
