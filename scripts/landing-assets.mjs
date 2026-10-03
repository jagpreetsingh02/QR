/**
 * Renders the landing page's photo QR examples with the real studio engine and
 * saves them as WebP in public/showcase/. Photos are synthetic (tests/fixtures.mjs).
 *   npm run build && npx vite preview --port 4180 &  node scripts/landing-assets.mjs
 */
import { chromium } from 'playwright';
import jsQR from 'jsqr';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { writeBandsPhoto, writeFacePhoto, writeTestPhoto } from '../tests/fixtures.mjs';

const base = (process.argv[2] ?? 'http://localhost:4180').replace(/\/$/, '');
const tmp = os.tmpdir();
const examples = [
  { file: 'photo-dots-face.webp', photo: writeFacePhoto(path.join(tmp, 'qr-face.png')), blend: 'Dots' },
  { file: 'photo-dots-landscape.webp', photo: writeTestPhoto(path.join(tmp, 'qr-landscape.png')), blend: 'Dots' },
  { file: 'photo-tint-bands.webp', photo: writeBandsPhoto(path.join(tmp, 'qr-bands.png')), blend: 'Tinted' },
];
const TEXT = 'gdg.community.dev';

const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' })).newPage();
await page.goto(`${base}/studio`, { waitUntil: 'networkidle' });
await page.getByLabel('Website URL').fill(TEXT);
await page.getByLabel('Size', { exact: true }).fill('560');
await page.getByRole('tab', { name: /^Photo/ }).click();
for (const ex of examples) {
  if (await page.getByRole('button', { name: 'Remove', exact: true }).count()) await page.getByRole('button', { name: 'Remove', exact: true }).click();
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: /Add a photo/ }).click();
  await (await chooser).setFiles(ex.photo);
  await page.getByRole('radiogroup', { name: 'Blend' }).getByRole('radio', { name: ex.blend }).click();
  await page.waitForTimeout(1500);
  const { url, w, h, data } = await page.evaluate(async () => {
    const c = document.querySelector('.stage__canvas');
    const url = c.toDataURL('image/webp', 0.9);
    const img = new Image();
    img.src = url;
    await img.decode();
    const probe = document.createElement('canvas');
    probe.width = img.width;
    probe.height = img.height;
    const ctx = probe.getContext('2d');
    ctx.drawImage(img, 0, 0);
    return { url, w: img.width, h: img.height, data: Array.from(ctx.getImageData(0, 0, img.width, img.height).data) };
  });
  const decoded = jsQR(Uint8ClampedArray.from(data), w, h)?.data;
  fs.writeFileSync(path.join('public/showcase', ex.file), Buffer.from(url.split(',')[1], 'base64'));
  console.log(ex.file, `${w}px`, decoded === `https://${TEXT}` ? 'decodes' : `DOES NOT DECODE (${decoded})`);
}
await browser.close();
