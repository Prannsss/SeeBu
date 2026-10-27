const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

/**
 * Frontend hostnames a token may have been solved on: TURNSTILE_HOSTNAMES (comma-separated) when set,
 * otherwise the host of FRONTEND_URL. Read per call so it never runs before dotenv has loaded.
 * A production value must not include localhost / 127.0.0.1.
 */
function expectedHostnames(): Set<string> {
  const configured = (process.env.TURNSTILE_HOSTNAMES ?? '')
    .split(',')
    .map((hostname) => hostname.trim())
    .filter(Boolean);
  if (configured.length) return new Set(configured);
  try {
    return new Set(process.env.FRONTEND_URL ? [new URL(process.env.FRONTEND_URL).hostname] : []);
  } catch {
    return new Set();
  }
}

/**
 * Canonical Turnstile siteverify. True only when Cloudflare confirms the token, it was issued for
 * `expectedAction`, and it was solved on an approved hostname. Fails closed on any error.
 * `remoteip` is optional; pass it only when it is the visitor's real IP.
 */
export async function verifyTurnstile(token: unknown, expectedAction: string, remoteip?: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET;
  const hostnames = expectedHostnames();
  if (!secret || typeof token !== 'string' || token.length === 0 || token.length > 2048 || hostnames.size === 0) {
    return false;
  }

  let result: { success?: boolean; action?: string; hostname?: string; 'error-codes'?: string[] };
  try {
    const res = await fetch(SITEVERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      signal: AbortSignal.timeout(10_000),
      body: new URLSearchParams({ secret, response: token, ...(remoteip ? { remoteip } : {}) }),
    });
    if (!res.ok) throw new Error(`siteverify ${res.status}`);
    result = await res.json();
  } catch (err: any) {
    console.error('[turnstile] siteverify failed:', err?.message || err);
    return false;
  }

  const ok = result.success === true && result.action === expectedAction && !!result.hostname && hostnames.has(result.hostname);
  if (!ok) {
    console.warn('[turnstile] rejected:', {
      success: result.success,
      action: result.action,
      hostname: result.hostname,
      errors: result['error-codes'],
    });
  }
  return ok;
}
