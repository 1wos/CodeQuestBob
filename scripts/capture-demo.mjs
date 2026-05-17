import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);

function requireTool(packageName) {
  try {
    return require(packageName);
  } catch {
    const bundledModules = path.join(
      process.env.HOME ?? '',
      '.cache',
      'codex-runtimes',
      'codex-primary-runtime',
      'dependencies',
      'node',
      'node_modules',
    );

    if (fsSyncExists(bundledModules)) {
      return createRequire(path.join(bundledModules, 'package.json'))(packageName);
    }

    throw new Error(`${packageName} is not available.`);
  }
}

function fsSyncExists(filePath) {
  try {
    return Boolean(filePath) && Boolean(require('node:fs').existsSync(filePath));
  } catch {
    return false;
  }
}

let chromium;
try {
  ({ chromium } = requireTool('playwright'));
} catch {
  console.error(
    'Playwright is required for demo capture. Install it or run inside the Codex desktop runtime.',
  );
  process.exit(1);
}

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = path.join(rootDir, 'docs', 'submission-assets', 'screenshots');
const deckOutputDir = path.join(outputDir, 'deck');
const appUrl = process.env.APP_URL ?? 'http://127.0.0.1:5173/';

const desktopViewport = { width: 1440, height: 1000 };
const deckViewport = { width: 1440, height: 900 };
const mobileViewport = { width: 390, height: 844 };

async function ensureAppIsReachable() {
  try {
    const response = await fetch(appUrl, { method: 'HEAD' });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (error) {
    console.error(`Could not reach ${appUrl}. Start the app with npm run dev first.`);
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

async function capture(page, name) {
  await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
  await page.waitForTimeout(700);
  const filePath = path.join(outputDir, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage: true });
  return filePath;
}

async function captureFrame(page, name) {
  await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
  await page.waitForTimeout(900);
  const filePath = path.join(deckOutputDir, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage: false });
  return filePath;
}

async function clickNav(page, label) {
  await page.getByRole('button', { name: label }).click();
  await page.waitForTimeout(900);
}

async function clickQuest(page, questName) {
  await page.locator(`button[aria-label^="${questName}"]`).first().click();
  await page.waitForTimeout(900);
}

async function run() {
  await ensureAppIsReachable();
  await fs.mkdir(outputDir, { recursive: true });
  await fs.mkdir(deckOutputDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: desktopViewport, deviceScaleFactor: 1 });
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        scroll-behavior: auto !important;
      }
    `,
  });

  const captured = [];
  const deckCaptured = [];
  await page.goto(appUrl, { waitUntil: 'networkidle' });
  captured.push(await capture(page, '01-home-desktop'));

  await clickNav(page, 'Scan');
  captured.push(await capture(page, '02-repository-scan-desktop'));

  await clickNav(page, 'Quests');
  captured.push(await capture(page, '03-quest-map-desktop'));

  await clickQuest(page, 'Explore Quest');
  captured.push(await capture(page, '04-quest-detail-desktop'));

  await clickNav(page, 'Quests');
  await clickQuest(page, 'First PR Quest');
  captured.push(await capture(page, '05-first-pr-package-desktop'));

  await clickNav(page, 'Passport');
  captured.push(await capture(page, '06-passport-desktop'));

  await page.setViewportSize(deckViewport);
  await page.goto(appUrl, { waitUntil: 'networkidle' });
  deckCaptured.push(await captureFrame(page, '01-home-frame'));

  await clickNav(page, 'Scan');
  deckCaptured.push(await captureFrame(page, '02-repository-scan-frame'));

  await clickNav(page, 'Quests');
  deckCaptured.push(await captureFrame(page, '03-quest-map-frame'));

  await clickQuest(page, 'Explore Quest');
  await page.locator('.skill-boost-section, .skill-boost-radar, text=Skill Boost Radar').first().scrollIntoViewIfNeeded().catch(() => {});
  deckCaptured.push(await captureFrame(page, '04-skill-boost-radar-frame'));

  await clickNav(page, 'Quests');
  await clickQuest(page, 'First PR Quest');
  await page.locator('.first-pr-package, text=First PR Package').first().scrollIntoViewIfNeeded().catch(() => {});
  deckCaptured.push(await captureFrame(page, '05-first-pr-package-frame'));

  await clickNav(page, 'Passport');
  deckCaptured.push(await captureFrame(page, '06-passport-frame'));

  await page.setViewportSize(mobileViewport);
  await page.goto(appUrl, { waitUntil: 'networkidle' });
  captured.push(await capture(page, '07-home-mobile'));

  await clickNav(page, 'Quests');
  captured.push(await capture(page, '08-quest-map-mobile'));

  await clickNav(page, 'Passport');
  captured.push(await capture(page, '09-passport-mobile'));

  await browser.close();

  const manifest = {
    appUrl,
    capturedAt: new Date().toISOString(),
    screenshots: captured.map((filePath) => path.relative(rootDir, filePath)),
    deckScreenshots: deckCaptured.map((filePath) => path.relative(rootDir, filePath)),
  };

  await fs.writeFile(
    path.join(outputDir, 'capture-manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );

  console.log(`Captured ${captured.length} demo screenshots to ${outputDir}`);
  console.log(`Captured ${deckCaptured.length} deck screenshots to ${deckOutputDir}`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
