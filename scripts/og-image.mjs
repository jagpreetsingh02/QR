// Captures public/og-image.png (1200x630) from the live landing hero.
import { chromium } from 'playwright';
const url = process.argv[2] ?? 'http://localhost:5178/';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
await ctx.addInitScript(() => localStorage.setItem('qr-studio:theme:v1', 'light'));
const page = await ctx.newPage();
await page.goto(url, { waitUntil: 'networkidle' });
await page.addStyleTag({ content: '.site-nav{position:absolute;width:100%} .lp-hero{padding-block:110px 40px}' });
await page.waitForTimeout(800);
await page.screenshot({ path: 'public/og-image.png' });
await browser.close();
console.log('wrote public/og-image.png');
