"use strict";
/**
 * emailService.ts
 * Utilities for sending emails via AWS SES (SMTP) using nodemailer.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendReportTrackingEmail = exports.sendClientUpdateEmail = exports.sendVerificationEmail = exports.sendWelcomeEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
/** Escape user-controlled values before interpolating into HTML email templates. */
function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
const transporter = nodemailer_1.default.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});
const FROM_EMAIL = process.env.SMTP_FROM_EMAIL;
const FROM_NAME = process.env.SMTP_FROM_NAME;
const sendSmtpEmail = async (payload) => {
    const { to, subject, html, text } = payload;
    try {
        return await transporter.sendMail({
            from: `${FROM_NAME} <${FROM_EMAIL}>`,
            to,
            subject,
            html,
            ...(text ? { text } : {}),
        });
    }
    catch (error) {
        console.error('SMTP Send Error:', error);
        throw new Error(`SMTP Send Error: ${error.message}`);
    }
};
const sendWelcomeEmail = async (toEmail, toName) => {
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
exports.sendWelcomeEmail = sendWelcomeEmail;
const sendVerificationEmail = async (toEmail, toName, code) => {
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
exports.sendVerificationEmail = sendVerificationEmail;
const sendClientUpdateEmail = async (toEmail, toName, title, message) => {
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
exports.sendClientUpdateEmail = sendClientUpdateEmail;
const sendReportTrackingEmail = async (toEmail, toName, trackingId, reportTitle) => {
    const frontendUrl = process.env.FRONTEND_URL || 'https://seebucommunity.vercel.app';
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
exports.sendReportTrackingEmail = sendReportTrackingEmail;
