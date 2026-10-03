import { chromium } from 'playwright';
const OUT = process.env.OUT ?? 'docs';
const url = process.argv[2] ?? 'http://localhost:5178/';
const b = await chromium.launch();
const errors = [];
for (const [name, vp, theme] of [['lp-desktop', { width: 1440, height: 900 }, 'light'], ['lp-mobile', { width: 390, height: 844 }, 'light'], ['lp-desktop-dark', { width: 1440, height: 900 }, 'dark']]) {
  const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  await ctx.addInitScript((t) => localStorage.setItem('qr-studio:theme:v1', t), theme);
  const p = await ctx.newPage();
  p.on('console', (m) => m.type() === 'error' && errors.push(name + ': ' + m.text()));
  p.on('pageerror', (e) => errors.push(name + ' pageerror: ' + e.message));
  await p.goto(url, { waitUntil: 'networkidle' });
  // scroll through so lazy sections + in-view reveals settle
  const h = await p.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < h; y += 500) { await p.evaluate((yy) => window.scrollTo(0, yy), y); await p.waitForTimeout(80); }
  await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(600);
  await p.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
  const overflow = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  console.log(name, 'height', await p.evaluate(() => document.body.scrollHeight), 'overflow', overflow);
  await ctx.close();
}
console.log('errors:', errors.length ? errors : 'none');
await b.close();
