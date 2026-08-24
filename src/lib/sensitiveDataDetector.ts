/**
 * Client-Side Sensitive Data Detector
 *
 * Detection pipeline:
 * 1. face-api.js (SSD MobileNet, runs fully in-browser) — detects faces/people.
 * 2. Canvas edge-density heuristic — detects vehicle license plates.
 * 3. Backend /scan-image endpoint — secondary check (EgoBlur or AI if configured).
 *
 * No API key or external service required for face detection.
 * Model weights (~2MB) are served from /models/face-api/ and cached by the browser.
 */

import * as faceapi from '@vladmandic/face-api';

export interface SensitiveDetectionResult {
  safe: boolean;
  reason: string | null;
  hasPerson: boolean;
  hasPlateNumber: boolean;
}

const SENSITIVE_REASON = 'Image contains sensitive information (e.g. identifiable people or license plates). Please retake or upload another image.';
const MODEL_URL = '/models/face-api';

// Load the model exactly once per page session.
let modelLoadPromise: Promise<void> | null = null;

async function ensureModelLoaded(): Promise<void> {
  if (modelLoadPromise) return modelLoadPromise;
  modelLoadPromise = faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL).catch((err) => {
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
 * Detects vehicle license plate patterns via canvas edge-density heuristics.
 * License plates have dense, evenly-spaced high-contrast transitions in a horizontal band.
 */
function detectPlatePatterns(canvas: HTMLCanvasElement): boolean {
  try {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return false;

    const { width, height } = canvas;
    if (width < 50 || height < 30) return false;

    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    let consecutiveSpikes = 0;
    const sampleStep = Math.max(1, Math.floor(height / 40));

    for (let y = 10; y < height - 10; y += sampleStep) {
      let edges = 0;
      let prevLum = 0;
      for (let x = 10; x < width - 10; x += 4) {
        const idx = (y * width + x) * 4;
        const lum = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
        if (x > 10 && Math.abs(lum - prevLum) > 65) edges++;
        prevLum = lum;
      }
      const ratio = edges / (width / 4);
      if (ratio > 0.35 && ratio < 0.85) {
        if (++consecutiveSpikes >= 3) return true;
      } else {
        consecutiveSpikes = 0;
      }
    }
  } catch {
    // Fallback silently
  }
  return false;
}

/**
 * Scans a single image (File, Blob, or base64 data URL) for faces and license plates.
 */
export async function scanImageForSensitiveData(
  imageSource: File | Blob | string
): Promise<SensitiveDetectionResult> {
  try {
    let imageElement: HTMLImageElement;
    let dataUrl: string | null = null;

    if (typeof imageSource === 'string') {
      dataUrl = imageSource;
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
      const detections = await faceapi.detectAllFaces(
        imageElement,
        new faceapi.SsdMobilenetv1Options({ minConfidence: 0.4 })
      );
      if (detections.length > 0) {
        return { safe: false, reason: SENSITIVE_REASON, hasPerson: true, hasPlateNumber: false };
      }
    } catch (faceErr) {
      // Model failed to load or inference error — continue to other checks.
      console.warn('[SensitiveDataDetector] face-api detection failed:', faceErr);
    }

    // ------------------------------------------------------------------
    // 2. Prepare downscaled canvas for heuristic + backend scan
    // ------------------------------------------------------------------
    const canvas = document.createElement('canvas');
    const maxDim = 640;
    const natW = imageElement.naturalWidth || imageElement.width;
    const natH = imageElement.naturalHeight || imageElement.height;
    const scale = Math.min(1, maxDim / Math.max(natW, natH, 1));
    canvas.width = Math.max(1, Math.round(natW * scale));
    canvas.height = Math.max(1, Math.round(natH * scale));

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(imageElement, 0, 0, canvas.width, canvas.height);
      if (!dataUrl) dataUrl = canvas.toDataURL('image/jpeg', 0.7);

      // ----------------------------------------------------------------
      // 2a. License plate heuristic
      // ----------------------------------------------------------------
      if (detectPlatePatterns(canvas)) {
        return { safe: false, reason: SENSITIVE_REASON, hasPerson: false, hasPlateNumber: true };
      }
    }

    // ------------------------------------------------------------------
    // 3. Backend scan-image (EgoBlur / AI — secondary, non-blocking)
    // ------------------------------------------------------------------
    if (dataUrl) {
      try {
        const { apiClient } = await import('@/lib/api');
        const result = await apiClient.reports.scanImage({ photo: dataUrl });
        if (result?.safe === false) {
          return {
            safe: false,
            reason: SENSITIVE_REASON,
            hasPerson: Boolean(result.details?.hasPerson),
            hasPlateNumber: Boolean(result.details?.hasPlateNumber),
          };
        }
      } catch {
        // Backend offline or rate-limited — not fatal, local checks already passed.
      }
    }

    return { safe: true, reason: null, hasPerson: false, hasPlateNumber: false };
  } catch (err) {
    console.warn('[SensitiveDataDetector] Inspection error, defaulting to safe:', err);
    return { safe: true, reason: null, hasPerson: false, hasPlateNumber: false };
  }
}
