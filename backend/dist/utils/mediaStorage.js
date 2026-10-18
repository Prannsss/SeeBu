"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isTrustedStorageUrl = isTrustedStorageUrl;
exports.persistImageInput = persistImageInput;
exports.persistImageInputs = persistImageInputs;
exports.insertPhotoRows = insertPhotoRows;
const crypto_1 = __importDefault(require("crypto"));
const db_1 = require("../config/db");
const imageCompression_1 = require("./imageCompression");
const imageModeration_1 = require("./imageModeration");
const DEFAULT_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'report-photos';
const ORIGINALS_BUCKET = process.env.SUPABASE_STORAGE_ORIGINALS_BUCKET || 'report-photos-originals';
// Suppress repeated EgoBlur "unavailable" log noise — warn once per process start.
let egoBlurUnavailableLogged = false;
const MAX_DECODED_IMAGE_BYTES = 15 * 1024 * 1024;
/** True only for URLs hosted on our own Supabase project (storage). */
function isTrustedStorageUrl(url) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
    try {
        return !!supabaseUrl && new URL(url).host === new URL(supabaseUrl).host;
    }
    catch {
        return false;
    }
}
// Known image magic bytes — the sniffed signature decides the extension/content-type,
// never the client-declared MIME string. SVG is deliberately not supported (script risk).
const IMAGE_SIGNATURES = [
    { ext: 'jpg', mimeType: 'image/jpeg', matches: (buf) => buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff },
    { ext: 'png', mimeType: 'image/png', matches: (buf) => buf.length >= 4 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 },
    { ext: 'gif', mimeType: 'image/gif', matches: (buf) => buf.length >= 3 && buf.toString('ascii', 0, 3) === 'GIF' },
    { ext: 'webp', mimeType: 'image/webp', matches: (buf) => buf.length >= 12 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP' },
];
function sniffImageSignature(buffer) {
    return IMAGE_SIGNATURES.find((sig) => sig.matches(buffer)) || null;
}
function parseDataUrl(value) {
    const match = value.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    if (!match)
        return null;
    return {
        mimeType: match[1],
        base64Data: match[2],
    };
}
/** Sends the image to the EgoBlur sidecar to redact faces/plates.
 * Returns null when the feature is off (env unset) or the service fails —
 * fail-open by product decision: availability over privacy. */
async function blurImage(buffer, mimeType) {
    const serviceUrl = process.env.EGOBLUR_SERVICE_URL;
    if (!serviceUrl)
        return null;
    try {
        const response = await (0, imageModeration_1.serializeEgoBlur)(() => fetch(`${serviceUrl}/blur`, {
            method: 'POST',
            headers: { 'Content-Type': mimeType },
            body: new Uint8Array(buffer),
            signal: AbortSignal.timeout(30_000),
        }));
        if (!response.ok) {
            throw new Error(`EgoBlur service responded ${response.status}`);
        }
        return Buffer.from(await response.arrayBuffer());
    }
    catch (error) {
        if (!egoBlurUnavailableLogged) {
            egoBlurUnavailableLogged = true;
            console.warn('[mediaStorage] EgoBlur sidecar unavailable — storing images unblurred. Set EGOBLUR_SERVICE_URL to enable blurring.');
        }
        return null;
    }
}
async function persistImageInput(input, folder) {
    if (!input || typeof input !== 'string') {
        throw new Error('Invalid image input');
    }
    if (input.startsWith('http://') || input.startsWith('https://')) {
        if (!isTrustedStorageUrl(input))
            throw new Error('Untrusted image URL');
        return { storedUrl: input, originalPath: null };
    }
    const parsed = parseDataUrl(input);
    if (!parsed) {
        throw new Error('Unsupported image input format');
    }
    const buffer = Buffer.from(parsed.base64Data, 'base64');
    if (buffer.length > MAX_DECODED_IMAGE_BYTES) {
        throw new Error('Image is too large');
    }
    const signature = sniffImageSignature(buffer);
    if (!signature) {
        throw new Error('Image content does not match a supported image type');
    }
    // Compress before EgoBlur: smaller payload to the sidecar and to storage.
    const c = await (0, imageCompression_1.compressImage)(buffer);
    const work = c.compressed ? c : { buffer, mimeType: signature.mimeType, ext: signature.ext };
    const blurred = await blurImage(work.buffer, work.mimeType);
    // The blur service may re-encode (e.g. gif -> png), so re-sniff the result.
    const publicBuffer = blurred ?? work.buffer;
    const publicSignature = (blurred && sniffImageSignature(blurred)) || { mimeType: work.mimeType, ext: work.ext };
    const fileId = crypto_1.default.randomUUID();
    const filePath = `${folder}/${fileId}.${publicSignature.ext}`;
    const { error: uploadError } = await db_1.supabase.storage
        .from(DEFAULT_BUCKET)
        .upload(filePath, publicBuffer, {
        contentType: publicSignature.mimeType,
        upsert: false,
    });
    if (uploadError) {
        throw new Error(`Storage upload failed: ${uploadError.message}`);
    }
    let originalPath = null;
    if (blurred) {
        // Archive the unblurred (compressed) copy in a private bucket (evidence); never exposed.
        const originalObject = `${folder}/${fileId}.${work.ext}`;
        const { error: originalError } = await db_1.supabase.storage
            .from(ORIGINALS_BUCKET)
            .upload(originalObject, work.buffer, {
            contentType: work.mimeType,
            upsert: false,
        });
        if (originalError) {
            console.warn('Failed to archive original image:', originalError.message);
        }
        else {
            originalPath = `${ORIGINALS_BUCKET}/${originalObject}`;
        }
    }
    const { data } = db_1.supabase.storage.from(DEFAULT_BUCKET).getPublicUrl(filePath);
    return { storedUrl: data.publicUrl, originalPath };
}
/** Persists all images in parallel; a failed upload drops that photo (logged) rather
 * than falling back to storing raw input. Results keep input order. */
async function persistImageInputs(inputs, folder) {
    const settled = await Promise.allSettled(inputs.map((input) => persistImageInput(input, folder)));
    const results = [];
    settled.forEach((r, i) => {
        if (r.status === 'fulfilled')
            results.push(r.value);
        else
            console.error(`Image persistence failed for photo ${i}, dropping it:`, r.reason);
    });
    return results;
}
// Set once we learn migration_003 (original_photo_url column) is not applied.
let originalColumnMissing = false;
const stripOriginal = (rows) => rows.map(({ original_photo_url, ...rest }) => rest);
/** Inserts photo rows, dropping original_photo_url when the column does not exist yet. */
async function insertPhotoRows(table, rows) {
    if (rows.length === 0)
        return null;
    if (!originalColumnMissing) {
        const { error } = await db_1.supabase.from(table).insert(rows);
        if (!error)
            return null;
        if (error.code !== 'PGRST204' && error.code !== '42703' && !error.message?.includes('original_photo_url')) {
            return error;
        }
        originalColumnMissing = true;
    }
    const { error } = await db_1.supabase.from(table).insert(stripOriginal(rows));
    return error;
}
