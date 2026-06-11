import { chromium } from 'playwright';
import { spawn } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { once } from 'events';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUT = resolve(ROOT, 'docs', 'screenshots');
const PORT = 8090;
const BASE = `http://localhost:${PORT}`;

const pages = [
  { name: 'home', path: '/', wait: 2000 },
  { name: 'listings', path: '/listings', wait: 2000 },
  { name: 'detail', path: '/listings/l_001', wait: 1500 },
  { name: 'publish', path: '/publish', wait: 1500 },
  { name: 'impact', path: '/impact', wait: 3000 },
  { name: 'me', path: '/me', wait: 1500 },
  { name: 'admin', path: '/admin', wait: 1500 },
];

const mobilePages = [
  { name: 'mobile-home', path: '/' },
  { name: 'mobile-listings', path: '/listings' },
];

function startServer() {
  const child = spawn('npx', ['serve', '-s', resolve(ROOT, 'new-site', 'public'), '-l', String(PORT), '--no-clipboard'], {
    stdio: 'pipe',
    shell: true,
  });
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('server start timeout')), 15000);
    child.stdout.on('data', (data) => {
      if (data.toString().includes('Accepting connections')) {
        clearTimeout(timeout);
        resolve(child);
      }
    });
    child.stderr.on('data', (data) => {
      if (data.toString().includes('Accepting connections')) {
        clearTimeout(timeout);
        resolve(child);
      }
    });
  });
}

async function capture() {
  console.log(`[capture] screenshots → ${OUT}`);
  const server = await startServer();
  console.log(`[capture] server ready on :${PORT}`);

  const browser = await chromium.launch();
  const desktop = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
  });

  for (const { name, path, wait } of pages) {
    const page = await desktop.newPage();
    await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(wait);
    await page.screenshot({ path: resolve(OUT, `${name}.png`), fullPage: true });
    await page.close();
    console.log(`[capture] ✓ ${name}.png`);
  }

  // hero = same as home but just above-the-fold
  {
    const page = await desktop.newPage();
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: resolve(OUT, 'hero.png'), fullPage: false });
    await page.close();
    console.log('[capture] ✓ hero.png (above-fold)');
  }

  // AI analyze screenshot: trigger AI on publish page
  {
    const page = await desktop.newPage();
    await page.goto(`${BASE}/publish`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    // Try to pick a seed image to trigger AI result
    const seedImg = await page.$('img[src*="seed-images"]');
    if (seedImg) {
      await seedImg.click().catch(() => {});
      await page.waitForTimeout(1500);
    }
    await page.screenshot({ path: resolve(OUT, 'ai-analyze.png'), fullPage: false });
    await page.close();
    console.log('[capture] ✓ ai-analyze.png');
  }

  // carbon detail screenshot
  {
    const page = await desktop.newPage();
    await page.goto(`${BASE}/listings/l_001`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: resolve(OUT, 'carbon-detail.png'), fullPage: false });
    await page.close();
    console.log('[capture] ✓ carbon-detail.png');
  }

  // impact dashboard
  {
    const page = await desktop.newPage();
    await page.goto(`${BASE}/impact`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: resolve(OUT, 'impact-dashboard.png'), fullPage: false });
    await page.close();
    console.log('[capture] ✓ impact-dashboard.png');
  }

  // mobile screenshots
  for (const { name, path } of mobilePages) {
    const page = await mobile.newPage();
    await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: resolve(OUT, `${name}.png`), fullPage: false });
    await page.close();
    console.log(`[capture] ✓ ${name}.png`);
  }

  // composite mobile: stitch home + listings side by side
  {
    const page = await desktop.newPage();
    await page.setViewportSize({ width: 800, height: 844 });
    // just load the mobile-home as the main mobile screenshot
    const mPage = await mobile.newPage();
    await mPage.goto(BASE, { waitUntil: 'networkidle' });
    await mPage.waitForTimeout(2000);
    await mPage.screenshot({ path: resolve(OUT, 'mobile.png'), fullPage: false });
    await mPage.close();
    await page.close();
    console.log('[capture] ✓ mobile.png');
  }

  await browser.close();
  server.kill();
  console.log(`[capture] done — ${pages.length + mobilePages.length + 5} screenshots saved`);
}

capture().catch((e) => {
  console.error(e);
  process.exit(1);
});
