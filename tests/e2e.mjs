/**
 * End-to-end checks for QR Studio, run in a real Chromium via Playwright.
 *
 *   npm run test:e2e              build, serve dist/ with `vite preview`, test it
 *   E2E_URL=https://… node tests/e2e.mjs   test an already running site instead
 *
 * "It scans" is proven, not assumed: rendered canvases and downloaded files are
 * decoded with jsQR and compared with the expected payload strings.
 */
import { chromium } from 'playwright';
import jsQR from 'jsqr';
import { preview } from 'vite';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { writePng, writeTestPhoto, writeOversizePhoto } from './fixtures.mjs';

// ---------------------------------------------------------------- harness --
const results = [];
const consoleErrors = [];
let failures = 0;

function check(name, pass, detail = '') {
  results.push(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
  if (!pass) failures += 1;
}

async function section(name, fn) {
  try {
    await fn();
  } catch (error) {
    check(`${name} (threw)`, false, String(error).split('\n')[0].slice(0, 160));
  }
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'qr-e2e-'));
const BS = String.fromCharCode(92);
const WIFI = `WIFI:T:WPA;S:GDG-Campus;P:build${BS};with${BS};gdg;;`;

/** A tiny solid red PNG, used as an uploaded logo. */
function writeLogo(file) {
  const size = 48;
  const raw = Buffer.alloc((size * 3 + 1) * size);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) raw.set([234, 67, 53], y * (size * 3 + 1) + 1 + x * 3);
  }
  const chunk = (type, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(zlib.crc32(body) >>> 0);
    return Buffer.concat([len, body, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  fs.writeFileSync(file, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]));
}

let server;
let base = process.env.E2E_URL?.replace(/\/$/, '');
if (!base) {
  server = await preview({ preview: { port: 4179, strictPort: false, open: false }, logLevel: 'silent' });
  base = server.resolvedUrls.local[0].replace(/\/$/, '');
}

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 950 }, deviceScaleFactor: 1, acceptDownloads: true, reducedMotion: 'reduce' });
const page = await context.newPage();
page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));
page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message}`));

/** Decodes the studio's live preview canvas. */
async function decodeCanvas() {
  const data = await page.evaluate(() => {
    const canvas = document.querySelector('.stage__canvas');
    if (!canvas || canvas.hidden) return null;
    const img = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
    return { w: canvas.width, h: canvas.height, d: Array.from(img.data) };
  });
  if (!data) return null;
  return { text: jsQR(Uint8ClampedArray.from(data.d), data.w, data.h)?.data ?? null, size: data.w };
}

/** Decodes a PNG buffer (a screenshot or a downloaded file) inside the page. */
async function decodePng(buffer) {
  const data = await page.evaluate(async (b64) => {
    const img = new Image();
    img.src = `data:image/png;base64,${b64}`;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = img.width;
    c.height = img.height;
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0);
    return { w: c.width, h: c.height, d: Array.from(ctx.getImageData(0, 0, c.width, c.height).data) };
  }, buffer.toString('base64'));
  return jsQR(Uint8ClampedArray.from(data.d), data.w, data.h)?.data ?? null;
}

const decodeElement = async (selector) => decodePng(await page.locator(selector).first().screenshot());
const typeRadio = (name) => page.getByRole('radiogroup', { name: 'QR code type' }).getByRole('radio', { name, exact: true });
const eccRadio = (level) => page.getByRole('radiogroup', { name: 'Error correction' }).getByRole('radio', { name: new RegExp(`^${level}`) });
const settle = (ms = 350) => page.waitForTimeout(ms);

async function download(buttonName) {
  const wait = page.waitForEvent('download', { timeout: 10000 });
  await page.getByRole('button', { name: buttonName }).click();
  return wait;
}

// ---------------------------------------------------------------- landing --
await section('landing', async () => {
  await page.goto(`${base}/`, { waitUntil: 'networkidle' });
  check('landing has exactly one h1', (await page.locator('h1').count()) === 1, await page.locator('h1').innerText());
  check('skip link targets main', (await page.locator('a.skip-link').getAttribute('href')) === '#main' && (await page.locator('#main').count()) === 1);
  check('hero code decodes (real engine)', (await decodeElement('.lp-stage .morph-code')) === 'https://gdg.community.dev');
  check('GDG on Campus SRM attribution visible', await page.getByText('Built for GDG on Campus SRM').first().isVisible());

  await page.locator('#types').scrollIntoViewIfNeeded();
  await settle(800);
  await page.getByRole('tab', { name: 'Wi-Fi' }).click();
  await settle(900);
  check('types showcase shows the escaped Wi-Fi payload', (await page.locator('.lp-types__payload').innerText()).trim() === WIFI);
  check('types showcase code decodes to that payload', (await decodeElement('.lp-types__code .morph-code')) === WIFI);
  await page.getByRole('tab', { name: 'Wi-Fi' }).press('ArrowRight');
  check('types tabs support arrow keys', (await page.getByRole('tab', { name: 'URL' }).getAttribute('aria-selected')) === 'true');

  await page.locator('#scan-check').scrollIntoViewIfNeeded();
  await page.getByLabel('Fade the ink').fill('85');
  await settle(200);
  check('scan demo warns with the real advisor', (await page.locator('.lp-advice__item.is-warning').count()) > 0);
  await page.getByLabel('Fade the ink').fill('0');
  await settle(200);
  check('scan demo clears when contrast returns', (await page.locator('.lp-advice__item.is-ok').count()) === 1);

  const faq = page.getByRole('button', { name: 'Why does my code show a warning?' });
  await faq.click();
  check('FAQ accordion expands', (await faq.getAttribute('aria-expanded')) === 'true');

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.getByRole('link', { name: /Create a QR code/ }).click();
  await page.getByLabel('Website URL').waitFor();
  check('hero CTA routes to /studio', new URL(page.url()).pathname === '/studio');
});

// ----------------------------------------------------------------- types --
await section('types', async () => {
  await page.goto(`${base}/studio`, { waitUntil: 'networkidle' });
  check('studio has exactly one h1', (await page.locator('h1').count()) === 1);
  check('no error shown before anything is typed', (await page.locator('.field__message.is-error').count()) === 0);

  await page.getByLabel('Website URL').fill('gdg.community.dev/gdg-on-campus-srm');
  await settle();
  let r = await decodeCanvas();
  check('URL encodes and scans', r?.text === 'https://gdg.community.dev/gdg-on-campus-srm', r?.text ?? 'no decode');

  await typeRadio('Text').click();
  await page.getByLabel('Text', { exact: true }).fill('GDG on Campus SRM — Recruitment 2026');
  await settle();
  r = await decodeCanvas();
  check('Text encodes and scans', r?.text === 'GDG on Campus SRM — Recruitment 2026', r?.text ?? 'no decode');

  await typeRadio('Email').click();
  await page.getByLabel('Recipient').fill('team@gdgsrm.dev');
  await page.getByLabel('Subject').fill('Hello there');
  await page.getByLabel('Message').fill('Line one');
  await settle();
  r = await decodeCanvas();
  check('Email encodes and scans', r?.text === 'mailto:team@gdgsrm.dev?subject=Hello%20there&body=Line%20one', r?.text ?? 'no decode');

  await typeRadio('Phone').click();
  await page.getByLabel('Phone number').fill('+91 98765 43210');
  await settle();
  r = await decodeCanvas();
  check('Phone encodes and scans', r?.text === 'tel:+919876543210', r?.text ?? 'no decode');

  await typeRadio('Wi-Fi').click();
  await page.getByLabel('Network name (SSID)').fill('GDG-Campus');
  await page.getByLabel('Password').fill('build;with;gdg');
  await settle();
  r = await decodeCanvas();
  check('Wi-Fi encodes, escapes and scans', r?.text === WIFI, r?.text ?? 'no decode');
  const shown = await page.locator('.stage__payload code').innerText();
  check('Wi-Fi password is masked on screen', !shown.includes('build') && shown.includes('•'), shown);
  await page.getByRole('button', { name: 'Show password' }).click();
  check('Wi-Fi password can be revealed', (await page.locator('.stage__payload code').innerText()).includes(`build${BS};with`));
  check('canvas label never contains the payload', !(await page.locator('.stage__canvas').getAttribute('aria-label')).includes('build'));

  await page.getByText('Hidden network').click();
  await settle();
  r = await decodeCanvas();
  check('Wi-Fi hidden flag', r?.text === WIFI.replace(';;', ';H:true;;'), r?.text ?? 'no decode');
  await page.getByLabel('Security').selectOption('nopass');
  await settle();
  r = await decodeCanvas();
  check('Wi-Fi open network drops the password', r?.text === 'WIFI:T:nopass;S:GDG-Campus;H:true;;', r?.text ?? 'no decode');

  await typeRadio('Wi-Fi').press('ArrowLeft');
  check('type picker supports arrow keys', (await typeRadio('Phone').getAttribute('aria-checked')) === 'true');
});

// ------------------------------------------------------------ validation --
await section('validation', async () => {
  await typeRadio('URL').click();
  await page.getByLabel('Website URL').fill('');
  await settle(250);
  check('empty URL shows an error', (await page.locator('.field__message.is-error').count()) === 1);
  check('download disabled while invalid', await page.getByRole('button', { name: 'Download PNG' }).isDisabled());
  check('preview hidden while invalid', !(await page.locator('.stage__canvas').isVisible()));
  check('empty state explains what is missing', (await page.locator('.stage__empty-body').innerText()).length > 10);

  await page.getByLabel('Website URL').fill('not a url');
  await settle(250);
  check('URL with spaces rejected', (await page.locator('.field__message.is-error').innerText()).includes('cannot contain spaces'));

  await typeRadio('Email').click();
  await page.getByLabel('Recipient').fill('nope@@x');
  await settle(250);
  check('invalid email rejected', (await page.locator('.field__message.is-error').first().innerText()).includes('valid email'));

  await typeRadio('Phone').click();
  await page.getByLabel('Phone number').fill('123');
  await settle(250);
  check('short phone rejected', (await page.locator('.field__message.is-error').first().innerText()).includes('6–15 digits'));

  await typeRadio('Wi-Fi').click();
  await page.getByLabel('Security').selectOption('WPA');
  await page.getByLabel('Password').fill('short');
  await settle(250);
  check('short WPA password rejected', (await page.locator('.field__message.is-error').first().innerText()).includes('at least 8'));
});

// --------------------------------------------------------- customisation --
await section('customisation', async () => {
  await typeRadio('URL').click();
  await page.getByLabel('Website URL').fill('https://gdgsrm.dev/apply');
  await settle();
  await page.getByLabel('Size', { exact: true }).fill('512');
  await page.getByLabel('Quiet zone').fill('6');
  await eccRadio('H').click();
  await page.getByLabel('Foreground hex value').fill('#14532d');
  await page.getByLabel('Background hex value').fill('#ecfdf5');
  await settle(450);
  const r = await decodeCanvas();
  check('custom size applied to the canvas', r?.size === 512, `size=${r?.size}`);
  check('customised code still scans', r?.text === 'https://gdgsrm.dev/apply', r?.text ?? 'no decode');

  const palette = await page.evaluate(() => {
    const c = document.querySelector('.stage__canvas');
    const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    const seen = new Set();
    for (let i = 0; i < d.length; i += 4) seen.add(`${d[i]},${d[i + 1]},${d[i + 2]}`);
    return [...seen];
  });
  check('canvas paints exactly the two chosen colours', palette.length === 2 && palette.includes('20,83,45') && palette.includes('236,253,245'), palette.join(' / '));
  check('error correction H selected', (await eccRadio('H').getAttribute('aria-checked')) === 'true');
  await eccRadio('H').press('ArrowLeft');
  check('error correction supports arrow keys', (await eccRadio('Q').getAttribute('aria-checked')) === 'true');
  await eccRadio('Q').press('ArrowRight');

  await page.getByLabel('Foreground hex value').fill('#cccccc');
  await settle(400);
  check('low contrast raises a warning', (await page.locator('.advice[data-level="warning"]').count()) > 0);
  check('contrast reading flags the risk', (await page.locator('.reading').first().getAttribute('data-status')) === 'bad');
  check('stage verdict pill summarises the risk', (await page.locator('.stage__verdict').getAttribute('data-status')) === 'bad' && (await page.locator('.stage__verdict').innerText()).includes('won’t scan'));
  check('contrast readout next to the pickers', (await page.locator('.contrast-readout').getAttribute('data-status')) === 'bad');
  check('download stays enabled despite the warning', await page.getByRole('button', { name: 'Download PNG' }).isEnabled());

  await page.getByRole('button', { name: 'Midnight' }).click();
  await settle(400);
  check('preset updates colours', (await page.getByLabel('Foreground hex value').inputValue()) === '#f8fafc');
  check('preset keeps the custom size', (await page.getByLabel('Size', { exact: true }).inputValue()) === '512');
  await page.getByLabel('Background hex value').fill('#0a0a0a');
  await settle(400);
  check('still editable after a preset', (await page.getByLabel('Background hex value').inputValue()) === '#0a0a0a');
  check('preset + tweak still scans', (await decodeCanvas())?.text === 'https://gdgsrm.dev/apply');

  await page.getByRole('button', { name: 'Reset' }).click();
  await settle(300);
  check('reset design restores defaults', (await page.getByLabel('Size', { exact: true }).inputValue()) === '320');
  await page.locator('body').click({ position: { x: 5, y: 300 } });
  await page.keyboard.press('Control+z');
  await settle(300);
  check('reset can be undone with Ctrl+Z', (await page.getByLabel('Size', { exact: true }).inputValue()) === '512');
});

// ------------------------------------------------------------- downloads --
await section('downloads', async () => {
  await page.getByRole('button', { name: 'Classic' }).click();
  await settle(400);
  const png = await download('Download PNG');
  const pngPath = path.join(tmp, 'qr.png');
  await png.saveAs(pngPath);
  const bytes = fs.readFileSync(pngPath);
  check('PNG filename is descriptive', /^qr-url-.*\.png$/.test(png.suggestedFilename()), png.suggestedFilename());
  check('PNG has a valid signature', bytes.subarray(1, 4).toString() === 'PNG');
  check('PNG matches the preview size', bytes.readUInt32BE(16) === 512 && bytes.readUInt32BE(20) === 512);
  check('downloaded PNG decodes', (await decodePng(bytes)) === 'https://gdgsrm.dev/apply');

  const svg = await download('Download SVG');
  const svgText = fs.readFileSync(await svg.path(), 'utf8');
  check('SVG downloaded at the preview size', svgText.startsWith('<svg') && svgText.includes('width="512"'));
  check('SVG uses the preview colours', svgText.includes('#111827') && svgText.includes('#ffffff'));

  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: base });
  await page.getByRole('button', { name: 'Copy image' }).click();
  await settle(500);
  const clip = await page.evaluate(async () => {
    const items = await navigator.clipboard.read();
    const item = items.find((i) => i.types.includes('image/png'));
    if (!item) return null;
    const blob = await item.getType('image/png');
    const bmp = await createImageBitmap(blob);
    return [bmp.width, bmp.height];
  });
  check('Copy image puts the PNG on the clipboard', clip?.[0] === 512 && clip?.[1] === 512, JSON.stringify(clip));

  const viaKeyboard = page.waitForEvent('download', { timeout: 10000 });
  await page.keyboard.press('Control+Enter');
  check('Ctrl+Enter downloads the PNG', /\.png$/.test((await viaKeyboard).suggestedFilename()));
});

// ------------------------------------------------------------------ logo --
await section('logo', async () => {
  const logo = path.join(tmp, 'logo.png');
  writeLogo(logo);
  await eccRadio('H').click();
  await page.setInputFiles('input[type=file]', logo);
  await settle(700);
  const centre = await page.evaluate(() => {
    const c = document.querySelector('.stage__canvas');
    return [...c.getContext('2d').getImageData(c.width / 2, c.height / 2, 1, 1).data].slice(0, 3).join(',');
  });
  check('logo is drawn in the centre', centre === '234,67,53', centre);
  check('code with a logo still scans at ECC H', (await decodeCanvas())?.text === 'https://gdgsrm.dev/apply');
  const svg = await download('Download SVG');
  check('SVG embeds the logo', fs.readFileSync(await svg.path(), 'utf8').includes('<image'));
  await page.getByRole('button', { name: 'Remove logo' }).click();
  await settle(300);
  check('logo can be removed', (await page.locator('.logo-drop__current').count()) === 0);
});

// ------------------------------------------------------- oversized payload --
await section('oversized', async () => {
  await typeRadio('Text').click();
  await page.getByLabel('Text', { exact: true }).fill('x'.repeat(2000));
  await settle(600);
  check('oversized payload is explained', /too long/i.test(await page.locator('.stage__empty-body').innerText()));
  check('download blocked for an unencodable payload', await page.getByRole('button', { name: 'Download PNG' }).isDisabled());
  await page.getByLabel('Text', { exact: true }).fill('back to normal');
  await settle(600);
  check('recovers after shortening the payload', (await decodeCanvas())?.text === 'back to normal');
});

// --------------------------------------------------------------- history --
await section('history', async () => {
  await settle(1300);
  const count = await page.locator('.recent__card').count();
  check('recent codes are captured', count >= 5, `entries=${count}`);
  await page.reload({ waitUntil: 'networkidle' });
  const after = await page.locator('.recent__card').count();
  check('recent codes survive a reload', after === count, `${after} vs ${count}`);

  await page.locator('.recent__card[data-type="wifi"]').first().click();
  await settle(500);
  check('restore switches the type', (await typeRadio('Wi-Fi').getAttribute('aria-checked')) === 'true');
  check('restore brings back the data', (await page.getByLabel('Network name (SSID)').inputValue()) === 'GDG-Campus');
  check('restored code scans', (await decodeCanvas())?.text?.startsWith('WIFI:') === true);

  await page.locator('.recent__card[data-type="url"]').first().click();
  await settle(500);
  check('restore brings back the design', (await page.getByLabel('Size', { exact: true }).inputValue()) === '512');

  const before = await page.locator('.recent__card').count();
  await page.locator('.recent__remove').first().click({ force: true });
  await settle(500);
  check('an entry can be removed', (await page.locator('.recent__card').count()) === before - 1);
  await page.getByRole('button', { name: 'Undo' }).click();
  await settle(500);
  check('removal can be undone', (await page.locator('.recent__card').count()) === before);

  await page.getByRole('button', { name: 'Clear all' }).click();
  await settle(500);
  check('clear all empties the list', (await page.locator('.recent__card').count()) === 0);
  await page.getByRole('button', { name: 'Undo' }).click();
  await settle(500);
  check('clear all can be undone', (await page.locator('.recent__card').count()) === before);
});

// ---------------------------------------------------------- photo style --
await section('photo style', async () => {
  const PHOTO_URL = 'https://gdgsrm.dev/photo';
  const photo = writeTestPhoto(path.join(tmp, 'photo.png'));
  const dark = writePng(path.join(tmp, 'dark.png'), 640, 480, (x, y) => [18 + ((x + y) % 14), 20, 34 + (y % 10)]);
  const oversize = writeOversizePhoto(path.join(tmp, 'big.png'));

  const choosePhoto = async (buttonName, files) => {
    const chooser = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: buttonName }).click();
    await (await chooser).setFiles(files);
  };
  const decodeStatus = async () => {
    for (let i = 0; i < 50; i += 1) {
      const status = await page.locator('.decode').getAttribute('data-status').catch(() => null);
      if (status === 'pass' || status === 'fail') return status;
      await settle(150);
    }
    return 'timeout';
  };
  const canvasUrl = () => page.evaluate(() => document.querySelector('.stage__canvas').toDataURL('image/png'));

  await page.goto(`${base}/studio`, { waitUntil: 'networkidle' });
  await page.getByLabel('Website URL').fill(PHOTO_URL);
  await settle(500);
  const original = await canvasUrl();
  const originalEcc = await page.getByRole('radiogroup', { name: 'Error correction' }).locator('[aria-checked="true"]').innerText();

  // Validation: wrong type and oversize files are refused with a clear message.
  await choosePhoto(/Add a photo style/, { name: 'anim.gif', mimeType: 'image/gif', buffer: Buffer.from('GIF89a') });
  await settle(300);
  check('photo: wrong file type is refused', (await page.locator('.photo-style .field__message.is-error').innerText()).includes('PNG, JPG or WebP'));
  await choosePhoto(/Add a photo style/, oversize);
  await settle(500);
  check('photo: oversize file is refused', (await page.locator('.photo-style .field__message.is-error').innerText()).includes('under 2 MB'));

  // Tinted modules.
  await choosePhoto(/Add a photo style/, photo);
  check('photo: tinted modules pass the in-app test scan', (await decodeStatus()) === 'pass');
  check('photo: tinted modules decode to the original payload', (await decodeCanvas())?.text === PHOTO_URL);
  check('photo: error correction raised to at least Q', /^Q/.test(await eccRadio('Q').innerText()) && (await eccRadio('Q').getAttribute('aria-checked')) === 'true' && (await eccRadio('M').isDisabled()));
  check('photo: the canvas really changed', (await canvasUrl()) !== original);

  // PNG download is the preview canvas, pixel for pixel.
  const png = await download('Download PNG');
  const pngBytes = fs.readFileSync(await png.path());
  const same = await page.evaluate(async (b64) => {
    const img = new Image();
    img.src = `data:image/png;base64,${b64}`;
    await img.decode();
    const c = document.querySelector('.stage__canvas');
    const probe = document.createElement('canvas');
    probe.width = img.width;
    probe.height = img.height;
    const ctx = probe.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const a = ctx.getImageData(0, 0, img.width, img.height).data;
    const b = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i += 1) if (a[i] !== b[i]) return false;
    return true;
  }, pngBytes.toString('base64'));
  check('photo: PNG download matches the preview pixel for pixel', same);
  check('photo: downloaded PNG decodes', (await decodePng(pngBytes)) === PHOTO_URL);

  const svg = fs.readFileSync(await (await download('Download SVG')).path(), 'utf8');
  check('photo: SVG embeds the processed photo as a data URI', svg.includes('<image') && svg.includes('href="data:image/jpeg;base64,'));
  check('photo: SVG keeps solid finder patterns as rects', (svg.match(/<rect /g) ?? []).length > 100);

  // Photo underlay.
  await page.getByRole('radio', { name: 'Photo underlay' }).click();
  check('photo: underlay passes the in-app test scan', (await decodeStatus()) === 'pass');
  check('photo: underlay decodes to the original payload', (await decodeCanvas())?.text === PHOTO_URL);

  // History stores a thumbnail and a flag, never the photo.
  await settle(1300);
  const stored = await page.evaluate(() => localStorage.getItem('qr-studio:history:v1') ?? '');
  check('photo: recent codes never store the photo', !stored.includes('image/jpeg') && stored.includes('"photoOmitted":true'));

  // Remove restores the exact original render (and the original ECC).
  await page.getByRole('button', { name: 'Remove', exact: true }).click();
  await settle(600);
  check('photo: removing the photo restores the exact original render', (await canvasUrl()) === original);
  check('photo: removing the photo restores the original error correction', (await page.getByRole('radiogroup', { name: 'Error correction' }).locator('[aria-checked="true"]').innerText()) === originalEcc);

  // Reload with a photo-based entry, then restore it without the photo.
  const errorsBefore = consoleErrors.length;
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('.recent__card[data-type="url"]').first().click();
  await settle(600);
  check('photo: reload with a photo-based entry does not crash', consoleErrors.length === errorsBefore && (await decodeCanvas())?.text === PHOTO_URL);
  check('photo: restoring it explains the photo was not saved', (await page.locator('.photo-style__note').innerText()).includes('restored without one'));

  // A dark photo at full strength fails; Boost readability fixes it.
  const LONG_URL = 'https://gdg.community.dev/gdg-on-campus-srm';
  await page.getByLabel('Website URL').fill(LONG_URL);
  await choosePhoto(/Add a photo style/, dark);
  await page.getByRole('radio', { name: 'Photo underlay' }).click();
  await page.getByLabel('Photo strength').fill('100');
  await page.getByLabel('Contrast', { exact: true }).fill('0');
  await settle(300);
  check('photo: a heavy dark underlay is reported as failing', (await decodeStatus()) === 'fail' && (await page.locator('.stage__verdict').getAttribute('data-status')) === 'bad');
  await page.getByRole('button', { name: 'Boost readability', exact: true }).click();
  await settle(2500);
  check('photo: Boost readability makes it decode', (await decodeStatus()) === 'pass' && (await decodeCanvas())?.text === LONG_URL);
});

// ----------------------------------------------------------------- theme --
await section('theme', async () => {
  const toggle = page.getByRole('button', { name: /Switch to .* theme/ });
  const was = await page.evaluate(() => document.documentElement.dataset.theme);
  await toggle.click();
  const now = await page.evaluate(() => document.documentElement.dataset.theme);
  check('theme toggles', now !== was && (now === 'dark' || now === 'light'), `${was} → ${now}`);
  await page.reload({ waitUntil: 'networkidle' });
  check('theme persists across reload', (await page.evaluate(() => document.documentElement.dataset.theme)) === now);
  await page.getByRole('button', { name: /Switch to .* theme/ }).click();
});

// ------------------------------------------------------------ responsive --
await section('responsive', async () => {
  for (const theme of ['light', 'dark']) {
    for (const width of [375, 834, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.evaluate((t) => localStorage.setItem('qr-studio:theme:v1', t), theme);
      for (const route of ['/', '/studio']) {
        await page.goto(`${base}${route}`, { waitUntil: 'networkidle' });
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        check(`no horizontal overflow ${route} @${width} ${theme}`, overflow <= 0, `${overflow}px`);
      }
    }
  }

  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(`${base}/studio`, { waitUntil: 'networkidle' });
  await page.getByLabel('Website URL').fill('gdg.community.dev');
  await settle();
  const exportBox = await page.locator('.studio-export').boundingBox();
  check('mobile export bar is in reach without scrolling', exportBox !== null && exportBox.y + exportBox.height <= 812 && exportBox.y > 600);
  const stageBox = await page.locator('.stage').boundingBox();
  check('mobile preview is visible on the first screen', stageBox !== null && stageBox.y < 120 && stageBox.height < 360);
  await page.getByRole('button', { name: 'Design', exact: true }).click();
  check('mobile panel tabs switch panels', (await page.getByRole('heading', { name: 'Design', exact: true }).isVisible()) && !(await page.getByLabel('Website URL').isVisible()));
});

check('no console errors', consoleErrors.length === 0, consoleErrors.slice(0, 3).join(' | '));

await browser.close();
if (server) await new Promise((resolve) => server.httpServer.close(resolve));
fs.rmSync(tmp, { recursive: true, force: true });

console.log(results.join('\n'));
console.log(`\n${results.length - failures}/${results.length} checks passed against ${base}`);
process.exit(failures ? 1 : 0);
