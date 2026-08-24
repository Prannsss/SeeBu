"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.moderateImage = moderateImage;
const genkit_1 = require("../ai/genkit");
const zod_1 = require("zod");
const ImageModerationSchema = zod_1.z.object({
    safe: zod_1.z.boolean().describe("True if image does NOT contain identifiable people, faces, vehicle license plates, or sensitive personal data."),
    hasPerson: zod_1.z.boolean().describe("True if image contains visible human faces, individuals, or persons."),
    hasPlateNumber: zod_1.z.boolean().describe("True if image contains vehicle license plate numbers."),
    hasSensitiveData: zod_1.z.boolean().describe("True if image contains confidential personal documents, IDs, or sensitive numbers."),
    reason: zod_1.z.string().optional().nullable().describe("Brief explanation if image is unsafe."),
});
function parseDataUrl(value) {
    const match = value.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    if (!match)
        return null;
    return {
        mimeType: match[1],
        base64Data: match[2],
    };
}
/**
 * Checks image against EgoBlur sidecar detection if available.
 */
async function checkEgoBlurDetection(buffer, mimeType) {
    const serviceUrl = process.env.EGOBLUR_SERVICE_URL;
    if (!serviceUrl)
        return null;
    try {
        const response = await fetch(`${serviceUrl}/detect`, {
            method: 'POST',
            headers: { 'Content-Type': mimeType },
            body: new Uint8Array(buffer),
            signal: AbortSignal.timeout(5000),
        });
        if (!response.ok) {
            return null;
        }
        const data = await response.json();
        const hasPerson = Boolean(data.has_person);
        const hasPlateNumber = Boolean(data.has_license_plate);
        const isSafe = !hasPerson && !hasPlateNumber;
        return {
            safe: isSafe,
            reason: isSafe ? null : 'Image might contain sensitive data/information please retake the image',
            details: {
                hasPerson,
                hasPlateNumber,
                hasSensitiveData: false,
            },
        };
    }
    catch (err) {
        // If sidecar is offline, fallback gracefully
        return null;
    }
}
/**
 * Checks image using Genkit / Gemini Vision if API key is configured.
 */
async function checkAiVisionModeration(dataUrl) {
    // Only attempt if Google GenAI / Gemini is usable
    if (!process.env.GEMINI_API_KEY && !process.env.GOOGLE_GENAI_API_KEY) {
        return null;
    }
    try {
        const response = await genkit_1.ai.generate({
            prompt: [
                { text: "Analyze this image submitted for a civic issue report. Does this image contain any identifiable people/faces, vehicle license plate numbers, or sensitive personal documents/IDs? If yes, mark safe as false." },
                { media: { url: dataUrl } }
            ],
            output: { schema: ImageModerationSchema },
        });
        const output = response.output;
        if (output) {
            const isSafe = output.safe && !output.hasPerson && !output.hasPlateNumber && !output.hasSensitiveData;
            return {
                safe: isSafe,
                reason: isSafe ? null : 'Image might contain sensitive data/information please retake the image',
                details: {
                    hasPerson: Boolean(output.hasPerson),
                    hasPlateNumber: Boolean(output.hasPlateNumber),
                    hasSensitiveData: Boolean(output.hasSensitiveData),
                },
            };
        }
    }
    catch (err) {
        console.warn('[IMAGE_MODERATION] GenAI vision check failed or unconfigured:', err);
    }
    return null;
}
/**
 * Scans an image (data URL or buffer) for sensitive data (people, plates, sensitive docs).
 */
async function moderateImage(imageInput) {
    if (!imageInput || typeof imageInput !== 'string') {
        return { safe: true, reason: null };
    }
    const parsed = parseDataUrl(imageInput);
    if (parsed) {
        const buffer = Buffer.from(parsed.base64Data, 'base64');
        // 1. Try EgoBlur sidecar detection first
        const egoblurResult = await checkEgoBlurDetection(buffer, parsed.mimeType);
        if (egoblurResult !== null) {
            return egoblurResult;
        }
        // 2. Try GenAI Vision detection if available
        const aiResult = await checkAiVisionModeration(imageInput);
        if (aiResult !== null) {
            return aiResult;
        }
    }
    // Fallback: If neither sidecar nor GenAI is active on backend, client-side detector handles it.
    return {
        safe: true,
        reason: null,
        details: {
            hasPerson: false,
            hasPlateNumber: false,
            hasSensitiveData: false,
        },
    };
}
