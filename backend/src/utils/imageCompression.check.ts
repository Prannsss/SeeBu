// Run: npx tsx src/utils/imageCompression.check.ts (no DB/network)
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { compressImage } from './imageCompression';

async function main() {
  const jpeg = await sharp({ create: { width: 4000, height: 3000, channels: 3, background: { r: 200, g: 60, b: 60 } } })
    .jpeg()
    .withMetadata({ orientation: 6 })
    .toBuffer();
  const c = await compressImage(jpeg);
  assert.equal(c.compressed, true);
  assert.equal(c.mimeType, 'image/webp');
  const meta = await sharp(c.buffer).metadata();
  assert.equal(meta.format, 'webp');
  assert.ok(Math.max(meta.width!, meta.height!) <= 1920, 'fits inside 1920');
  assert.ok(meta.width! < meta.height!, 'EXIF rotation applied');
  assert.equal(meta.exif, undefined);
  assert.equal(meta.orientation, undefined);
  assert.ok(c.buffer.length < jpeg.length, 'output smaller than input');

  const png = await sharp({ create: { width: 800, height: 600, channels: 4, background: { r: 0, g: 0, b: 255, alpha: 0.5 } } })
    .png()
    .toBuffer();
  const p = await sharp((await compressImage(png)).buffer).metadata();
  assert.equal(p.width, 800, 'no enlargement');
  assert.equal(p.hasAlpha, true);

  const garbage = Buffer.from('not an image');
  const g = await compressImage(garbage);
  assert.equal(g.compressed, false);
  assert.equal(g.buffer, garbage);

  console.log('imageCompression.check PASS');
}

main().then(() => process.exit(0), (err) => {
  console.error('imageCompression.check FAIL:', err);
  process.exit(1);
});
