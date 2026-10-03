/**
 * Regenerates the README screenshots in docs/ from a running build.
 *   npx vite preview --port 4180 &  node tests/screenshots.mjs [baseUrl]
 */
import { chromium } from 'playwright';

const base = (process.argv[2] ?? 'http://localhost:4180').replace(/\/$/, '');
const browser = await chromium.launch();

async function fillStudio(page, wide) {
  await page.getByLabel('Website URL').fill('gdg.community.dev/gdg-on-campus-srm');
  await page.waitForTimeout(1200);
  await page.getByRole('radiogroup', { name: 'QR code type' }).getByRole('radio', { name: 'Wi-Fi', exact: true }).click();
  await page.getByLabel('Network name (SSID)').fill('GDG-Campus');
  await page.getByLabel('Password').fill('build;with;gdg');
  await page.waitForTimeout(1300);
  if (wide) await page.getByRole('button', { name: /^Campus\b/ }).click();
  await page.waitForTimeout(400);
}

const shots = [
  { file: 'landing.png', route: '/', viewport: { width: 1440, height: 900 }, theme: 'light' },
  { file: 'landing-full.png', route: '/', viewport: { width: 1440, height: 900 }, theme: 'light', full: true },
  { file: 'desktop-light.png', route: '/studio', viewport: { width: 1440, height: 900 }, theme: 'light', studio: true },
  { file: 'desktop-dark.png', route: '/studio', viewport: { width: 1440, height: 900 }, theme: 'dark', studio: true },
  { file: 'tablet.png', route: '/studio', viewport: { width: 834, height: 1112 }, theme: 'light', studio: true },
  { file: 'mobile.png', route: '/studio', viewport: { width: 390, height: 844 }, theme: 'light', studio: true },
  { file: 'landing-mobile.png', route: '/', viewport: { width: 390, height: 844 }, theme: 'dark' },
];

for (const s of shots) {
  const context = await browser.newContext({ viewport: s.viewport, deviceScaleFactor: 2, reducedMotion: 'reduce' });
  await context.addInitScript((t) => localStorage.setItem('qr-studio:theme:v1', t), s.theme);
  const page = await context.newPage();
  await page.goto(base + s.route, { waitUntil: 'networkidle' });
  if (s.studio) await fillStudio(page, s.viewport.width >= 768);
  if (s.full) {
    const height = await page.evaluate(() => document.body.scrollHeight);
    for (let y = 0; y < height; y += 600) {
      await page.evaluate((yy) => window.scrollTo(0, yy), y);
      await page.waitForTimeout(60);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
  }
  await page.screenshot({ path: `docs/${s.file}`, fullPage: Boolean(s.full) });
  await context.close();
  console.log('wrote docs/' + s.file);
}
await browser.close();
