import { test, expect } from '@playwright/test';

const PUBLIC_PAGES = ['/', '/auth/login', '/auth/register', '/report', '/track', '/about', '/services', '/faq', '/privacy', '/terms'];

test.describe('public pages', () => {
  for (const path of PUBLIC_PAGES) {
    test(`${path} loads without errors`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (e) => { errors.push(e.message); console.log(`[pageerror ${path}]`, e.message.slice(0, 300)); });
      const res = await page.goto(path, { waitUntil: 'domcontentloaded' });
      expect(res?.status()).toBeLessThan(400);
      await expect(page.locator('main, body').first()).toBeVisible();
      await page.waitForLoadState('networkidle').catch(() => {});
      expect(errors).toEqual([]);
    });
  }
});

test('security headers are sent', async ({ request, baseURL }) => {
  const res = await request.get('/');
  const h = res.headers();
  expect(h['content-security-policy']).toContain("frame-ancestors 'none'");
  expect(h['x-frame-options']).toBe('DENY');
  expect(h['x-content-type-options']).toBe('nosniff');
  expect(h['referrer-policy']).toBe('strict-origin-when-cross-origin');
  // HSTS is added by the host (Vercel) and only over HTTPS.
  if (baseURL?.startsWith('https://')) expect(h['strict-transport-security']).toBeTruthy();
});

test('illustrations load a light still first and the animation only after the page has loaded', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  const t = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const res = performance.getEntriesByType('resource').map((e) => [new URL(e.name).pathname, e.startTime] as const);
    const at = (path: string) => res.find(([p]) => p === path)?.[1];
    return { load: nav.loadEventStart, still: at('/gifs/build-poster.webp'), animation: at('/gifs/build.webp') };
  });
  expect(t.still, 'the still image is requested').toBeDefined();
  // The 3.7 MB animation must never compete with the first paint.
  if (t.animation !== undefined) expect(t.animation).toBeGreaterThanOrEqual(t.load);
});

for (const path of ['/auth/login', '/auth/register']) {
  test(`Google button is clickable across its whole width on ${path}`, async ({ page }) => {
    await page.goto(path, { waitUntil: 'networkidle' });
    const button = page.locator('button', { hasText: 'Continue with Google' });
    // Google draws its button either in an iframe or straight into the page; wait for either.
    const layer = button.locator('xpath=following-sibling::div[1]');
    await expect(layer.locator('iframe[src*="accounts.google.com"], [role=button]').first()).toBeAttached({ timeout: 20_000 });
    await button.scrollIntoViewIfNeeded();
    const box = (await button.boundingBox())!;
    // Google's button is rendered at a fixed pixel width, then scaled to exactly cover ours (the old
    // bug: it stayed ~184px wide, so only the logo end opened the sign-in popup).
    const google = (await layer.locator('[style*="scale("]').boundingBox())!;
    expect(Math.abs(google.x - box.x)).toBeLessThan(2);
    expect(Math.abs(google.x + google.width - (box.x + box.width))).toBeLessThan(2);
    expect(Math.abs(google.height - box.height)).toBeLessThan(2);
    for (const fx of [0.05, 0.5, 0.95]) {
      const insideGoogleLayer = await layer.evaluate((el, [x, y]) => {
        const hit = document.elementFromPoint(x, y);
        return !!hit && el.contains(hit);
      }, [box.x + box.width * fx, box.y + box.height / 2]);
      expect(insideGoogleLayer, `click at ${fx * 100}% of the button reaches Google's button`).toBe(true);
    }
  });
}

// Optional: set E2E_PASSWORD (and the role emails if they differ) to also check each role can sign in.
const PASSWORD = process.env.E2E_PASSWORD;
const ROLES: [string, string, RegExp][] = [
  ['citizen', process.env.E2E_CLIENT_EMAIL || 'client@seebu.com', /\/client/],
  ['admin', process.env.E2E_ADMIN_EMAIL || 'admin@seebu.com', /\/admin/],
  ['workforce admin', process.env.E2E_WFADMIN_EMAIL || 'wfadmin@seebu.com', /\/workforce-admin/],
  ['workforce officer', process.env.E2E_WORKFORCE_EMAIL || 'workforce@seebu.com', /\/workforce(?!-admin)/],
  ['super admin', process.env.E2E_SUPERADMIN_EMAIL || 'spadmin@seebu.com', /\/superadmin/],
];
test.describe('sign in', () => {
  test.skip(!PASSWORD, 'set E2E_PASSWORD to run sign-in checks');
  for (const [role, email, home] of ROLES) {
    test(`${role} can sign in and reach their dashboard`, async ({ page }) => {
      await page.goto('/auth/login', { waitUntil: 'networkidle' });
      await page.fill('#email', email);
      await page.fill('#password', PASSWORD!);
      await page.click('button[type=submit]');
      await expect(page).toHaveURL(home, { timeout: 30_000 });
    });
  }
});
