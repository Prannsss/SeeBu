"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.compressImage = compressImage;
const sharp_1 = __importDefault(require("sharp"));
sharp_1.default.cache(false); // low-memory Render instances
/** Auto-rotates, fits inside maxEdge (no enlargement) and re-encodes to WebP.
 * Metadata (incl. EXIF GPS) is stripped. On failure returns the input untouched
 * with compressed:false and empty mimeType/ext — the caller keeps its own sniffed type. */
async function compressImage(input, opts = {}) {
    const maxEdge = opts.maxEdge ?? 1920;
    try {
        const out = await (0, sharp_1.default)(input, { failOn: 'none', limitInputPixels: 100_000_000 })
            .rotate()
            .resize({ width: maxEdge, height: maxEdge, fit: 'inside', withoutEnlargement: true })
            .webp({ quality: opts.quality ?? 80, effort: 4 })
            .toBuffer();
        return { buffer: out, mimeType: 'image/webp', ext: 'webp', compressed: true };
    }
    catch (err) {
        console.warn('[imageCompression] falling back to original:', err?.message);
        return { buffer: input, mimeType: '', ext: '', compressed: false };
    }
}
