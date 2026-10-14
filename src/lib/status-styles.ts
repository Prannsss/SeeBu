// AA-compliant badge colours (100 bg / 800 text, all >= 6:1).
const STATUS: Record<string, string> = {
  'in review': 'bg-amber-100 text-amber-800 border-amber-200',
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  approved: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  'action taken': 'bg-indigo-100 text-indigo-800 border-indigo-200',
  delegated: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  assigned: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  'in progress': 'bg-sky-100 text-sky-800 border-sky-200',
  accepted: 'bg-sky-100 text-sky-800 border-sky-200',
  resolved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
  delayed: 'bg-orange-100 text-orange-800 border-orange-200',
};

const URGENCY: Record<string, string> = {
  low: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  medium: 'bg-amber-100 text-amber-800 border-amber-200',
  high: 'bg-red-100 text-red-800 border-red-200',
  critical: 'bg-red-700 text-white border-red-800',
};

const NEUTRAL = 'bg-slate-100 text-slate-800 border-slate-200';

export function statusBadgeClass(status?: string | null): string {
  return STATUS[(status || '').trim().toLowerCase()] ?? NEUTRAL;
}

export function urgencyBadgeClass(urgency?: string | null): string {
  return URGENCY[(urgency || '').trim().toLowerCase()] ?? NEUTRAL;
}
