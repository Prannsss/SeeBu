"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Run: npx tsx src/utils/imageCompression.check.ts (no DB/network)
const strict_1 = __importDefault(require("node:assert/strict"));
const sharp_1 = __importDefault(require("sharp"));
const imageCompression_1 = require("./imageCompression");
async function main() {
    const jpeg = await (0, sharp_1.default)({ create: { width: 4000, height: 3000, channels: 3, background: { r: 200, g: 60, b: 60 } } })
        .jpeg()
        .withMetadata({ orientation: 6 })
        .toBuffer();
    const c = await (0, imageCompression_1.compressImage)(jpeg);
    strict_1.default.equal(c.compressed, true);
    strict_1.default.equal(c.mimeType, 'image/webp');
    const meta = await (0, sharp_1.default)(c.buffer).metadata();
    strict_1.default.equal(meta.format, 'webp');
    strict_1.default.ok(Math.max(meta.width, meta.height) <= 1920, 'fits inside 1920');
    strict_1.default.ok(meta.width < meta.height, 'EXIF rotation applied');
    strict_1.default.equal(meta.exif, undefined);
    strict_1.default.equal(meta.orientation, undefined);
    strict_1.default.ok(c.buffer.length < jpeg.length, 'output smaller than input');
    const png = await (0, sharp_1.default)({ create: { width: 800, height: 600, channels: 4, background: { r: 0, g: 0, b: 255, alpha: 0.5 } } })
        .png()
        .toBuffer();
    const p = await (0, sharp_1.default)((await (0, imageCompression_1.compressImage)(png)).buffer).metadata();
    strict_1.default.equal(p.width, 800, 'no enlargement');
    strict_1.default.equal(p.hasAlpha, true);
    const garbage = Buffer.from('not an image');
    const g = await (0, imageCompression_1.compressImage)(garbage);
    strict_1.default.equal(g.compressed, false);
    strict_1.default.equal(g.buffer, garbage);
    console.log('imageCompression.check PASS');
}
main().then(() => process.exit(0), (err) => {
    console.error('imageCompression.check FAIL:', err);
    process.exit(1);
});
