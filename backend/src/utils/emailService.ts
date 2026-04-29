/**
 * emailService.ts
 * Utilities for sending emails via Resend REST API.
 */

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = 'onboarding@resend.dev';
const FROM_NAME = 'SeeBu Team';

const sendResendEmail = async (payload: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) => {
  const { to, subject, html, text } = payload;

  const { data, error } = await resend.emails.send({
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    to: [to],
    subject,
    html,
    ...(text ? { text } : {}),
  });

  if (error) {
    console.error('Resend API Error:', error);
    throw new Error(`Resend API Error: ${error.message}`);
  }

  return data;
};

export const sendWelcomeEmail = async (toEmail: string, toName: string) => {
  return sendResendEmail({
    to: toEmail,
    subject: `Welcome to SeeBu, ${toName}!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2>Welcome to SeeBu!</h2>
        <p>Hi ${toName},</p>
        <p>Thank you for signing up to SeeBu. We are excited to have you onboard.</p>
        <p>If you have any questions, feel free to reply to this email.</p>
        <br/>
        <p>Best regards,<br/>The SeeBu Team</p>
      </div>
    `,
  });
};

export const sendVerificationEmail = async (toEmail: string, toName: string, code: string) => {
  return sendResendEmail({
    to: toEmail,
    subject: `Your SeeBu Verification Code`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2>Verify Your Email</h2>
        <p>Hi ${toName},</p>
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
  return sendResendEmail({
    to: toEmail,
    subject: `SeeBu Update: ${title}`,
    text: `Hello ${toName},\n\n${message}\n\nBest,\nSeeBu Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2>${title}</h2>
        <p>Hello ${toName},</p>
        <p>${message}</p>
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
  const frontendUrl = process.env.FRONTEND_URL || 'https://seebucommunity.vercel.app';

  return sendResendEmail({
    to: toEmail,
    subject: `Your SeeBu Report Tracking ID: ${trackingId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2>Report Submitted Successfully!</h2>
        <p>Hi ${toName || 'Anonymous User'},</p>
        <p>We have received your report <strong>"${reportTitle}"</strong>.</p>
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
