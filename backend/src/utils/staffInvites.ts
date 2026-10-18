import crypto from 'crypto';

export type InviteRole = 'admin' | 'workforce-admin' | 'workforce';

export const INVITE_TTL_DAYS = 7;

export const ROLE_LABEL: Record<string, string> = {
  admin: 'Admin',
  superadmin: 'Super Admin',
  'workforce-admin': 'Workforce Admin',
  workforce: 'Workforce Officer',
  client: 'Citizen',
};

export const HOME_PATH: Record<string, string> = {
  admin: '/admin',
  superadmin: '/superadmin',
  'workforce-admin': '/workforce-admin',
  workforce: '/workforce',
  client: '/client',
};

/** Same rules as the frontend's PasswordChecklist. Returns what's missing (empty when valid). */
export function passwordProblems(password: unknown): string[] {
  const p = typeof password === 'string' ? password : '';
  const rules: [boolean, string][] = [
    [p.length >= 8, 'at least 8 characters'],
    [p.length <= 72, 'no more than 72 characters'], // bcrypt only uses the first 72 bytes
    [/[A-Z]/.test(p), 'an uppercase letter'],
    [/[a-z]/.test(p), 'a lowercase letter'],
    [/[0-9]/.test(p), 'a number'],
    [/[^A-Za-z0-9]/.test(p), 'a special character'],
  ];
  return rules.filter(([ok]) => !ok).map(([, rule]) => rule);
}

/** 12 characters that always satisfy passwordProblems; no look-alikes (0/O, 1/l/I) since it's typed from an email. */
export function temporaryPassword(): string {
  const pick = (chars: string) => chars[crypto.randomInt(chars.length)];
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnpqrstuvwxyz';
  const digits = '23456789';
  const symbols = '!@#$%*?';
  const chars = [pick(upper), pick(lower), pick(digits), pick(symbols)];
  while (chars.length < 12) chars.push(pick(upper + lower + digits));
  for (let i = chars.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

/** Invitation links carry a random token; the database only ever stores its hash. */
export const newInviteToken = () => crypto.randomBytes(32).toString('base64url');
export const hashInviteToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex');

/** Admins manage their municipality's admins and workforce admins; workforce admins, their department's officers. */
export function inTeam(
  inv: { role: string; municipality_id: string | null; department_id: number | string | null },
  user: { role: string; municipality_id?: string | null; department_id?: number | string | null }
): boolean {
  if (user.role === 'admin') return inv.role !== 'workforce' && !!user.municipality_id && inv.municipality_id === user.municipality_id;
  if (user.role === 'workforce-admin') {
    return inv.role === 'workforce' && !!user.department_id && Number(inv.department_id) === Number(user.department_id);
  }
  return false;
}

/**
 * Only whoever sent an invitation may cancel, revoke or restore it. Once that person has left the
 * team (their account isn't Active anymore), anyone on the team may, so no one is left unmanageable.
 */
export function canManage(inv: { invited_by: string }, userId: string, inviterActive: boolean): boolean {
  return inv.invited_by === userId || !inviterActive;
}
