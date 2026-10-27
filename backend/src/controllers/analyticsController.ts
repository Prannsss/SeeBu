import { Request, Response } from 'express';
import { supabase } from '../config/db';
import { serverErrorMessage } from '../utils/errorResponse';
import { fetchAllRows } from '../utils/pagination';

// Responses are cached 60s by the cacheResponse('analytics') route middleware and invalidated on
// every report/task mutation.

// Cebu runs on Philippine time (UTC+8, no DST): ranges and day buckets use it, never UTC —
// otherwise reports filed between midnight and 8 AM land on the previous day.
const PH_OFFSET = '+08:00';
const phDayFormat = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }); // en-CA → YYYY-MM-DD
const phDay = (date: string | Date) => phDayFormat.format(new Date(date));
const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
// Longer ranges are bucketed by month so the chart stays readable.
const MAX_DAILY_BUCKETS = 92;

const addDays = (day: string, n: number) => {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const nextMonth = (month: string) => {
  const [y, m] = month.split('-').map(Number);
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`;
};

const RESOLVED = new Set(['Resolved', 'Completed']);
const IN_REVIEW = new Set(['In Review', 'Pending']);
const CLOSED_STATUSES = '(Resolved,Completed,Rejected)';

/** `from`/`to` are inclusive PH calendar days (YYYY-MM-DD); missing or malformed means unbounded. */
function parseRange(req: Request) {
  let from = DAY_PATTERN.test(String(req.query.from ?? '')) ? String(req.query.from) : null;
  let to = DAY_PATTERN.test(String(req.query.to ?? '')) ? String(req.query.to) : null;
  if (from && to && from > to) [from, to] = [to, from];
  return { from, to };
}

function applyRange(query: any, from: string | null, to: string | null) {
  if (from) query = query.gte('created_at', `${from}T00:00:00${PH_OFFSET}`);
  if (to) query = query.lt('created_at', `${addDays(to, 1)}T00:00:00${PH_OFFSET}`);
  return query;
}

const issueLabel = (row: any): string =>
  row.issue_type === 'other' && row.other_type_specification ? row.other_type_specification : (row.issue_type || 'Unknown');

/** Turns report rows (ordered by created_at ascending) into the totals and chart series. */
export function summarize(rows: any[], from: string | null, to: string | null, areaOf: (row: any) => string) {
  const totals = { total: rows.length, resolved: 0, inReview: 0, inProgress: 0, rejected: 0 };
  const byIssue = new Map<string, { resolved: number; unresolved: number }>();
  const byArea = new Map<string, number>();

  const today = phDay(new Date());
  const start = from ?? (rows.length ? phDay(rows[0].created_at) : today);
  const end = to ?? today;
  const days = Math.round((Date.parse(end) - Date.parse(start)) / 86_400_000) + 1;
  const granularity: 'day' | 'month' = days > MAX_DAILY_BUCKETS ? 'month' : 'day';
  const bucketOf = (day: string) => (granularity === 'month' ? day.slice(0, 7) : day);

  // Pre-fill every bucket so days/months without reports show as zero instead of vanishing.
  const series = new Map<string, { reports: number; resolved: number }>();
  if (granularity === 'month') {
    for (let m = start.slice(0, 7); m <= end.slice(0, 7); m = nextMonth(m)) series.set(m, { reports: 0, resolved: 0 });
  } else {
    for (let d = start; d <= end; d = addDays(d, 1)) series.set(d, { reports: 0, resolved: 0 });
  }

  for (const row of rows) {
    const resolved = RESOLVED.has(row.status);
    const rejected = row.status === 'Rejected';
    if (resolved) totals.resolved++;
    else if (rejected) totals.rejected++;
    else if (IN_REVIEW.has(row.status)) totals.inReview++;
    else totals.inProgress++;

    const bucket = series.get(bucketOf(phDay(row.created_at)));
    if (bucket) {
      bucket.reports++;
      if (resolved) bucket.resolved++;
    }

    byArea.set(areaOf(row), (byArea.get(areaOf(row)) || 0) + 1);

    // Rejected reports are invalid submissions, not open issues of that type.
    if (!rejected) {
      const issue = byIssue.get(issueLabel(row)) ?? { resolved: 0, unresolved: 0 };
      if (resolved) issue.resolved++;
      else issue.unresolved++;
      byIssue.set(issueLabel(row), issue);
    }
  }

  return {
    range: { from: start, to: end, granularity },
    totals,
    chartData: [...series].map(([date, v]) => ({ date, ...v })),
    issueTypeData: [...byIssue]
      .map(([issueType, v]) => ({ issueType, ...v }))
      .sort((a, b) => b.resolved + b.unresolved - (a.resolved + a.unresolved)),
    areaData: [...byArea].map(([area, count]) => ({ area, count })).sort((a, b) => b.count - a.count),
  };
}

/** Reports in scope that are open right now, regardless of the selected date range. Open
 * reports are a small working set, so fetching just their status is cheap. */
async function openNow(scope: (query: any) => any) {
  const rows = await fetchAllRows<{ status: string }>(() =>
    scope(supabase.from('reports').select('id, status').not('status', 'in', CLOSED_STATUSES)).order('id', { ascending: true })
  );
  const inReview = rows.filter((row) => IN_REVIEW.has(row.status)).length;
  return { total: rows.length, inReview, inProgress: rows.length - inReview };
}

export const analyticsController = {
  // SUPERADMIN: across all municipalities, optionally narrowed by municipality/barangay
  async getSuperadminAnalytics(req: Request, res: Response) {
    try {
      const { municipality_id, barangay_id } = req.query;
      const { from, to } = parseRange(req);

      const scope = (query: any) => {
        if (municipality_id && municipality_id !== 'all') query = query.eq('municipality_id', String(municipality_id));
        if (barangay_id && barangay_id !== 'all') query = query.eq('barangay_id', String(barangay_id));
        return query;
      };

      const [rows, open] = await Promise.all([
        fetchAllRows(() =>
          applyRange(
            scope(supabase.from('reports').select('status, issue_type, other_type_specification, created_at, barangay_id, municipalities(name), barangays(name)')),
            from,
            to
          )
            .order('created_at', { ascending: true })
            .order('id', { ascending: true })
        ),
        openNow(scope),
      ]);

      // Barangay names repeat across municipalities ("Poblacion"), so count by id and name the city
      // too unless the view is already narrowed to one municipality.
      const oneMunicipality = Boolean(municipality_id && municipality_id !== 'all');
      const byBarangay = new Map<string, { area: string; count: number }>();
      for (const row of rows as any[]) {
        const key = String(row.barangay_id ?? 'unknown');
        const name = row.barangays?.name || 'Unknown';
        const entry = byBarangay.get(key) ?? {
          area: oneMunicipality || !row.municipalities?.name ? name : `${name}, ${row.municipalities.name}`,
          count: 0,
        };
        entry.count++;
        byBarangay.set(key, entry);
      }

      return res.status(200).json({
        ...summarize(rows, from, to, (row) => row.municipalities?.name || 'Unknown'),
        barangayData: [...byBarangay.values()].sort((a, b) => b.count - a.count),
        openNow: open,
      });
    } catch (err: any) {
      return res.status(500).json({ error: serverErrorMessage(err) });
    }
  },

  // ADMIN: a single municipality, optionally narrowed by barangay
  async getAdminAnalytics(req: Request, res: Response) {
    try {
      const { municipality_id } = req.params;
      const { barangay_id } = req.query;
      const { from, to } = parseRange(req);

      if (!municipality_id) {
        return res.status(400).json({ error: 'municipality_id is required' });
      }

      if (req.user?.role === 'admin') {
        if (!req.user.municipality_id || req.user.municipality_id !== municipality_id) {
          return res.status(403).json({ error: 'You may only view analytics for your own municipality' });
        }
      }

      const scope = (query: any) => {
        query = query.eq('municipality_id', String(municipality_id));
        if (barangay_id && barangay_id !== 'all') query = query.eq('barangay_id', String(barangay_id));
        return query;
      };

      const [rows, open] = await Promise.all([
        fetchAllRows(() =>
          applyRange(
            scope(supabase.from('reports').select('status, issue_type, other_type_specification, created_at, barangays(name)')),
            from,
            to
          )
            .order('created_at', { ascending: true })
            .order('id', { ascending: true })
        ),
        openNow(scope),
      ]);

      return res.status(200).json({
        ...summarize(rows, from, to, (row) => row.barangays?.name || 'Unknown'),
        openNow: open,
      });
    } catch (err: any) {
      return res.status(500).json({ error: serverErrorMessage(err) });
    }
  },
};
