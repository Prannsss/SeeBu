import { supabase as _supabase } from '../config/db'; // keep import to avoid tree-shake issues

export interface ModerationResult {
  safe: boolean;
  reason?: string | null;
  details?: {
    hasPerson: boolean;
    hasPlateNumber: boolean;
    hasSensitiveData: boolean;
  };
}

function parseDataUrl(value: string): { mimeType: string; base64Data: string } | null {
  const match = value.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) return null;
  return { mimeType: match[1], base64Data: match[2] };
}

// The EgoBlur sidecar handles one request at a time, so /detect and /blur calls share
// one queue; each timeout starts when that request is actually sent.
// Circuit breaker: after a network failure/timeout, skip the sidecar for EGO_COOLDOWN_MS so a
// down or sleeping sidecar can't stall every photo of every submission by its full timeout.
const EGO_COOLDOWN_MS = 5 * 60_000;
let egoDownUntil = 0;
let egoQueue: Promise<unknown> = Promise.resolve();
export function serializeEgoBlur<T>(fn: () => Promise<T>): Promise<T> {
  const guarded = () => {
    if (Date.now() < egoDownUntil) return Promise.reject(new Error('EgoBlur sidecar cooling down'));
    return fn().catch((err) => {
      egoDownUntil = Date.now() + EGO_COOLDOWN_MS;
      throw err;
    });
  };
  const run = egoQueue.then(guarded, guarded);
  egoQueue = run.catch(() => {});
  return run;
}

/**
 * Checks image against EgoBlur sidecar detection if the service is configured and reachable.
 * Returns null when unavailable so callers can fall through gracefully.
 */
async function checkEgoBlur(buffer: Buffer, mimeType: string): Promise<ModerationResult | null> {
  const serviceUrl = process.env.EGOBLUR_SERVICE_URL;
  if (!serviceUrl) return null;

  try {
    const response = await serializeEgoBlur(() => fetch(`${serviceUrl}/detect`, {
      method: 'POST',
      headers: { 'Content-Type': mimeType },
      body: new Uint8Array(buffer),
      signal: AbortSignal.timeout(5000),
    }));

    if (!response.ok) return null;

    const data = await response.json();
    const hasPerson = Boolean(data.has_person);
    const hasPlateNumber = Boolean(data.has_license_plate);
    const isSafe = !hasPerson && !hasPlateNumber;

    return {
      safe: isSafe,
      reason: isSafe ? null : 'Image might contain sensitive data/information please retake the image',
      details: { hasPerson, hasPlateNumber, hasSensitiveData: false },
    };
  } catch {
    // EgoBlur offline — not fatal
    return null;
  }
}

/**
 * Moderates an image (data URL). Uses EgoBlur sidecar when available.
 * Client-side face-api.js handles face detection; this is a secondary backend check.
 * Returns safe:true if no backend service is configured (client already checked).
 */
export async function moderateImage(imageInput: string): Promise<ModerationResult> {
  if (!imageInput || typeof imageInput !== 'string') {
    return { safe: true, reason: null };
  }

  const parsed = parseDataUrl(imageInput);
  if (parsed) {
    const buffer = Buffer.from(parsed.base64Data, 'base64');
    const egoResult = await checkEgoBlur(buffer, parsed.mimeType);
    if (egoResult !== null) return egoResult;
  }

  // No backend service is active — client-side face-api.js handles detection.
  return {
    safe: true,
    reason: null,
    details: { hasPerson: false, hasPlateNumber: false, hasSensitiveData: false },
  };
}
