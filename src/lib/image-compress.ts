// Client-side photo compression before upload.
// Budget: 5 photos x 450KB x 1.37 (base64) ≈ 3.1MB per request, under Vercel's
// 4.5MB route-handler body limit. The old 1.2MB target produced ~8MB requests
// (413 in production). The backend (sharp) re-normalizes anyway.
export const UPLOAD_MAX_EDGE = 1600;
export const UPLOAD_TARGET_BYTES = 450 * 1024;

const QUALITIES = [0.82, 0.72, 0.62, 0.52, 0.42];
const UNSUPPORTED_MESSAGE = 'This photo format is not supported. Please choose a JPG or PNG image.';

function loadImageElement(file: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error(UNSUPPORTED_MESSAGE)); };
    img.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to compress image.'));
    }, 'image/jpeg', quality);
  });
}

async function encodeAtEdge(img: HTMLImageElement, maxEdge: number, targetBytes: number): Promise<Blob> {
  const width = img.naturalWidth || img.width;
  const height = img.naturalHeight || img.height;
  const scale = Math.min(1, maxEdge / Math.max(width, height));

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Image compression context is unavailable.');
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  let blob: Blob | null = null;
  for (const quality of QUALITIES) {
    blob = await canvasToBlob(canvas, quality);
    if (blob.size <= targetBytes) break;
  }
  return blob!;
}

export async function compressImageFile(
  file: Blob,
  opts?: { maxEdge?: number; targetBytes?: number }
): Promise<Blob> {
  const maxEdge = opts?.maxEdge ?? UPLOAD_MAX_EDGE;
  const targetBytes = opts?.targetBytes ?? UPLOAD_TARGET_BYTES;
  const img = await loadImageElement(file);

  const blob = await encodeAtEdge(img, maxEdge, targetBytes);
  if (blob.size <= targetBytes) return blob;
  // Still too big at the lowest quality: retry once with a smaller edge.
  return encodeAtEdge(img, Math.round(maxEdge * 0.75), targetBytes);
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('Invalid image format'));
    };
    reader.onerror = () => reject(new Error('Failed to read selected photo'));
    reader.readAsDataURL(blob);
  });
}

export async function compressToDataUrl(
  file: Blob,
  opts?: { maxEdge?: number; targetBytes?: number }
): Promise<string> {
  return blobToDataUrl(await compressImageFile(file, opts));
}
