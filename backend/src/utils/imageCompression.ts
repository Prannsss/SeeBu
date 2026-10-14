import sharp from 'sharp';

sharp.cache(false); // low-memory Render instances

export type CompressedImage = { buffer: Buffer; mimeType: string; ext: string; compressed: boolean };

/** Auto-rotates, fits inside maxEdge (no enlargement) and re-encodes to WebP.
 * Metadata (incl. EXIF GPS) is stripped. On failure returns the input untouched
 * with compressed:false and empty mimeType/ext — the caller keeps its own sniffed type. */
export async function compressImage(input: Buffer, opts: { maxEdge?: number; quality?: number } = {}): Promise<CompressedImage> {
  const maxEdge = opts.maxEdge ?? 1920;
  try {
    const out = await sharp(input, { failOn: 'none', limitInputPixels: 100_000_000 })
      .rotate()
      .resize({ width: maxEdge, height: maxEdge, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: opts.quality ?? 80, effort: 4 })
      .toBuffer();
    return { buffer: out, mimeType: 'image/webp', ext: 'webp', compressed: true };
  } catch (err: any) {
    console.warn('[imageCompression] falling back to original:', err?.message);
    return { buffer: input, mimeType: '', ext: '', compressed: false };
  }
}
