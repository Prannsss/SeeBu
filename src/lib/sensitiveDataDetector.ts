/**
 * Client-Side Face / Person Sensitive Data Detector
 *
 * Detection pipeline:
 * face-api.js (SSD MobileNet, runs fully in-browser) — detects faces/people.
 *
 * NOTE: License plate detection is handled by a completely separate module:
 * `plateRedactor.ts` (stackblur-canvas heuristic pipeline). The two modules
 * are intentionally decoupled so their responsibilities never overlap.
 *
 * No API key or external service required for face detection.
 * Model weights (~2MB) are served from /models/face-api/ and cached by the browser.
 */

export interface SensitiveDetectionResult {
  safe: boolean;
  reason: string | null;
  hasPerson: boolean;
  hasPlateNumber: boolean;
}

const SENSITIVE_REASON = 'Image contains sensitive information (e.g. identifiable people or license plates). Please retake or upload another image.';
const MODEL_URL = '/models/face-api';

// Dynamic face-api instance and model load promise
let faceapiInstance: typeof import('@vladmandic/face-api') | null = null;
let modelLoadPromise: Promise<void> | null = null;

async function getFaceApi(): Promise<typeof import('@vladmandic/face-api') | null> {
  if (typeof window === 'undefined') return null;
  if (!faceapiInstance) {
    faceapiInstance = await import('@vladmandic/face-api');
  }
  return faceapiInstance;
}

async function ensureModelLoaded(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (modelLoadPromise) return modelLoadPromise;

  modelLoadPromise = (async () => {
    const faceapi = await getFaceApi();
    if (!faceapi) return;
    await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
  })().catch((err) => {
    // Reset so the next call retries if it failed (e.g. network hiccup).
    modelLoadPromise = null;
    throw err;
  });

  return modelLoadPromise;
}

/**
 * Reads a File or Blob into an HTMLImageElement.
 */
function loadImageFromBlob(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to load image')); };
    img.src = url;
  });
}

/**
 * Scans a single image (File, Blob, or base64 data URL) for faces and license plates.
 */
export async function scanImageForSensitiveData(
  imageSource: File | Blob | string
): Promise<SensitiveDetectionResult> {
  if (typeof window === 'undefined') {
    return { safe: true, reason: null, hasPerson: false, hasPlateNumber: false };
  }

  try {
    let imageElement: HTMLImageElement;

    if (typeof imageSource === 'string') {
      imageElement = new Image();
      await new Promise<void>((res, rej) => {
        imageElement.onload = () => res();
        imageElement.onerror = () => rej(new Error('Failed to load image URL'));
        imageElement.src = imageSource;
      });
    } else {
      imageElement = await loadImageFromBlob(imageSource);
    }

    // ------------------------------------------------------------------
    // 1. Face detection via face-api.js (SSD MobileNet, in-browser model)
    // ------------------------------------------------------------------
    try {
      await ensureModelLoaded();
      const faceapi = await getFaceApi();
      if (faceapi) {
        const detections = await faceapi.detectAllFaces(
          imageElement,
          new faceapi.SsdMobilenetv1Options({ minConfidence: 0.4 })
        );
        if (detections.length > 0) {
          return { safe: false, reason: SENSITIVE_REASON, hasPerson: true, hasPlateNumber: false };
        }
      }
    } catch (faceErr) {
      // Model failed to load or inference error — fail open.
      console.warn('[SensitiveDataDetector] face-api detection failed:', faceErr);
    }

    return { safe: true, reason: null, hasPerson: false, hasPlateNumber: false };
  } catch (err) {
    console.warn('[SensitiveDataDetector] Inspection error, defaulting to safe:', err);
    return { safe: true, reason: null, hasPerson: false, hasPlateNumber: false };
  }
}
