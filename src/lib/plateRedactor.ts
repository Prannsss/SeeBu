/**
 * plateRedactor.ts
 *
 * Dedicated browser-side license plate detector and redactor.
 * Completely separate from face-api / sensitiveDataDetector — each module
 * has a single responsibility and they never call each other.
 *
 * Detection strategy (no ML model weights required):
 *  A multi-stage heuristic pipeline targeting the unique visual signature
 *  of Philippine license plates (white/yellow background, dark border, dense
 *  high-contrast characters in a wide-aspect-ratio rectangle):
 *
 *  Stage 1 – Edge-density scan: detects horizontal bands with the cadenced
 *            brightness transitions caused by plate characters.
 *  Stage 2 – Candidate region extraction: slides windows at multiple aspect
 *            ratios (2:1 → 4.5:1) and height fractions to locate the
 *            highest-edge-density sub-region.
 *  Stage 3 – Colour-homogeneity gate: the interior of a plate region should
 *            have a high-luminance background (white / yellow). Regions that
 *            fail this check are discarded to cut false positives.
 *  Stage 4 – Greedy non-maximum suppression to collapse overlapping hits.
 *
 * Redaction:
 *  Confirmed plate regions are blurred with a heavy Gaussian blur via
 *  `stackblur-canvas` (the industry-standard, zero-dependency canvas blur
 *  library). A semi-transparent overlay is drawn on top so users can see
 *  that redaction occurred. The function returns the redacted canvas as a
 *  Blob so it can replace the original File before upload.
 *
 * Usage:
 *  import { redactPlatesInFile } from '@/lib/plateRedactor';
 *
 *  const safeFile = await redactPlatesInFile(originalFile);
 *  // safeFile is the original when no plate is detected, or a new File with
 *  // plates blurred when one or more are found.
 */

export interface PlateRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  score: number;
}

export interface PlateRedactionResult {
  /** Image blob with plate regions blurred. null = no plates found. */
  redactedBlob: Blob | null;
  /** How many distinct plate regions were detected and blurred. */
  plateCount: number;
  /** Detected plate regions in canvas-space coordinates. */
  regions: PlateRegion[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Tuning constants
// ─────────────────────────────────────────────────────────────────────────────

/** Minimum confidence score (0–1) for a candidate to be treated as a plate. */
const CONFIDENCE_THRESHOLD = 0.45;

/** Brightness delta between adjacent pixels that counts as an edge. */
const EDGE_DELTA = 60;

/** Aspect ratios (w/h) probed for candidate windows. Philippine plates ≈ 2.5–3.3. */
const ASPECT_RATIOS = [2.0, 2.5, 3.0, 3.5, 4.5];

/** Candidate window heights as a fraction of image height. */
const HEIGHT_FRACS = [0.04, 0.06, 0.08, 0.11, 0.14];

/** Overlap-suppression threshold: IoU above this collapses two detections. */
const NMS_IOU_THRESHOLD = 0.35;

/** Gaussian blur radius applied to each confirmed plate region (pixels). */
const BLUR_RADIUS = 28;

/** Minimum mean luminance (0–255) for the plate interior background check. */
const MIN_PLATE_BG_LUMINANCE = 140;

/** Maximum working dimension for detection canvas (speed vs. accuracy). */
const MAX_WORKING_DIM = 1200;

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

function loadImageFromBlob(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('[plateRedactor] failed to load image')); };
    img.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, mimeType = 'image/jpeg', quality = 0.92): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('[plateRedactor] toBlob returned null'))),
      mimeType,
      quality
    );
  });
}

/**
 * Horizontal edge density of a single image row segment, returned as [0, 1].
 * Higher values = more high-contrast brightness transitions (like plate characters).
 */
function rowEdgeDensity(
  data: Uint8ClampedArray,
  imgWidth: number,
  y: number,
  xStart: number,
  xEnd: number,
  step: number
): number {
  let edges = 0;
  let prevLum = -1;
  const cols = Math.max(1, Math.floor((xEnd - xStart) / step));

  for (let x = xStart; x < xEnd; x += step) {
    const idx = (y * imgWidth + x) * 4;
    const lum = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
    if (prevLum >= 0 && Math.abs(lum - prevLum) > EDGE_DELTA) edges++;
    prevLum = lum;
  }

  return edges / cols;
}

/**
 * Mean luminance of the top and bottom margin strips of a candidate region.
 * Used as a proxy for the plate background colour (white/yellow plates are bright).
 */
function regionBackgroundLuminance(
  data: Uint8ClampedArray,
  imgWidth: number,
  x: number, y: number,
  w: number, h: number
): number {
  const marginRows = Math.max(1, Math.round(h * 0.15));
  let sumLum = 0;
  let count = 0;
  const step = Math.max(1, Math.floor(w / 16));

  for (let dy = 0; dy < marginRows; dy++) {
    for (let px = 0; px < w; px += step) {
      // Top margin
      const i1 = ((y + dy) * imgWidth + x + px) * 4;
      sumLum += 0.299 * data[i1] + 0.587 * data[i1 + 1] + 0.114 * data[i1 + 2];
      // Bottom margin
      const i2 = ((y + h - 1 - dy) * imgWidth + x + px) * 4;
      sumLum += 0.299 * data[i2] + 0.587 * data[i2 + 1] + 0.114 * data[i2 + 2];
      count += 2;
    }
  }

  return count > 0 ? sumLum / count : 0;
}

/**
 * Score a candidate bounding box by sampling row-level edge density across
 * its interior. Returns a normalised value in [0, 1].
 */
function scoreCandidateRegion(
  data: Uint8ClampedArray,
  imgWidth: number,
  x: number, y: number,
  w: number, h: number
): number {
  const rowStep = Math.max(1, Math.floor(h / 12));
  const colStep = Math.max(2, Math.floor(w / 80));
  let total = 0;
  let rows = 0;

  for (let dy = Math.floor(h * 0.1); dy < h * 0.9; dy += rowStep) {
    total += rowEdgeDensity(data, imgWidth, y + dy, x, x + w, colStep);
    rows++;
  }

  const avg = rows > 0 ? total / rows : 0;

  // Typical plate row density sits in [0.18, 0.55]; map to [0, 1] linearly.
  return Math.min(1, Math.max(0, (avg - 0.12) / 0.40));
}

/** Intersection-over-Union of two regions. */
function iou(a: PlateRegion, b: PlateRegion): number {
  const ix1 = Math.max(a.x, b.x);
  const iy1 = Math.max(a.y, b.y);
  const ix2 = Math.min(a.x + a.width, b.x + b.width);
  const iy2 = Math.min(a.y + a.height, b.y + b.height);
  if (ix2 <= ix1 || iy2 <= iy1) return 0;
  const inter = (ix2 - ix1) * (iy2 - iy1);
  const uni = a.width * a.height + b.width * b.height - inter;
  return uni > 0 ? inter / uni : 0;
}

/** Greedy non-maximum suppression: keeps the highest-scoring non-overlapping regions. */
function nms(regions: PlateRegion[], iouThreshold: number): PlateRegion[] {
  const sorted = [...regions].sort((a, b) => b.score - a.score);
  const kept: PlateRegion[] = [];
  for (const c of sorted) {
    if (kept.every((k) => iou(k, c) < iouThreshold)) kept.push(c);
  }
  return kept;
}

// ─────────────────────────────────────────────────────────────────────────────
// Core detector  (canvas-space)
// ─────────────────────────────────────────────────────────────────────────────

function detectPlateRegions(canvas: HTMLCanvasElement): PlateRegion[] {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return [];

  const { width, height } = canvas;
  if (width < 60 || height < 30) return [];

  const { data } = ctx.getImageData(0, 0, width, height);
  const candidates: PlateRegion[] = [];

  // Stage 1 – precompute per-row densities for cheap pre-filtering
  const scanStep = Math.max(1, Math.floor(height / 120));
  const rowDensities: number[] = new Array(height).fill(0);
  for (let y = 0; y < height; y += scanStep) {
    rowDensities[y] = rowEdgeDensity(
      data, width, y, 0, width,
      Math.max(2, Math.floor(width / 100))
    );
  }

  // Stage 2 – sliding-window candidate generation
  for (const hFrac of HEIGHT_FRACS) {
    const h = Math.round(height * hFrac);
    if (h < 12) continue;

    for (const aspect of ASPECT_RATIOS) {
      const w = Math.round(h * aspect);
      if (w > width) continue;

      const xStep = Math.max(1, Math.floor(w * 0.35));
      const yStep = Math.max(1, Math.floor(h * 0.40));

      for (let y = 0; y + h <= height; y += yStep) {
        // Fast pre-filter: skip y-bands with negligible row density
        let bandDensity = 0;
        let bandRows = 0;
        for (let dy = 0; dy < h; dy += scanStep) {
          const ry = y + dy;
          if (ry < height) { bandDensity += rowDensities[ry]; bandRows++; }
        }
        if (bandRows > 0 && bandDensity / bandRows < 0.08) continue;

        for (let x = 0; x + w <= width; x += xStep) {
          const score = scoreCandidateRegion(data, width, x, y, w, h);
          if (score < CONFIDENCE_THRESHOLD) continue;

          // Stage 3 – colour-homogeneity gate
          const bgLum = regionBackgroundLuminance(data, width, x, y, w, h);
          if (bgLum < MIN_PLATE_BG_LUMINANCE) continue;

          candidates.push({ x, y, width: w, height: h, score });
        }
      }
    }
  }

  // Stage 4 – non-maximum suppression
  return nms(candidates, NMS_IOU_THRESHOLD);
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Detect and blur license plate regions in a File / Blob / data-URL image.
 *
 * Returns `{ redactedBlob, plateCount, regions }`.
 * `redactedBlob` is `null` when no plate is found — caller uses the original.
 */
export async function detectAndRedactPlates(
  imageSource: File | Blob | string,
  outputMimeType = 'image/jpeg',
  outputQuality = 0.92
): Promise<PlateRedactionResult> {
  if (typeof window === 'undefined') {
    return { redactedBlob: null, plateCount: 0, regions: [] };
  }

  let imgEl: HTMLImageElement;

  if (typeof imageSource === 'string') {
    imgEl = new Image();
    await new Promise<void>((res, rej) => {
      imgEl.onload = () => res();
      imgEl.onerror = () => rej(new Error('[plateRedactor] failed to load data URL'));
      imgEl.src = imageSource as string;
    });
  } else {
    imgEl = await loadImageFromBlob(imageSource as Blob);
  }

  const natW = imgEl.naturalWidth || imgEl.width;
  const natH = imgEl.naturalHeight || imgEl.height;
  const scale = Math.min(1, MAX_WORKING_DIM / Math.max(natW, natH, 1));
  const cW = Math.max(1, Math.round(natW * scale));
  const cH = Math.max(1, Math.round(natH * scale));

  const canvas = document.createElement('canvas');
  canvas.width = cW;
  canvas.height = cH;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(imgEl, 0, 0, cW, cH);

  const regions = detectPlateRegions(canvas);

  if (regions.length === 0) {
    return { redactedBlob: null, plateCount: 0, regions: [] };
  }

  // ── Redaction ──────────────────────────────────────────────────────────────
  // Dynamically imported so the ~30 KB bundle is only fetched when needed.
  const StackBlur = await import('stackblur-canvas');

  for (const region of regions) {
    // Add a small padding so characters at the very edge are covered
    const rx = Math.max(0, region.x - 4);
    const ry = Math.max(0, region.y - 4);
    const rw = Math.min(cW - rx, region.width + 8);
    const rh = Math.min(cH - ry, region.height + 8);

    // 1. Apply Gaussian blur to the plate region via stackblur-canvas
    StackBlur.canvasRGBA(canvas, rx, ry, rw, rh, BLUR_RADIUS);

    // 2. Semi-transparent dark overlay for extra obscuring + visual feedback
    ctx.save();
    ctx.fillStyle = 'rgba(20, 20, 20, 0.55)';
    ctx.fillRect(rx, ry, rw, rh);

    // 3. Tiny label so reviewers know what was redacted
    const fontSize = Math.max(9, Math.round(rh * 0.35));
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.fillText('PLATE REDACTED', rx + rw / 2, ry + rh / 2, rw - 4);
    ctx.restore();
  }

  const redactedBlob = await canvasToBlob(canvas, outputMimeType, outputQuality);
  return { redactedBlob, plateCount: regions.length, regions };
}

/**
 * Convenience wrapper: given a File, returns a new File with plates blurred.
 * Returns the original File unchanged when no plate is detected.
 *
 * This is the function you should call from the report form before submitting.
 */
export async function redactPlatesInFile(file: File): Promise<File> {
  try {
    const { redactedBlob, plateCount } = await detectAndRedactPlates(file);
    if (!redactedBlob || plateCount === 0) return file;

    const outMime = redactedBlob.type || file.type || 'image/jpeg';
    const ext = outMime.includes('png') ? '.png' : '.jpg';
    const baseName = file.name.replace(/\.[^.]+$/, '');

    return new File([redactedBlob], `${baseName}-redacted${ext}`, { type: outMime });
  } catch (err) {
    // Never block submission on a detection failure — return the original.
    console.warn('[plateRedactor] Detection/redaction failed, using original image:', err);
    return file;
  }
}
