import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { supabase } from '../config/db';
import { serverErrorMessage } from '../utils/errorResponse';
import { ACCOUNT_TABLES, emailExists } from '../utils/accounts';
import { authStatusKey, cacheDel, cacheDelPrefix } from '../utils/cache';
import {
  sendInvitationResponseEmail,
  sendStaffAccessEndedEmail,
  sendStaffAccessRestoredEmail,
  sendStaffInvitationEmail,
} from '../utils/emailService';
import {
  HOME_PATH,
  INVITE_TTL_DAYS,
  InviteRole,
  ROLE_LABEL,
  canManage,
  hashInviteToken,
  inTeam,
  newInviteToken,
  temporaryPassword,
} from '../utils/staffInvites';

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://seebu.prannsss.dev';
const TABLE_FOR_ROLE: Record<string, string> = Object.fromEntries(ACCOUNT_TABLES.map(({ table, role }) => [role, table]));
// Who may invite whom: superadmins add admins and superadmins; admins add co-admins and department heads;
// department heads add officers.
const CAN_INVITE: Record<string, InviteRole[]> = {
  superadmin: ['admin', 'superadmin'],
  admin: ['admin', 'workforce-admin'],
  'workforce-admin': ['workforce'],
};
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const UNIQUE_VIOLATION = '23505';

type Invitation = {
  id: string;
  role: InviteRole;
  user_id: string | null;
  email: string;
  full_name: string;
  municipality_id: string | null;
  department_id: number | null;
  invited_by: string;
  invited_by_role: string;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled' | 'replaced' | 'revoked';
  expires_at: string;
};

/** Who to email: the invitation's details, or the account's current ones when it has an account. */
type Person = { email: string; full_name: string };

const article = (word: string) => (/^[aeiou]/i.test(word) ? 'an' : 'a');
const asRole = (role: string) => `${article(ROLE_LABEL[role])} ${ROLE_LABEL[role]}`;
const isExpired = (inv: Pick<Invitation, 'expires_at'>) => new Date(inv.expires_at).getTime() < Date.now();

async function findInvitation(token: string): Promise<Invitation | null> {
  if (!token || token.length > 100) return null;
  const { data, error } = await supabase
    .from('staff_invitations')
    .select('*')
    .eq('token_hash', hashInviteToken(token))
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Throws on a query error: whether the inviter is still active decides who may manage an invitation. */
async function loadInviter(role: string, id: string): Promise<{ full_name: string; email: string; status: string } | null> {
  const table = TABLE_FOR_ROLE[role];
  if (!table) return null;
  const { data, error } = await supabase.from(table).select('full_name, email, status').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

type Department = { id: number; name: string; municipality_id: string; department_email: string | null };

async function loadDepartment(id: number | null): Promise<Department | null> {
  if (!id) return null;
  const { data, error } = await supabase
    .from('departments')
    .select('id, name, municipality_id, department_email')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function municipalityName(id: string | null): Promise<string | null> {
  if (!id) return null;
  const { data } = await supabase.from('municipalities').select('name').eq('id', id).maybeSingle();
  return data?.name ?? null;
}

/** "Cebu City" for admins; "General Maintenance, Cebu City" for department staff; superadmins aren't tied to one. */
async function placeName(municipalityId: string | null, department: Department | null, role?: string): Promise<string> {
  if (role === 'superadmin') return 'all municipalities';
  const city = await municipalityName(municipalityId);
  if (!department) return city || 'your municipality';
  return city ? `${department.name}, ${city}` : department.name;
}

/** Why a link can't be acted on anymore, phrased for the invitee; null when it still can. */
function closedReason(inv: Invitation): string | null {
  if (inv.status === 'accepted') return "You've already accepted this invitation. Sign in to continue.";
  if (inv.status === 'declined') return 'This invitation was declined.';
  if (inv.status === 'cancelled') return 'This invitation was cancelled, so it can no longer be used.';
  if (inv.status === 'replaced') return 'This invitation was replaced by a newer one. Please use the link in your latest invitation email.';
  if (inv.status === 'revoked') return 'This invitation is no longer active. Please contact your administrator if you think this is a mistake.';
  return null;
}

/**
 * Atomically moves an invitation between statuses; false when someone else changed it first.
 * Accept, decline, cancel, replace, revoke and restore all go through here, so two can never both win.
 */
async function moveStatus(id: string, from: Invitation['status'], to: Invitation['status']): Promise<boolean> {
  const { data, error } = await supabase
    .from('staff_invitations')
    .update({ status: to, responded_at: to === 'pending' ? null : new Date().toISOString() })
    .eq('id', id)
    .eq('status', from)
    .select('id');
  if (error) throw error;
  return Boolean(data?.length);
}

/** Removes the never-activated account behind an invitation, freeing the email for a future invite. */
async function deleteInvitedAccount(inv: Pick<Invitation, 'role' | 'user_id' | 'email'>) {
  if (!inv.user_id) return;
  const { error } = await supabase
    .from(TABLE_FOR_ROLE[inv.role])
    .delete()
    .eq('id', inv.user_id)
    .eq('email', inv.email)
    .eq('status', 'Invited');
  if (error) throw error;
}

async function findTeamInvitation(req: Request): Promise<Invitation | null> {
  const id = String(req.params.id);
  if (!UUID_PATTERN.test(id)) return null;
  const { data, error } = await supabase.from('staff_invitations').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data && inTeam(data, req.user) ? data : null;
}

/** The invitation behind :id when the signed-in user may manage it; otherwise answers 404/403 and returns null. */
async function managedInvitation(req: Request, res: Response): Promise<Invitation | null> {
  const inv = await findTeamInvitation(req);
  if (!inv) {
    res.status(404).json({ error: 'Invitation not found.' });
    return null;
  }
  if (inv.invited_by !== req.user.id) {
    const inviter = await loadInviter(inv.invited_by_role, inv.invited_by);
    if (!canManage(inv, req.user.id, inviter?.status === 'Active')) {
      res.status(403).json({ error: `Only ${inviter?.full_name || 'the person who sent it'} can change this invitation.` });
      return null;
    }
  }
  return inv;
}

const STALE = 'This invitation changed in the meantime. Refresh the list to see its latest status.';

/** Tell the invitee their invitation was withdrawn or their access removed. Never blocks the action itself. */
function notifyInvitee(inv: Invitation, revoked: boolean, person: Person = inv) {
  void (async () => {
    const department = await loadDepartment(inv.department_id);
    await sendStaffAccessEndedEmail(person.email, {
      name: person.full_name,
      roleLabel: ROLE_LABEL[inv.role],
      placeName: await placeName(inv.municipality_id, department, inv.role),
      revoked,
    });
  })().catch((err) => console.error('[invitations] invitee notification failed:', err));
}

/** Tell the inviter how the invitee responded. Never blocks or fails the response itself. */
function notifyInviter(inv: Invitation, accepted: boolean) {
  void (async () => {
    const [inviter, department] = await Promise.all([loadInviter(inv.invited_by_role, inv.invited_by), loadDepartment(inv.department_id)]);
    if (!inviter?.email) return;
    await sendInvitationResponseEmail(inviter.email, {
      inviterName: inviter.full_name || 'there',
      inviteeName: inv.full_name,
      inviteeEmail: inv.email,
      roleLabel: ROLE_LABEL[inv.role],
      placeName: await placeName(inv.municipality_id, department, inv.role),
      accepted,
      dashboardUrl: `${FRONTEND_URL}${HOME_PATH[inv.invited_by_role] || ''}`,
    });
  })().catch((err) => console.error('[invitations] inviter notification failed:', err));
}

export const invitationController = {
  async create(req: Request, res: Response) {
    let createdUserId: string | null = null;
    let table = '';
    try {
      const inviterRole: string = req.user.role;
      const role = String(req.body.role || '') as InviteRole;
      const fullName = String(req.body.full_name || '').trim();
      const email = String(req.body.email || '').trim().toLowerCase();
      const contactNumber = req.body.contact_number ? String(req.body.contact_number).trim().slice(0, 20) : null;
      const newDepartmentName = String(req.body.new_department_name || '').trim();

      if (!CAN_INVITE[inviterRole]?.includes(role)) {
        return res.status(403).json({
          error: inviterRole === 'workforce-admin'
            ? 'Workforce admins can only invite workforce officers.'
            : inviterRole === 'superadmin'
              ? 'Superadmins can invite admins and superadmins.'
              : 'Admins can invite co-admins and workforce admins.',
        });
      }
      if (!fullName || fullName.length > 100) {
        return res.status(400).json({ error: 'Please enter a full name (up to 100 characters).' });
      }
      if (!EMAIL_PATTERN.test(email) || email.length > 255) {
        return res.status(400).json({ error: 'Please enter a valid email address.' });
      }

      // ── Where they'll work. Nothing is written until every check has passed. ──
      let department: Department | null = null;
      let municipalityId: string | null = null;
      let newDepartmentIn: string | null = null; // municipality to create `newDepartmentName` in

      if (role === 'superadmin') {
        // Platform-wide: no municipality or department.
      } else if (role === 'admin' && inviterRole === 'superadmin') {
        // A superadmin picks which (existing) municipality the new admin will run.
        const requested = String(req.body.municipality_id || '').trim();
        const { data: municipality, error: municipalityError } = requested
          ? await supabase.from('municipalities').select('id').eq('id', requested).maybeSingle()
          : { data: null, error: null };
        if (municipalityError) throw municipalityError;
        if (!municipality) return res.status(400).json({ error: 'Please choose the municipality this admin will manage.' });
        municipalityId = municipality.id;
      } else if (role === 'admin') {
        // Co-admins share the inviting admin's municipality.
        municipalityId = req.user.municipality_id || null;
        if (!municipalityId) return res.status(400).json({ error: "Your account isn't linked to a municipality yet." });
      } else if (role === 'workforce') {
        // Officers join the inviting workforce admin's own department.
        department = await loadDepartment(req.user.department_id ? Number(req.user.department_id) : null);
        if (!department) return res.status(400).json({ error: "Your account isn't linked to a department yet." });
        municipalityId = department.municipality_id;
      } else {
        const adminMunicipality = req.user.municipality_id;
        if (!adminMunicipality) return res.status(400).json({ error: "Your account isn't linked to a municipality yet." });

        if (newDepartmentName) {
          if (newDepartmentName.length > 100) {
            return res.status(400).json({ error: 'Department names can be up to 100 characters.' });
          }
          // Reuse a same-named department instead of creating a duplicate.
          const { data: existing, error: existingError } = await supabase
            .from('departments')
            .select('id')
            .eq('municipality_id', adminMunicipality)
            .ilike('name', newDepartmentName.replace(/[\\%_]/g, (c) => `\\${c}`))
            .limit(1);
          if (existingError) throw existingError;
          if (existing?.length) department = await loadDepartment(existing[0].id);
          else newDepartmentIn = adminMunicipality;
        } else {
          department = await loadDepartment(req.body.department_id ? Number(req.body.department_id) : null);
          if (!department) return res.status(400).json({ error: 'Please choose a department or create a new one.' });
        }
        if (department && department.municipality_id !== adminMunicipality) {
          return res.status(403).json({ error: 'That department is outside your municipality.' });
        }
        municipalityId = adminMunicipality;
      }

      // ── One open invitation per person, so invites for different roles never collide ──
      const { data: open, error: openError } = await supabase
        .from('staff_invitations')
        .select('id, role, user_id, email, invited_by, expires_at')
        .eq('email', email)
        .eq('status', 'pending')
        .maybeSingle();
      if (openError) throw openError;
      if (open) {
        const sameRole = open.role === role;
        const ownInvite = open.invited_by === req.user.id;
        if (!sameRole && !ownInvite && !isExpired(open)) {
          return res.status(409).json({
            error: `${email} already has a pending invitation to join as ${asRole(open.role)}. They need to accept or decline it before they can be invited as ${asRole(role)}.`,
          });
        }
        // Re-inviting for the same role, correcting your own invite, or clearing an expired one:
        // the earlier link stops working and only the new email counts. (If they answered it a moment
        // ago, the move fails and the email check below reports the account they now have.)
        if (await moveStatus(open.id, 'pending', 'replaced')) await deleteInvitedAccount(open as Invitation);
      }

      table = TABLE_FOR_ROLE[role];
      if (await emailExists(email)) {
        // Someone removed from this team comes back through Restore Access, which keeps their history.
        const { data: revoked, error: revokedError } = await supabase
          .from('staff_invitations')
          .select('full_name, role, municipality_id, department_id')
          .eq('email', email)
          .eq('status', 'revoked');
        if (revokedError) throw revokedError;
        const ours = (revoked ?? []).find((r: any) => inTeam(r, req.user));
        return res.status(409).json({
          error: ours
            ? `${ours.full_name}'s access was revoked earlier. To bring them back, use Restore Access in the Cancelled tab.`
            : 'An account with this email already exists.',
        });
      }

      // ponytail: a department created for an invite that then fails is kept; retrying reuses it by name.
      if (newDepartmentIn) {
        const { data: created, error: createError } = await supabase
          .from('departments')
          .insert([{ name: newDepartmentName, municipality_id: newDepartmentIn, department_email: email }])
          .select('id, name, municipality_id, department_email')
          .single();
        if (createError) throw createError;
        department = created;
      }

      // ── Account (cannot sign in until the invitation is accepted) ─────────
      const tempPassword = temporaryPassword();
      const account: Record<string, unknown> = {
        email,
        password_hash: await bcrypt.hash(tempPassword, 10),
        full_name: fullName,
        contact_number: contactNumber,
        status: 'Invited',
        email_verified: false,
      };
      // The superadmins table has no municipality column.
      if (role !== 'superadmin') account.municipality_id = municipalityId;
      if (department) account.department_id = department.id;
      if (role === 'workforce') {
        Object.assign(account, {
          employee_id: `EMP-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
          role: 'officer',
          supervisor_id: req.user.id,
        });
      }
      const { data: createdAccount, error: accountError } = await supabase.from(table).insert([account]).select('id').single();
      if (accountError) throw accountError;
      createdUserId = createdAccount.id;

      // ── Invitation ────────────────────────────────────────────────────────
      const token = newInviteToken();
      const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 86_400_000);
      const { error: inviteError } = await supabase.from('staff_invitations').insert([{
        token_hash: hashInviteToken(token),
        role,
        user_id: createdUserId,
        email,
        full_name: fullName,
        municipality_id: municipalityId,
        department_id: department?.id ?? null,
        invited_by: req.user.id,
        invited_by_role: inviterRole,
        expires_at: expiresAt.toISOString(),
      }]);
      if (inviteError) {
        // Someone else invited this address in the same moment; the unique index kept only theirs.
        if (inviteError.code === UNIQUE_VIOLATION) {
          await supabase.from(table).delete().eq('id', createdUserId);
          createdUserId = null;
          return res.status(409).json({ error: `${email} was just invited by someone else. Please refresh and try again.` });
        }
        throw inviteError;
      }

      // Without the email the invitee never gets the temporary password, so undo everything.
      const [inviter, place] = await Promise.all([loadInviter(inviterRole, req.user.id), placeName(municipalityId, department, role)]);
      try {
        await sendStaffInvitationEmail(email, {
          inviteeName: fullName,
          inviterName: inviter?.full_name || 'Your administrator',
          roleLabel: ROLE_LABEL[role],
          placeName: place,
          tempPassword,
          inviteUrl: `${FRONTEND_URL}/invite/${token}`,
          expiresAt,
        });
      } catch (mailErr) {
        console.error('[invitations] invitation email failed:', mailErr);
        await supabase.from('staff_invitations').delete().eq('user_id', createdUserId);
        await supabase.from(table).delete().eq('id', createdUserId);
        createdUserId = null;
        return res.status(502).json({ error: "We couldn't send the invitation email. Please check the address and try again." });
      }

      await cacheDelPrefix('users:', 'departments:');
      return res.status(201).json({
        message: `Invitation sent to ${email}.`,
        data: { email, role, place, department: department?.name ?? null, expires_at: expiresAt.toISOString() },
      });
    } catch (err: any) {
      // Don't leave a half-created account behind.
      if (createdUserId && table) {
        await supabase.from('staff_invitations').delete().eq('user_id', createdUserId);
        await supabase.from(table).delete().eq('id', createdUserId);
      }
      console.error('[invitations.create]', err);
      return res.status(500).json({ error: serverErrorMessage(err) });
    }
  },

  // Public: what the invitation page shows.
  async get(req: Request, res: Response) {
    try {
      const inv = await findInvitation(String(req.params.token));
      if (!inv) return res.status(404).json({ error: 'This invitation link is invalid. Please use the link from your invitation email.' });

      const [inviter, department] = await Promise.all([loadInviter(inv.invited_by_role, inv.invited_by), loadDepartment(inv.department_id)]);
      return res.status(200).json({
        data: {
          status: inv.status === 'pending' && isExpired(inv) ? 'expired' : inv.status,
          role: inv.role,
          roleLabel: ROLE_LABEL[inv.role],
          inviteeName: inv.full_name,
          email: inv.email,
          inviterName: inviter?.full_name || 'Your administrator',
          placeName: await placeName(inv.municipality_id, department, inv.role),
          expiresAt: inv.expires_at,
        },
      });
    } catch (err: any) {
      return res.status(500).json({ error: serverErrorMessage(err) });
    }
  },

  async accept(req: Request, res: Response) {
    try {
      const inv = await findInvitation(String(req.params.token));
      if (!inv) return res.status(404).json({ error: 'This invitation link is invalid.' });
      const closed = closedReason(inv);
      if (closed) return res.status(409).json({ error: closed, status: inv.status });
      if (isExpired(inv)) {
        return res.status(410).json({ error: 'This invitation has expired. Please ask for a new one.', status: 'expired' });
      }

      // Claim the invitation first, so a cancel landing at the same moment can't also succeed.
      if (!(await moveStatus(inv.id, 'pending', 'accepted'))) {
        return res.status(409).json({ error: 'This invitation is no longer open. Please refresh the page.' });
      }

      // Only the exact account this invitation created (right role table, right id) is activated.
      // Accepting from the emailed link also proves the address is theirs.
      const { data: activated, error } = await supabase
        .from(TABLE_FOR_ROLE[inv.role])
        .update({ status: 'Pending Setup', email_verified: true })
        .eq('id', inv.user_id)
        .eq('email', inv.email)
        .eq('status', 'Invited')
        .select('id');
      if (error || !activated?.length) {
        await moveStatus(inv.id, 'accepted', 'pending'); // undo the claim so the link keeps working
        if (error) throw error;
        return res.status(409).json({ error: 'This invitation is no longer valid. Please ask for a new one.' });
      }

      await cacheDel(authStatusKey(inv.role, String(inv.user_id)));
      await cacheDelPrefix('users:', 'departments:');

      notifyInviter(inv, true);
      return res.status(200).json({ message: 'Invitation accepted.', data: { email: inv.email } });
    } catch (err: any) {
      return res.status(500).json({ error: serverErrorMessage(err) });
    }
  },

  async decline(req: Request, res: Response) {
    try {
      const inv = await findInvitation(String(req.params.token));
      if (!inv) return res.status(404).json({ error: 'This invitation link is invalid.' });
      const closed = closedReason(inv);
      if (closed) return res.status(409).json({ error: closed, status: inv.status });

      if (!(await moveStatus(inv.id, 'pending', 'declined'))) {
        return res.status(409).json({ error: 'This invitation is no longer open. Please refresh the page.' });
      }
      await deleteInvitedAccount(inv); // never used; removing it frees the email for a future invitation
      await cacheDelPrefix('users:', 'departments:');

      notifyInviter(inv, false);
      return res.status(200).json({ message: 'Invitation declined.' });
    } catch (err: any) {
      return res.status(500).json({ error: serverErrorMessage(err) });
    }
  },

  // ── Team side: invitation history, cancel, revoke, restore ────────────────

  async list(req: Request, res: Response) {
    try {
      const viewerRole: string = req.user.role;
      const isSuperadmin = viewerRole === 'superadmin';
      const scopeId = viewerRole === 'admin' ? req.user.municipality_id : req.user.department_id;
      if (!isSuperadmin && !scopeId) return res.status(200).json({ data: [] });

      // ponytail: no pagination; a team's history stays small. Page it if one nears Supabase's 1,000-row cap.
      const query = supabase
        .from('staff_invitations')
        .select('id, role, user_id, email, full_name, invited_by, invited_by_role, status, expires_at, responded_at, created_at, department:departments(name), municipality:municipalities(name)')
        .order('created_at', { ascending: false });
      const { data, error } = await (isSuperadmin
        ? query.in('role', ['admin', 'superadmin'])
        : viewerRole === 'admin'
          ? query.in('role', ['admin', 'workforce-admin']).eq('municipality_id', scopeId)
          : query.eq('role', 'workforce').eq('department_id', scopeId));
      if (error) throw error;
      const rows: any[] = data ?? [];

      // Accepted and revoked ones: the account tells whether they've set their password yet,
      // and whether a revoked one can still be restored.
      const withAccount = rows.filter((r) => (r.status === 'accepted' || r.status === 'revoked') && r.user_id);
      const accountStatus = new Map<string, string>();
      await Promise.all(
        [...new Set(withAccount.map((r) => r.role as string))].map(async (role) => {
          const ids = withAccount.filter((r) => r.role === role).map((r) => r.user_id);
          const { data: accounts, error: accountsError } = await supabase.from(TABLE_FOR_ROLE[role]).select('id, status').in('id', ids);
          if (accountsError) throw accountsError;
          for (const account of accounts ?? []) accountStatus.set(account.id, account.status);
        })
      );

      // Inviters live in their own role's table (a superadmin's list also holds admins' co-admin invites).
      const inviters = new Map<string, { full_name: string; status: string }>();
      await Promise.all(
        [...new Set(rows.map((r) => String(r.invited_by_role)))].map(async (inviterRole) => {
          const table = TABLE_FOR_ROLE[inviterRole];
          if (!table) return;
          const ids = [...new Set(rows.filter((r) => r.invited_by_role === inviterRole).map((r) => r.invited_by as string))];
          const { data: found, error: invitersError } = await supabase.from(table).select('id, full_name, status').in('id', ids);
          if (invitersError) throw invitersError;
          for (const inviter of found ?? []) inviters.set(inviter.id, inviter);
        })
      );

      return res.status(200).json({
        data: rows.map((r) => ({
          id: r.id,
          role: r.role,
          roleLabel: ROLE_LABEL[r.role],
          name: r.full_name,
          email: r.email,
          department: r.department?.name ?? null,
          // Only a superadmin's list spans municipalities, so only there is it worth showing.
          municipality: isSuperadmin ? r.municipality?.name ?? null : null,
          state: r.status === 'pending' && isExpired(r) ? 'expired' : r.status,
          accountStatus: accountStatus.get(r.user_id) ?? null,
          invitedBy: inviters.get(r.invited_by)?.full_name ?? null,
          invitedByYou: r.invited_by === req.user.id,
          canManage: canManage(r, req.user.id, inviters.get(r.invited_by)?.status === 'Active'),
          isYou: r.user_id === req.user.id,
          createdAt: r.created_at,
          expiresAt: r.expires_at,
          respondedAt: r.responded_at,
        })),
      });
    } catch (err: any) {
      console.error('[invitations.list]', err);
      return res.status(500).json({ error: serverErrorMessage(err) });
    }
  },

  /** Withdraws an unanswered invitation: its link stops working and the unused account is removed. */
  async cancel(req: Request, res: Response) {
    try {
      const inv = await managedInvitation(req, res);
      if (!inv) return;
      if (inv.status === 'accepted') {
        return res.status(409).json({ error: `${inv.full_name} already accepted this invitation. Revoke their access instead.` });
      }
      if (!(await moveStatus(inv.id, 'pending', 'cancelled'))) return res.status(409).json({ error: STALE });

      await deleteInvitedAccount(inv);
      await cacheDelPrefix('users:', 'departments:');
      notifyInvitee(inv, false);
      return res.status(200).json({ message: `${inv.full_name}'s invitation was cancelled.` });
    } catch (err: any) {
      console.error('[invitations.cancel]', err);
      return res.status(500).json({ error: serverErrorMessage(err) });
    }
  },

  /** Removes someone who joined through an invitation: they're signed out and can't sign in again. */
  async revoke(req: Request, res: Response) {
    try {
      const inv = await managedInvitation(req, res);
      if (!inv) return;
      if (inv.user_id === req.user.id) return res.status(403).json({ error: "You can't revoke your own access." });
      if (inv.status === 'pending') {
        return res.status(409).json({ error: `${inv.full_name} hasn't accepted yet. Cancel the invitation instead.` });
      }
      if (!(await moveStatus(inv.id, 'accepted', 'revoked'))) return res.status(409).json({ error: STALE });

      // Deactivate, never delete: the reports and tasks they handled keep their history.
      let person: Person = inv;
      if (inv.user_id) {
        const { data: account, error } = await supabase
          .from(TABLE_FOR_ROLE[inv.role])
          .update({ status: 'Inactive' })
          .eq('id', inv.user_id)
          .select('email, full_name');
        if (error) {
          await moveStatus(inv.id, 'revoked', 'accepted');
          throw error;
        }
        if (account?.[0]) person = account[0];
        await cacheDel(authStatusKey(inv.role, inv.user_id)); // their next request is refused, signing them out
      }
      await cacheDelPrefix('users:', 'departments:');
      notifyInvitee(inv, true, person);
      return res.status(200).json({ message: `${inv.full_name}'s access was revoked.` });
    } catch (err: any) {
      console.error('[invitations.revoke]', err);
      return res.status(500).json({ error: serverErrorMessage(err) });
    }
  },

  /**
   * Gives a revoked member their access back. Their account (and history) is the same, but they get a
   * fresh temporary password by email and choose their own on sign-in, like a new invitee.
   */
  async restore(req: Request, res: Response) {
    try {
      const inv = await managedInvitation(req, res);
      if (!inv) return;
      if (inv.status !== 'revoked' || !inv.user_id) return res.status(409).json({ error: STALE });
      if (!(await moveStatus(inv.id, 'revoked', 'accepted'))) return res.status(409).json({ error: STALE });

      const table = TABLE_FOR_ROLE[inv.role];
      const tempPassword = temporaryPassword();
      const { data: account, error } = await supabase
        .from(table)
        .update({ status: 'Pending Setup', password_hash: await bcrypt.hash(tempPassword, 10) })
        .eq('id', inv.user_id)
        .eq('status', 'Inactive')
        .select('email, full_name');
      if (error || !account?.length) {
        await moveStatus(inv.id, 'accepted', 'revoked');
        if (error) throw error;
        return res.status(409).json({ error: "Their account no longer exists, so it can't be restored. Send them a new invitation instead." });
      }
      await cacheDel(authStatusKey(inv.role, inv.user_id));

      const person: Person = account[0];
      try {
        const department = await loadDepartment(inv.department_id);
        await sendStaffAccessRestoredEmail(person.email, {
          name: person.full_name,
          roleLabel: ROLE_LABEL[inv.role],
          placeName: await placeName(inv.municipality_id, department, inv.role),
          tempPassword,
          loginUrl: `${FRONTEND_URL}/auth/login?email=${encodeURIComponent(person.email)}`,
        });
      } catch (mailErr) {
        // Without the email they can't sign in, so put everything back the way it was.
        console.error('[invitations] restore email failed:', mailErr);
        await supabase.from(table).update({ status: 'Inactive' }).eq('id', inv.user_id);
        await moveStatus(inv.id, 'accepted', 'revoked');
        await cacheDel(authStatusKey(inv.role, inv.user_id));
        return res.status(502).json({
          error: "We couldn't send the email with their new temporary password, so their access is still revoked. Please try again.",
        });
      }

      await cacheDelPrefix('users:', 'departments:');
      return res.status(200).json({ message: `${person.full_name}'s access was restored.` });
    } catch (err: any) {
      console.error('[invitations.restore]', err);
      return res.status(500).json({ error: serverErrorMessage(err) });
    }
  },
};
