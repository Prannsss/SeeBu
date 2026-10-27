/**
 * emailService.ts
 * Utilities for sending emails via the Brevo HTTP API.
 * (HTTPS, not SMTP — Render's free tier blocks outbound SMTP ports.)
 */

/** Escape user-controlled values before interpolating into HTML email templates. */
function escapeHtml(value: string): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const FROM_EMAIL = process.env.EMAIL_FROM as string;
const FROM_NAME = process.env.EMAIL_FROM_NAME as string;
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://seebu.prannsss.dev';

const BRAND = '#13b6ec';
const FONT = "-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

/** Shared email shell. Tables + inline styles because Gmail/Outlook ignore most CSS. */
function layout(opts: { preheader: string; heading: string; body: string }): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<title>${opts.heading}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${opts.preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;">
  <tr><td align="center" style="padding:32px 16px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
      <tr><td align="center" style="padding-bottom:20px;">
        <a href="${FRONTEND_URL}" style="text-decoration:none;">
          <img src="${FRONTEND_URL}/icons/icon-192x192.png" width="48" height="48" alt="SeeBu" style="display:block;border:0;border-radius:12px;">
        </a>
      </td></tr>
      <tr><td style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
        <div style="padding:32px 32px 28px;font-family:${FONT};color:#334155;font-size:15px;line-height:1.6;">
          <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#0f172a;">${opts.heading}</h1>
          ${opts.body}
          <p style="margin:28px 0 0;color:#475569;">— The SeeBu Team</p>
        </div>
      </td></tr>
      <tr><td align="center" style="padding:20px 16px 0;font-family:${FONT};font-size:12px;line-height:1.5;color:#64748b;">
        SeeBu · Report. Connect. Resolve. — Cebu City<br>
        <a href="${FRONTEND_URL}" style="color:#64748b;">${FRONTEND_URL.replace(/^https?:\/\//, '')}</a>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

const p = (html: string) => `<p style="margin:0 0 14px;">${html}</p>`;

/** Full-width call-to-action (the cell carries the colour so Outlook, which ignores padding on links, still shows it). */
const button = (href: string, label: string) => `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
  <tr><td align="center" style="border-radius:10px;background:${BRAND};">
    <a href="${href}" style="display:block;padding:14px 24px;font-family:${FONT};font-size:15px;font-weight:700;line-height:1.3;color:#ffffff;text-align:center;text-decoration:none;border-radius:10px;">${label}</a>
  </td></tr>
</table>`;

/** Large monospace box for OTPs and tracking IDs. */
const codeBox = (value: string, caption: string) => `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
  <tr><td align="center" style="background:#f0f9ff;border:1px dashed ${BRAND};border-radius:12px;padding:20px 12px;">
    <div style="font-family:'SFMono-Regular',Consolas,'Courier New',monospace;font-size:${value.length > 8 ? '20px' : '30px'};font-weight:700;letter-spacing:${value.length > 8 ? '1px' : '6px'};white-space:nowrap;color:#0f172a;">${value}</div>
    <div style="margin-top:6px;font-family:${FONT};font-size:12px;color:#64748b;">${caption}</div>
  </td></tr>
</table>`;

const muted = (html: string) => `<p style="margin:0 0 14px;font-size:13px;color:#64748b;">${html}</p>`;

/** Closing thank-you line: plain text, set a little apart from the content above. */
const thanks = (html: string) => `<p style="margin:20px 0 0;">${html}</p>`;

const sendSmtpEmail = async (payload: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) => {
  const { to, subject, html, text } = payload;

  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': process.env.BREVO_API_KEY as string,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        sender: { name: FROM_NAME, email: FROM_EMAIL },
        to: [{ email: to }],
        subject,
        htmlContent: html,
        ...(text ? { textContent: text } : {}),
      }),
      // Fail fast if Brevo is slow/unreachable.
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
    return await res.json();
  } catch (error: any) {
    console.error('Brevo Send Error:', error);
    throw new Error(`Brevo Send Error: ${error.message}`);
  }
};

export const sendWelcomeEmail = async (toEmail: string, toName: string) => {
  const safeName = escapeHtml(toName);
  return sendSmtpEmail({
    to: toEmail,
    subject: `Welcome to SeeBu, ${toName}!`,
    text: `Hi ${toName},\n\nThanks for joining SeeBu. Spot a pothole, broken streetlight, or garbage pile-up? Report it and track it until it's fixed: ${FRONTEND_URL}/client/report\n\n— The SeeBu Team`,
    html: layout({
      preheader: 'Your account is ready — start reporting issues in your barangay.',
      heading: `Welcome to SeeBu, ${safeName}!`,
      body:
        p('Thanks for joining. SeeBu connects you directly with your local government so community issues get seen and fixed.') +
        p('<strong>Here’s how it works:</strong>') +
        `<ol style="margin:0 0 14px;padding-left:20px;">
          <li style="margin-bottom:6px;"><strong>Report</strong> — snap a photo and pin the location.</li>
          <li style="margin-bottom:6px;"><strong>Track</strong> — follow progress with your tracking ID.</li>
          <li><strong>Resolve</strong> — see proof once the job is done.</li>
        </ol>` +
        button(`${FRONTEND_URL}/client/report`, 'Report an issue'),
    }),
  });
};

export const sendVerificationEmail = async (toEmail: string, toName: string, code: string) => {
  const safeName = escapeHtml(toName);
  return sendSmtpEmail({
    to: toEmail,
    subject: `${code} is your SeeBu verification code`,
    text: `Hi ${toName},\n\nYour SeeBu verification code is: ${code}\n\nIt expires in 15 minutes. If you didn't create a SeeBu account, ignore this email.\n\n— The SeeBu Team`,
    html: layout({
      preheader: `Your verification code is ${code}. It expires in 15 minutes.`,
      heading: 'Verify your email',
      body:
        p(`Hi ${safeName}, enter this code in SeeBu to finish setting up your account:`) +
        codeBox(code, 'Expires in 15 minutes') +
        muted('If you didn’t create a SeeBu account, you can safely ignore this email.'),
    }),
  });
};

export const sendPasswordResetEmail = async (toEmail: string, toName: string, code: string) => {
  const safeName = escapeHtml(toName);
  return sendSmtpEmail({
    to: toEmail,
    subject: `${code} is your SeeBu password reset code`,
    text: `Hi ${toName},\n\nYour SeeBu password reset code is: ${code}\n\nIt expires in 15 minutes. If you didn't request a reset, ignore this email — your password won't change.\n\n— The SeeBu Team`,
    html: layout({
      preheader: `Your password reset code is ${code}. It expires in 15 minutes.`,
      heading: 'Reset your password',
      body:
        p(`Hi ${safeName}, we got a request to reset your SeeBu password. Enter this code to choose a new one:`) +
        codeBox(code, 'Expires in 15 minutes') +
        muted('Didn’t request this? Ignore this email — your password won’t change.'),
    }),
  });
};

export const sendReportTrackingEmail = async (
  toEmail: string,
  toName: string,
  trackingId: string,
  reportTitle: string
) => {
  const safeName = escapeHtml(toName || 'there');
  const safeTitle = escapeHtml(reportTitle);
  const trackUrl = `${FRONTEND_URL}/track?id=${encodeURIComponent(trackingId)}`;

  return sendSmtpEmail({
    to: toEmail,
    subject: `Report received — tracking ID ${trackingId}`,
    text: `Hi ${toName || 'there'},\n\nWe received your report "${reportTitle}".\n\nTracking ID: ${trackingId}\n\nTrack its progress: ${trackUrl}\n\n— The SeeBu Team`,
    html: layout({
      preheader: `We received "${safeTitle}". Tracking ID: ${trackingId}`,
      heading: 'We received your report',
      body:
        p(`Hi ${safeName}, thanks for speaking up. Your report <strong>“${safeTitle}”</strong> is now with the local administration for verification.`) +
        codeBox(trackingId, 'Your tracking ID — keep it to check progress') +
        button(trackUrl, 'Track your report') +
        muted(`Or go to <a href="${FRONTEND_URL}/track" style="color:#0369a1;">${FRONTEND_URL.replace(/^https?:\/\//, '')}/track</a> and enter your tracking ID.`),
    }),
  });
};

type StageCopy = { subject: string; heading: string; lead: string; next: string; thanks: string };

/** Per-stage wording. Values passed in are already HTML-escaped. */
function stageCopy(status: string, title: string, d: { department?: string; reason?: string }): StageCopy {
  const s = status.toLowerCase();
  const dept = d.department ? `<strong>${d.department}</strong>` : 'the appropriate department';
  if (s === 'in review' || s === 'pending') return {
    subject: 'Your report is now in review',
    heading: 'Your report is now in review',
    lead: `Your report <strong>“${title}”</strong> is now being reviewed by your local administration. They will check the details, location, and photos you provided to confirm the issue and decide on the best next step.`,
    next: 'Once the review is complete, we will let you know whether your report has been forwarded to a department for action. There is nothing you need to do in the meantime.',
    thanks: 'Thank you for taking the time to report this. Every report helps make Cebu a safer and better place for everyone.',
  };
  if (s === 'action taken' || s === 'delegated' || s === 'approved') return {
    subject: `Your report has been escalated${d.department ? ` to ${d.department.replace(/<[^>]+>/g, '')}` : ''}`,
    heading: 'Your report has been escalated',
    lead: `Good news — your report <strong>“${title}”</strong> has been verified and escalated. It is now being handled by ${dept}.`,
    next: 'The department will schedule the work and assign a field team. We will notify you again as soon as the team begins working on it.',
    thanks: 'Thank you for helping your community. Reports like yours make sure issues reach the people who can fix them.',
  };
  if (s === 'in progress' || s === 'assigned' || s === 'accepted') return {
    subject: 'Work has started on your report',
    heading: 'A team is now working on your report',
    lead: `A field team${d.department ? ` from ${dept}` : ''} has been assigned and is now actively working on your report <strong>“${title}”</strong>.`,
    next: 'Depending on the nature of the issue, this may take some time to complete. Once the work is done, the team will upload photos as proof and we will let you know right away.',
    thanks: 'Thank you for your patience and for caring about your neighborhood.',
  };
  if (s === 'resolved' || s === 'completed') return {
    subject: 'Your report has been resolved',
    heading: 'Your report has been resolved 🎉',
    lead: `We are happy to let you know that your report <strong>“${title}”</strong> has been resolved${d.department ? ` by ${dept}` : ''}.`,
    next: 'The field team has submitted photos as proof of completion. You can view them, along with the full timeline of your report, using the button below. If the issue comes back, please don’t hesitate to submit a new report.',
    thanks: 'Thank you so much for speaking up. Because of you, this issue has been fixed and your community is better for it.',
  };
  if (s === 'rejected') return {
    subject: 'An update on your report',
    heading: 'Your report could not be processed',
    lead: `After careful review, your local administration was unable to process your report <strong>“${title}”</strong>.`,
    next: `${d.reason ? `<strong>Reason given:</strong> ${d.reason}<br><br>` : ''}If you believe this was a mistake, or if you have more details or clearer photos, you are very welcome to submit a new report.`,
    thanks: 'Thank you for taking the time to report this. We truly appreciate your effort to help improve your community.',
  };
  return {
    subject: `Your report is now ${status}`,
    heading: `Your report is now ${status}`,
    lead: `The status of your report <strong>“${title}”</strong> has been updated to <strong>${status}</strong>.`,
    next: 'You can view the full details and timeline of your report using the button below.',
    thanks: 'Thank you for using SeeBu and for helping improve your community.',
  };
}

export const sendClientUpdateEmail = async (
  toEmail: string,
  toName: string,
  trackingId: string,
  reportTitle: string,
  status: string,
  details: { departmentName?: string | null; rejectionReason?: string | null } = {}
) => {
  const name = toName || 'there';
  const copy = stageCopy(escapeHtml(status), escapeHtml(reportTitle), {
    department: details.departmentName ? escapeHtml(details.departmentName) : undefined,
    reason: details.rejectionReason ? escapeHtml(details.rejectionReason) : undefined,
  });
  const trackUrl = `${FRONTEND_URL}/track?id=${encodeURIComponent(trackingId)}`;
  const plain = (html: string) => html.replace(/<br\s*\/?>/g, '\n').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');

  return sendSmtpEmail({
    to: toEmail,
    subject: `${plain(copy.subject)} — ${trackingId}`,
    text: `Hi ${name},\n\n${plain(copy.lead)}\n\n${plain(copy.next)}\n\nTracking ID: ${trackingId}\nView your report: ${trackUrl}\n\n${plain(copy.thanks)}\n\n— The SeeBu Team`,
    html: layout({
      preheader: plain(copy.lead).slice(0, 120),
      heading: copy.heading,
      body:
        p(`Hi ${escapeHtml(name)},`) +
        p(copy.lead) +
        p(copy.next) +
        codeBox(trackingId, 'Your tracking ID') +
        button(trackUrl, 'View your report') +
        thanks(copy.thanks),
    }),
  });
};

// ── Staff invitations ───────────────────────────────────────────────────────

const article = (word: string) => (/^[aeiou]/i.test(word) ? 'an' : 'a');
const firstName = (name: string) => name.trim().split(/\s+/)[0] || 'there';
const phDate = (date: Date) =>
  date.toLocaleDateString('en-US', { timeZone: 'Asia/Manila', month: 'long', day: 'numeric', year: 'numeric' });
const plainText = (html: string) => html.replace(/<[^>]+>/g, '');

// Admins serve a municipality ("an Admin for Cebu City"); department staff work in one
// ("a Workforce Officer in General Maintenance, Cebu City").
const placePreposition = (roleLabel: string) => (roleLabel === 'Admin' || roleLabel === 'Super Admin' ? 'for' : 'in');

const ROLE_BLURB: Record<string, string> = {
  'Super Admin':
    "As a Super Admin, you'll oversee reports and analytics across every municipality and manage SeeBu's admins.",
  Admin:
    "As an Admin, you'll review incoming reports for your municipality, route them to the right departments, and manage your team.",
  'Workforce Admin':
    "As a Workforce Admin, you'll receive the reports routed to your department and assign them to your field officers.",
  'Workforce Officer':
    "As a Workforce Officer, you'll receive tasks from your department, carry out the work, and upload proof photos when it's done.",
};

export const sendStaffInvitationEmail = async (
  toEmail: string,
  d: {
    inviteeName: string;
    inviterName: string;
    roleLabel: string;
    /** "Cebu City" for admins; "General Maintenance, Cebu City" for department staff */
    placeName: string;
    tempPassword: string;
    inviteUrl: string;
    expiresAt: Date;
  }
) => {
  const name = escapeHtml(firstName(d.inviteeName));
  const where = escapeHtml(d.placeName);
  const asRole = `${article(d.roleLabel)} ${d.roleLabel}`;
  const role = escapeHtml(d.roleLabel);
  const inviter = escapeHtml(d.inviterName);
  const expires = phDate(d.expiresAt);
  const invitedLine = `<strong>${inviter}</strong> has invited you to become ${article(d.roleLabel)} <strong>${role}</strong> ${placePreposition(d.roleLabel)} <strong>${where}</strong> on SeeBu.`;

  return sendSmtpEmail({
    to: toEmail,
    subject: `${d.inviterName} invited you to join SeeBu as ${asRole}`,
    text:
      `Hi ${firstName(d.inviteeName)},\n\n${plainText(invitedLine)} ${ROLE_BLURB[d.roleLabel] ?? ''}\n\n` +
      `Your temporary password: ${d.tempPassword}\n\n` +
      `To get started:\n1. Accept the invitation: ${d.inviteUrl}\n2. Sign in with ${toEmail} and the temporary password above.\n3. Choose a new password that only you know.\n\n` +
      `This invitation expires on ${expires}. If you weren't expecting it, you can decline it from the same link.\n\n` +
      `Thank you, and welcome to the team!\n— The SeeBu Team`,
    html: layout({
      preheader: `${d.inviterName} invited you to become ${asRole} ${placePreposition(d.roleLabel)} ${d.placeName}.`,
      heading: "You're invited to join SeeBu",
      body:
        p(`Hi ${name},`) +
        p(`${invitedLine} ${ROLE_BLURB[d.roleLabel] ?? ''}`) +
        codeBox(escapeHtml(d.tempPassword), 'Your temporary password') +
        p('<strong>To get started:</strong>') +
        `<ol style="margin:0 0 14px;padding-left:20px;">
          <li style="margin-bottom:6px;">Accept the invitation using the button below.</li>
          <li style="margin-bottom:6px;">Sign in with <strong>${escapeHtml(toEmail)}</strong> and the temporary password above.</li>
          <li>Choose a new password that only you know.</li>
        </ol>` +
        button(d.inviteUrl, 'View invitation') +
        muted(`This invitation expires on ${expires}. If you weren't expecting it, you can decline it from the same page — your account won't be activated.`) +
        thanks("Thank you for joining us in making Cebu better. We're glad to have you on the team!"),
    }),
  });
};

export const sendInvitationResponseEmail = async (
  toEmail: string,
  d: {
    inviterName: string;
    inviteeName: string;
    inviteeEmail: string;
    roleLabel: string;
    placeName: string;
    accepted: boolean;
    dashboardUrl: string;
  }
) => {
  const invitee = `<strong>${escapeHtml(d.inviteeName)}</strong> (${escapeHtml(d.inviteeEmail)})`;
  const joining = `join <strong>${escapeHtml(d.placeName)}</strong> as ${article(d.roleLabel)} ${escapeHtml(d.roleLabel)}`;
  const lines = d.accepted
    ? [
        `Good news — ${invitee} accepted your invitation to ${joining}.`,
        "They'll choose their own password the first time they sign in, and then they can start working in SeeBu right away.",
      ]
    : [
        `${invitee} has declined your invitation to ${joining}, so their account wasn't activated.`,
        "If this was a mistake, or you'd like to invite someone else, you can send a new invitation from SeeBu at any time.",
      ];

  return sendSmtpEmail({
    to: toEmail,
    subject: `${d.inviteeName} ${d.accepted ? 'accepted' : 'declined'} your invitation to join as ${article(d.roleLabel)} ${d.roleLabel}`,
    text: `Hi ${firstName(d.inviterName)},\n\n${lines.map(plainText).join('\n\n')}\n\nOpen SeeBu: ${d.dashboardUrl}\n\n— The SeeBu Team`,
    html: layout({
      preheader: plainText(lines[0]),
      heading: d.accepted ? 'Your invitation was accepted' : 'Your invitation was declined',
      body:
        p(`Hi ${escapeHtml(firstName(d.inviterName))},`) +
        lines.map(p).join('') +
        button(d.dashboardUrl, 'Open SeeBu') +
        thanks(d.accepted ? 'Thank you for building your team on SeeBu!' : 'Thank you for keeping your team up to date.'),
    }),
  });
};

/** To the invitee: their invitation was withdrawn before they answered, or their access was removed later. */
export const sendStaffAccessEndedEmail = async (
  toEmail: string,
  d: { name: string; roleLabel: string; placeName: string; revoked: boolean }
) => {
  const asRole = `${article(d.roleLabel)} <strong>${escapeHtml(d.roleLabel)}</strong> ${placePreposition(d.roleLabel)} <strong>${escapeHtml(d.placeName)}</strong>`;
  const lines = d.revoked
    ? [
        `We wanted to let you know that your access to SeeBu as ${asRole} has been removed by your team, so you can no longer sign in with <strong>${escapeHtml(toEmail)}</strong>.`,
        'The reports and tasks you worked on stay on record, so none of your work is lost.',
        'If you think this was a mistake, please reach out to your administrator.',
      ]
    : [
        `We wanted to let you know that your invitation to join SeeBu as ${asRole} has been withdrawn, so the link and temporary password in that email no longer work.`,
        "You don't need to do anything. If you think this was a mistake, please reach out to the person who invited you.",
      ];
  const thanksLine = d.revoked
    ? "Thank you for everything you've done to help make Cebu better. We're grateful for your service!"
    : 'Thank you for your interest in SeeBu, and we apologize for any confusion.';

  return sendSmtpEmail({
    to: toEmail,
    subject: d.revoked ? 'Your SeeBu access has been removed' : 'Your SeeBu invitation was withdrawn',
    text: `Hi ${firstName(d.name)},\n\n${lines.map(plainText).join('\n\n')}\n\n${thanksLine}\n— The SeeBu Team`,
    html: layout({
      preheader: plainText(lines[0]),
      heading: d.revoked ? 'Your SeeBu access was removed' : 'Your invitation was withdrawn',
      body: p(`Hi ${escapeHtml(firstName(d.name))},`) + lines.map(p).join('') + thanks(thanksLine),
    }),
  });
};

/** To someone whose revoked access was given back: a fresh temporary password, as for a new invitee. */
export const sendStaffAccessRestoredEmail = async (
  toEmail: string,
  d: { name: string; roleLabel: string; placeName: string; tempPassword: string; loginUrl: string }
) => {
  const asRoleHtml = `${article(d.roleLabel)} <strong>${escapeHtml(d.roleLabel)}</strong> ${placePreposition(d.roleLabel)} <strong>${escapeHtml(d.placeName)}</strong>`;
  const restoredLine = `Good news — your access to SeeBu as ${asRoleHtml} has been restored by your team.`;

  return sendSmtpEmail({
    to: toEmail,
    subject: 'Your SeeBu access has been restored',
    text:
      `Hi ${firstName(d.name)},\n\n${plainText(restoredLine)}\n\n` +
      `Your temporary password: ${d.tempPassword}\n\n` +
      `Sign in with ${toEmail} and the temporary password above, then choose a new password that only you know: ${d.loginUrl}\n\n` +
      `For your security, your previous password no longer works.\n\n` +
      `Welcome back, and thank you for continuing to help make Cebu better!\n— The SeeBu Team`,
    html: layout({
      preheader: plainText(restoredLine),
      heading: 'Welcome back to SeeBu',
      body:
        p(`Hi ${escapeHtml(firstName(d.name))},`) +
        p(restoredLine) +
        codeBox(escapeHtml(d.tempPassword), 'Your temporary password') +
        p(`Sign in with <strong>${escapeHtml(toEmail)}</strong> and the temporary password above. You'll be asked to choose a new password that only you know.`) +
        button(d.loginUrl, 'Sign in to SeeBu') +
        muted('For your security, your previous password no longer works.') +
        thanks('Welcome back, and thank you for continuing to help make Cebu better!'),
    }),
  });
};

export const sendPasswordChangedEmail = async (
  toEmail: string,
  d: { name: string; roleLabel: string; dashboardUrl: string; changedAt: Date }
) => {
  const when = `${d.changedAt.toLocaleString('en-US', { timeZone: 'Asia/Manila', dateStyle: 'long', timeStyle: 'short' })} (Philippine time)`;
  return sendSmtpEmail({
    to: toEmail,
    subject: 'Your SeeBu password was changed',
    text:
      `Hi ${firstName(d.name)},\n\nThe password for your SeeBu account (${toEmail}) was changed on ${when}. ` +
      `Your account is all set — you can now use your ${d.roleLabel} dashboard: ${d.dashboardUrl}\n\n` +
      `If you didn't make this change, please reset your password right away with "Forgot password?" on the login page, and let your administrator know.\n\n` +
      `Thank you for helping keep SeeBu secure!\n— The SeeBu Team`,
    html: layout({
      preheader: 'Your account is all set — you can now use your dashboard.',
      heading: 'Your password was changed',
      body:
        p(`Hi ${escapeHtml(firstName(d.name))},`) +
        p(`This confirms that the password for your SeeBu account (<strong>${escapeHtml(toEmail)}</strong>) was changed on ${when}.`) +
        p(`Your account is all set — you can now use your ${escapeHtml(d.roleLabel)} dashboard.`) +
        button(d.dashboardUrl, 'Go to your dashboard') +
        muted(`If you didn't make this change, please reset your password right away with “Forgot password?” on the login page, and let your administrator know.`) +
        thanks('Thank you for helping keep SeeBu secure!'),
    }),
  });
};
