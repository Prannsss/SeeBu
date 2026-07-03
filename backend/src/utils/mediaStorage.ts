import crypto from 'crypto';
import { supabase } from '../config/db';

const DEFAULT_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'report-photos';

type UploadResult = {
  original: string;
  storedUrl: string;
};

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

export async function persistImageInput(input: string, folder: string): Promise<UploadResult> {
  if (!input || typeof input !== 'string') {
    throw new Error('Invalid image input');
  }

  if (input.startsWith('http://') || input.startsWith('https://')) {
    return { original: input, storedUrl: input };
  }

  const parsed = parseDataUrl(input);
  if (!parsed) {
    throw new Error('Unsupported image input format');
  }

  const buffer = Buffer.from(parsed.base64Data, 'base64');
  const signature = sniffImageSignature(buffer);
  if (!signature) {
    throw new Error('Image content does not match a supported image type');
  }

  const filePath = `${folder}/${crypto.randomUUID()}.${signature.ext}`;

  const { error: uploadError } = await supabase.storage
    .from(DEFAULT_BUCKET)
    .upload(filePath, buffer, {
      contentType: signature.mimeType,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Storage upload failed: ${uploadError.message}`);
  }

  const { data } = supabase.storage.from(DEFAULT_BUCKET).getPublicUrl(filePath);
  return { original: input, storedUrl: data.publicUrl };
}

/** Persists each image; a failed upload drops that photo (logged) rather than
 * blocking report creation or falling back to storing raw input. */
export async function persistImageInputs(inputs: string[], folder: string): Promise<string[]> {
  const results: string[] = [];

  for (const input of inputs) {
    try {
      const persisted = await persistImageInput(input, folder);
      results.push(persisted.storedUrl);
    } catch (error) {
      console.error('Image persistence failed, dropping photo:', error);
    }
  }

  return results;
}
