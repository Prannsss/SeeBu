// One-off asset optimizer. Run from repo root: `node scripts/optimize-assets.mjs`.
// Idempotent: skips every output that already exists (and the favicon once it is small).
import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';

const kb = (p) => `${(statSync(p).size / 1024).toFixed(1)}KB`;
const transparent = { r: 0, g: 0, b: 0, alpha: 0 };

// 1) Icons + favicon (src/app/favicon.ico is really a 3240x3240 PNG)
const favicon = 'src/app/favicon.ico';
if (statSync(favicon).size > 200_000) {
  const src = readFileSync(favicon);
  const before = kb(favicon);
  for (const n of [192, 512]) {
    const out = `public/icons/icon-${n}x${n}.png`;
    await sharp(src).resize(n, n, { fit: 'contain', background: transparent }).png({ compressionLevel: 9, palette: true }).toFile(out);
    console.log(`${out}: ${kb(out)}`);
  }
  const sizes = [16, 32, 48];
  const pngs = await Promise.all(
    sizes.map((n) => sharp(src).resize(n, n, { fit: 'contain', background: transparent }).png({ compressionLevel: 9 }).toBuffer())
  );
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(sizes.length, 4);
  let offset = 6 + 16 * sizes.length;
  const entries = sizes.map((n, i) => {
    const e = Buffer.alloc(16);
    e.writeUInt8(n, 0); // width
    e.writeUInt8(n, 1); // height
    e.writeUInt8(0, 2); // colors
    e.writeUInt8(0, 3); // reserved
    e.writeUInt16LE(1, 4); // planes
    e.writeUInt16LE(32, 6); // bpp
    e.writeUInt32LE(pngs[i].length, 8);
    e.writeUInt32LE(offset, 12);
    offset += pngs[i].length;
    return e;
  });
  writeFileSync(favicon, Buffer.concat([header, ...entries, ...pngs]));
  console.log(`${favicon}: ${before} -> ${kb(favicon)}`);
} else {
  console.log(`skip ${favicon} (already ${kb(favicon)})`);
}

// 2) GIFs -> animated WebP
for (const [name, width] of [['build', 800], ['auth', 800], ['verify', 800], ['info', 600]]) {
  const src = `public/gifs/${name}.gif`;
  const out = `public/gifs/${name}.webp`;
  if (existsSync(out)) { console.log(`skip ${out}`); continue; }
  await sharp(src, { animated: true }).resize({ width, withoutEnlargement: true }).webp({ quality: 60, effort: 4 }).toFile(out);
  console.log(`${out}: ${kb(src)} -> ${kb(out)}`);
}

// 3) Header/footer logo
const logo = 'public/assets/logo-128.png';
if (existsSync(logo)) console.log(`skip ${logo}`);
else {
  await sharp('public/assets/logo.svg', { density: 300 }).resize(128, 128, { fit: 'contain', background: transparent }).png({ compressionLevel: 9 }).toFile(logo);
  console.log(`${logo}: ${kb('public/assets/logo.svg')} -> ${kb(logo)}`);
}

// 4) Error page illustrations
for (const [src, out] of [['public/assets/forbidden.svg', 'public/assets/forbidden.webp'], ['public/assets/not found.svg', 'public/assets/not-found.webp']]) {
  if (existsSync(out)) { console.log(`skip ${out}`); continue; }
  await sharp(src, { density: 150 }).resize({ width: 600 }).webp({ quality: 75 }).toFile(out);
  console.log(`${out}: ${kb(src)} -> ${kb(out)}`);
}
