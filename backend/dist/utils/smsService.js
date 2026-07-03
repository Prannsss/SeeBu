"use strict";
/**
 * smsService.ts
 * Utilities for sending SMS via the Synermaxx gateway.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendClientUpdateSms = exports.sendReportTrackingSms = exports.sendPasswordResetSms = void 0;
const SYNERMAXX_API_URL = process.env.SMS_SYNERMAXX_API_URL;
const SYNERMAXX_APP_KEY = process.env.SMS_SYNERMAXX_APP_KEY;
const SYNERMAXX_ORIGINATOR = process.env.SMS_SYNERMAXX_ORIGINATOR;
/** Normalize to local 09XXXXXXXXX format, as Synermaxx expects. */
function normalizePhMobile(raw) {
    let number = raw.replace(/[^0-9]/g, '');
    if (number.length === 12 && number.startsWith('63')) {
        number = '0' + number.slice(2);
    }
    else if (number.length === 10 && number.startsWith('9')) {
        number = '0' + number;
    }
    if (number.length !== 11 || !number.startsWith('09')) {
        throw new Error(`Invalid mobile number format: ${raw}`);
    }
    return number;
}
const sendSynermaxxSms = async (payload) => {
    const { message } = payload;
    const to = normalizePhMobile(payload.to);
    try {
        const response = await fetch(SYNERMAXX_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                appkey: SYNERMAXX_APP_KEY,
            },
            body: JSON.stringify({
                mobilenum: to,
                originator: SYNERMAXX_ORIGINATOR,
                fullmesg: message,
                format: 'json',
            }),
        });
        const bodyText = await response.text();
        if (!response.ok) {
            throw new Error(`Synermaxx API Error (${response.status}): ${bodyText}`);
        }
        const result = JSON.parse(bodyText);
        if (result.code === 200 && result.status === 'ACK' && result.valid_mobilenum === 1) {
            return result;
        }
        throw new Error(`Synermaxx API Error (${result.code}): ${result.desc || bodyText}`);
    }
    catch (error) {
        console.error('Synermaxx SMS Send Error:', error);
        throw new Error(`Synermaxx SMS Send Error: ${error.message}`);
    }
};
const sendPasswordResetSms = async (toPhone, code) => {
    return sendSynermaxxSms({
        to: toPhone,
        message: `SeeBu: Your password reset code is ${code}. Expires in 15 minutes. If you did not request this, please ignore.`,
    });
};
exports.sendPasswordResetSms = sendPasswordResetSms;
const sendReportTrackingSms = async (toPhone, trackingId) => {
    return sendSynermaxxSms({
        to: toPhone,
        message: `SeeBu: Your report has been received. Tracking ID: ${trackingId}.`,
    });
};
exports.sendReportTrackingSms = sendReportTrackingSms;
const sendClientUpdateSms = async (toPhone, message) => {
    return sendSynermaxxSms({
        to: toPhone,
        message: `SeeBu: ${message}`,
    });
};
exports.sendClientUpdateSms = sendClientUpdateSms;
