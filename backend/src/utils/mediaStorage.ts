import crypto from 'crypto';
import { supabase } from '../config/db';

const DEFAULT_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'report-photos';
const ORIGINALS_BUCKET = process.env.SUPABASE_STORAGE_ORIGINALS_BUCKET || 'report-photos-originals';

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

/** Sends the image to the EgoBlur sidecar to redact faces/plates.
 * Returns null when the feature is off (env unset) or the service fails —
 * fail-open by product decision: availability over privacy. */
async function blurImage(buffer: Buffer, mimeType: string): Promise<Buffer | null> {
  const serviceUrl = process.env.EGOBLUR_SERVICE_URL;
  if (!serviceUrl) return null;

  try {
    const response = await fetch(`${serviceUrl}/blur`, {
      method: 'POST',
      headers: { 'Content-Type': mimeType },
      body: new Uint8Array(buffer),
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) {
      throw new Error(`EgoBlur service responded ${response.status}`);
    }
    return Buffer.from(await response.arrayBuffer());
  } catch (error) {
    console.warn('EgoBlur unavailable, storing image unblurred:', error);
    return null;
  }
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

  const blurred = await blurImage(buffer, signature.mimeType);
  // The blur service may re-encode (e.g. gif -> png), so re-sniff the result.
  const publicBuffer = blurred ?? buffer;
  const publicSignature = (blurred && sniffImageSignature(blurred)) || signature;

  const fileId = crypto.randomUUID();
  const filePath = `${folder}/${fileId}.${publicSignature.ext}`;

  const { error: uploadError } = await supabase.storage
    .from(DEFAULT_BUCKET)
    .upload(filePath, publicBuffer, {
      contentType: publicSignature.mimeType,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Storage upload failed: ${uploadError.message}`);
  }

  if (blurred) {
    // Archive the unblurred original in a private bucket (evidence); never exposed.
    const { error: originalError } = await supabase.storage
      .from(ORIGINALS_BUCKET)
      .upload(`${folder}/${fileId}.${signature.ext}`, buffer, {
        contentType: signature.mimeType,
        upsert: false,
      });
    if (originalError) {
      console.warn('Failed to archive original image:', originalError.message);
    }
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
