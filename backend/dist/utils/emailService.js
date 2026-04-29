"use strict";
/**
 * emailService.ts
 * Utilities for sending emails via Brevo REST API.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendReportTrackingEmail = exports.sendClientUpdateEmail = exports.sendVerificationEmail = exports.sendWelcomeEmail = void 0;
const BREVO_API_KEY = process.env.BREVO_API_KEY || '';
const SENDER_EMAIL = process.env.SENDER_EMAIL || process.env.EMAIL_FROM || 'noreply@seebu.com';
const SENDER_NAME = process.env.SENDER_NAME || process.env.EMAIL_FROM_NAME || 'SeeBu Team';
const sendBrevoEmail = async (payload) => {
    try {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'api-key': BREVO_API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                sender: { email: SENDER_EMAIL, name: SENDER_NAME },
                ...payload
            })
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Brevo API Error:', errorText);
            throw new Error(`Brevo API Error: ${response.status} ${response.statusText}`);
        }
        return await response.json();
    }
    catch (error) {
        console.error('Email sending failed:', error);
        throw error;
    }
};
const sendWelcomeEmail = async (toEmail, toName) => {
    const payload = {
        to: [{ email: toEmail, name: toName }],
        subject: `Welcome to SeeBu, ${toName}!`,
        htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2>Welcome to SeeBu!</h2>
        <p>Hi ${toName},</p>
        <p>Thank you for signing up to SeeBu. We are excited to have you onboard.</p>
        <p>If you have any questions, feel free to reply to this email.</p>
        <br/>
        <p>Best regards,<br/>The SeeBu Team</p>
      </div>
    `
    };
    return sendBrevoEmail(payload);
};
exports.sendWelcomeEmail = sendWelcomeEmail;
const sendVerificationEmail = async (toEmail, toName, code) => {
    const payload = {
        to: [{ email: toEmail, name: toName }],
        subject: `Your SeeBu Verification Code`,
        htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2>Verify Your Email</h2>
        <p>Hi ${toName},</p>
        <p>Your verification code is: <strong>${code}</strong></p>
        <p>Enter this code on the SeeBu platform to verify your account.</p>
        <br/>
        <p>Best regards,<br/>The SeeBu Team</p>
      </div>
    `
    };
    return sendBrevoEmail(payload);
};
exports.sendVerificationEmail = sendVerificationEmail;
const sendClientUpdateEmail = async (toEmail, toName, title, message) => {
    const payload = {
        to: [{ email: toEmail, name: toName }],
        subject: `SeeBu Update: ${title}`,
        textContent: `Hello ${toName},\n\n${message}\n\nBest,\nSeeBu Team`,
        htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2>${title}</h2>
        <p>Hello ${toName},</p>
        <p>${message}</p>
        <br/>
        <p>Best regards,<br/>The SeeBu Team</p>
      </div>
    `
    };
    return sendBrevoEmail(payload);
};
exports.sendClientUpdateEmail = sendClientUpdateEmail;
const sendReportTrackingEmail = async (toEmail, toName, trackingId, reportTitle) => {
    const payload = {
        to: [{ email: toEmail, name: toName || 'Anonymous User' }],
        subject: `Your SeeBu Report Tracking ID: ${trackingId}`,
        htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2>Report Submitted Successfully!</h2>
        <p>Hi ${toName || 'Anonymous User'},</p>
        <p>We have received your report <strong>"${reportTitle}"</strong>.</p>
        <p>Your tracking number is:</p>
        <div style="background:#f4f4f4;padding:16px;border-radius:8px;font-size:24px;font-weight:bold;text-align:center;margin:20px 0;">
          ${trackingId}
        </div>
        <p>You can track the status of your report anytime using this ID at:</p>
        <p><a href="${process.env.FRONTEND_URL || 'https://seebucommunity.vercel.app'}/track" style="color:#00B2E2;">${process.env.FRONTEND_URL || 'https://seebucommunity.vercel.app'}/track</a></p>
        <br/>
        <p>Best regards,<br/>The SeeBu Team</p>
      </div>
    `
    };
    return sendBrevoEmail(payload);
};
exports.sendReportTrackingEmail = sendReportTrackingEmail;
