import { supabase } from '../config/db';

const DEFAULT_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'report-photos';

type UploadResult = {
  original: string;
  storedUrl: string;
};

function parseDataUrl(value: string): { mimeType: string; base64Data: string } | null {
  const match = value.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) return null;
  return {
    mimeType: match[1],
    base64Data: match[2],
  };
}

function extensionFromMime(mimeType: string): string {
  const parts = mimeType.split('/');
  return (parts[1] || 'jpg').toLowerCase();
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
    return { original: input, storedUrl: input };
  }

  const buffer = Buffer.from(parsed.base64Data, 'base64');
  const ext = extensionFromMime(parsed.mimeType);
  const filePath = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(DEFAULT_BUCKET)
    .upload(filePath, buffer, {
      contentType: parsed.mimeType,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Storage upload failed: ${uploadError.message}`);
  }

  const { data } = supabase.storage.from(DEFAULT_BUCKET).getPublicUrl(filePath);
  return { original: input, storedUrl: data.publicUrl };
}

export async function persistImageInputs(inputs: string[], folder: string): Promise<string[]> {
  const results: string[] = [];

  for (const input of inputs) {
    try {
      const persisted = await persistImageInput(input, folder);
      results.push(persisted.storedUrl);
    } catch (error) {
      console.error('Image persistence failed, keeping original input as fallback:', error);
      results.push(input);
    }
  }

  return results;
}
