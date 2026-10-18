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
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2>Welcome to SeeBu!</h2>
        <p>Hi ${safeName},</p>
        <p>Thank you for signing up to SeeBu. We are excited to have you onboard.</p>
        <p>If you have any questions, feel free to reply to this email.</p>
        <br/>
        <p>Best regards,<br/>The SeeBu Team</p>
      </div>
    `,
  });
};

export const sendVerificationEmail = async (toEmail: string, toName: string, code: string) => {
  const safeName = escapeHtml(toName);
  return sendSmtpEmail({
    to: toEmail,
    subject: `Your SeeBu Verification Code`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2>Verify Your Email</h2>
        <p>Hi ${safeName},</p>
        <p>Your verification code is: <strong>${code}</strong></p>
        <p>Enter this code on the SeeBu platform to verify your account.</p>
        <p><em>Note: This code expires in <strong>15 minutes</strong>. If you did not request this, please ignore this email.</em></p>
        <br/>
        <p>Best regards,<br/>The SeeBu Team</p>
      </div>
    `,
  });
};

export const sendClientUpdateEmail = async (toEmail: string, toName: string, title: string, message: string) => {
  const safeName = escapeHtml(toName);
  const safeTitle = escapeHtml(title);
  const safeMessage = escapeHtml(message);
  return sendSmtpEmail({
    to: toEmail,
    subject: `SeeBu Update: ${title}`,
    text: `Hello ${toName},\n\n${message}\n\nBest,\nSeeBu Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2>${safeTitle}</h2>
        <p>Hello ${safeName},</p>
        <p>${safeMessage}</p>
        <br/>
        <p>Best regards,<br/>The SeeBu Team</p>
      </div>
    `,
  });
};

export const sendReportTrackingEmail = async (
  toEmail: string,
  toName: string,
  trackingId: string,
  reportTitle: string
) => {
  const frontendUrl = process.env.FRONTEND_URL || 'https://seebu.prannsss.dev';
  const safeName = escapeHtml(toName || 'Anonymous User');
  const safeTitle = escapeHtml(reportTitle);

  return sendSmtpEmail({
    to: toEmail,
    subject: `Your SeeBu Report Tracking ID: ${trackingId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2>Report Submitted Successfully!</h2>
        <p>Hi ${safeName},</p>
        <p>We have received your report <strong>"${safeTitle}"</strong>.</p>
        <p>Your tracking number is:</p>
        <div style="background:#f4f4f4;padding:16px;border-radius:8px;font-size:24px;font-weight:bold;text-align:center;margin:20px 0;">
          ${trackingId}
        </div>
        <p>You can track the status of your report anytime using this ID at:</p>
        <p><a href="${frontendUrl}/track" style="color:#00B2E2;">${frontendUrl}/track</a></p>
        <br/>
        <p>Best regards,<br/>The SeeBu Team</p>
      </div>
    `,
  });
};
