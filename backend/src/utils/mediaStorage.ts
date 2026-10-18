import crypto from 'crypto';
import { supabase } from '../config/db';
import { compressImage } from './imageCompression';

const DEFAULT_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'report-photos';

const MAX_DECODED_IMAGE_BYTES = 15 * 1024 * 1024;

/** True only for URLs hosted on our own Supabase project (storage). */
export function isTrustedStorageUrl(url: string): boolean {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
  try {
    return !!supabaseUrl && new URL(url).host === new URL(supabaseUrl).host;
  } catch {
    return false;
  }
}

// Known image magic bytes — the sniffed signature decides the extension/content-type,
// never the client-declared MIME string. SVG is deliberately not supported (script risk).
const IMAGE_SIGNATURES: { ext: string; mimeType: string; matches: (buf: Buffer) => boolean }[] = [
  { ext: 'jpg', mimeType: 'image/jpeg', matches: (buf) => buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff },
  { ext: 'png', mimeType: 'image/png', matches: (buf) => buf.length >= 4 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 },
  { ext: 'gif', mimeType: 'image/gif', matches: (buf) => buf.length >= 3 && buf.toString('ascii', 0, 3) === 'GIF' },
  { ext: 'webp', mimeType: 'image/webp', matches: (buf) => buf.length >= 12 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP' },
];

function sniffImageSignature(buffer: Buffer) {
  return IMAGE_SIGNATURES.find((sig) => sig.matches(buffer)) || null;
}

function parseDataUrl(value: string): { mimeType: string; base64Data: string } | null {
  const match = value.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) return null;
  return {
    mimeType: match[1],
    base64Data: match[2],
  };
}

/** Returns the public URL of the stored image. */
export async function persistImageInput(input: string, folder: string): Promise<string> {
  if (!input || typeof input !== 'string') {
    throw new Error('Invalid image input');
  }

  if (input.startsWith('http://') || input.startsWith('https://')) {
    if (!isTrustedStorageUrl(input)) throw new Error('Untrusted image URL');
    return input;
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

  const c = await compressImage(buffer);
  const work = c.compressed ? c : { buffer, mimeType: signature.mimeType, ext: signature.ext };

  const filePath = `${folder}/${crypto.randomUUID()}.${work.ext}`;

  const { error: uploadError } = await supabase.storage
    .from(DEFAULT_BUCKET)
    .upload(filePath, work.buffer, {
      contentType: work.mimeType,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Storage upload failed: ${uploadError.message}`);
  }

  const { data } = supabase.storage.from(DEFAULT_BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
}

/** Persists all images in parallel; a failed upload drops that photo (logged) rather
 * than falling back to storing raw input. Results keep input order. */
export async function persistImageInputs(inputs: string[], folder: string): Promise<string[]> {
  const settled = await Promise.allSettled(inputs.map((input) => persistImageInput(input, folder)));
  const results: string[] = [];
  settled.forEach((r, i) => {
    if (r.status === 'fulfilled') results.push(r.value);
    else console.error(`Image persistence failed for photo ${i}, dropping it:`, r.reason);
  });
  return results;
}
