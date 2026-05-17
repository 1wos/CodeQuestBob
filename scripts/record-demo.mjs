import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { spawn, execFile } from 'node:child_process';
import { promisify } from 'node:util';

const require = createRequire(import.meta.url);
const execFileAsync = promisify(execFile);

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

    if (fsSync.existsSync(bundledModules)) {
      return createRequire(path.join(bundledModules, 'package.json'))(packageName);
    }

    throw new Error(`${packageName} is not available.`);
  }
}

let chromium;
try {
  ({ chromium } = requireTool('playwright'));
} catch {
  console.error('Playwright is required for demo recording.');
  process.exit(1);
}

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const appUrl = process.env.APP_URL ?? 'http://127.0.0.1:5173/';
const outputDir = path.join(rootDir, 'docs', 'submission-assets', 'demo-video');
const rawVideoDir = path.join(outputDir, 'raw');
const serverLogPath = path.join(outputDir, 'vite-recording-server.log');
const viewport = { width: 1440, height: 900 };
const demoRepoUrl = process.env.DEMO_REPO_URL ?? 'https://github.com/facebook/react';
const showCaptions = process.env.DEMO_CAPTIONS !== '0';
const slowMo = Number(process.env.DEMO_SLOWMO_MS ?? '0');

let devServerProcess = null;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function appIsReachable() {
  try {
    const response = await fetch(appUrl, { method: 'GET' });
    return response.ok;
  } catch {
    return false;
  }
}

async function waitForApp(timeoutMs = 45_000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    if (await appIsReachable()) {
      return;
    }
    await wait(750);
  }

  throw new Error(`Could not reach ${appUrl} within ${timeoutMs}ms.`);
}

async function startDevServerIfNeeded() {
  if (await appIsReachable()) {
    return;
  }

  await fs.mkdir(outputDir, { recursive: true });
  const logStream = fsSync.createWriteStream(serverLogPath, { flags: 'a' });

  devServerProcess = spawn('npm', ['run', 'dev', '--', '--host', '127.0.0.1'], {
    cwd: rootDir,
    env: { ...process.env, BROWSER: 'none' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  devServerProcess.stdout.pipe(logStream);
  devServerProcess.stderr.pipe(logStream);

  await waitForApp();
}

async function injectDemoChrome(page) {
  await page.addStyleTag({
    content: `
      #cq-demo-cursor {
        position: fixed;
        z-index: 2147483647;
        left: 0;
        top: 0;
        width: 22px;
        height: 22px;
        border: 2px solid #0f62fe;
        background: #ffffff;
        box-shadow: 0 0 0 6px rgba(15, 98, 254, 0.16);
        transform: translate3d(40px, 40px, 0);
        pointer-events: none;
        transition: transform 360ms cubic-bezier(0.2, 0, 0.38, 0.9), scale 120ms ease;
      }
      #cq-demo-cursor::after {
        content: "";
        position: absolute;
        right: -7px;
        bottom: -7px;
        width: 8px;
        height: 8px;
        background: #0f62fe;
      }
      #cq-demo-cursor.is-pressing {
        scale: 0.82;
        box-shadow: 0 0 0 10px rgba(15, 98, 254, 0.24);
      }
      #cq-demo-caption {
        position: fixed;
        z-index: 2147483646;
        left: 32px;
        bottom: 28px;
        max-width: 560px;
        padding: 14px 18px;
        background: rgba(22, 22, 22, 0.94);
        border: 1px solid rgba(255, 255, 255, 0.22);
        color: #ffffff;
        font-family: Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
        font-size: 15px;
        line-height: 1.45;
        letter-spacing: 0.16px;
        pointer-events: none;
      }
      #cq-demo-caption strong {
        color: #78a9ff;
        font-weight: 700;
      }
      ${showCaptions ? '' : '#cq-demo-caption { display: none; }'}
    `,
  });

  await page.evaluate(() => {
    if (!document.querySelector('#cq-demo-cursor')) {
      const cursor = document.createElement('div');
      cursor.id = 'cq-demo-cursor';
      document.body.appendChild(cursor);
    }

    if (!document.querySelector('#cq-demo-caption')) {
      const caption = document.createElement('div');
      caption.id = 'cq-demo-caption';
      document.body.appendChild(caption);
    }
  });
}

async function setCaption(page, html) {
  await page.evaluate((value) => {
    const caption = document.querySelector('#cq-demo-caption');
    if (caption) {
      caption.innerHTML = value;
    }
  }, html);
}

async function moveCursorTo(page, locator) {
  await locator.scrollIntoViewIfNeeded({ timeout: 8_000 }).catch(() => {});
  await page.waitForTimeout(250 + slowMo);

  const box = await locator.boundingBox();
  if (!box) {
    return;
  }

  const x = Math.round(box.x + box.width / 2);
  const y = Math.round(box.y + box.height / 2);

  await page.evaluate(
    ({ x, y }) => {
      const cursor = document.querySelector('#cq-demo-cursor');
      if (cursor instanceof HTMLElement) {
        cursor.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      }
    },
    { x, y },
  );
  await page.mouse.move(x, y);
  await page.waitForTimeout(450 + slowMo);
}

async function demoClick(page, locator, captionHtml) {
  if (captionHtml) {
    await setCaption(page, captionHtml);
  }
  await moveCursorTo(page, locator);
  await page.evaluate(() => document.querySelector('#cq-demo-cursor')?.classList.add('is-pressing'));
  await page.waitForTimeout(130 + slowMo);
  await locator.click({ timeout: 10_000 });
  await page.evaluate(() => document.querySelector('#cq-demo-cursor')?.classList.remove('is-pressing'));
  await page.waitForTimeout(900 + slowMo);
}

async function demoType(page, locator, value, captionHtml) {
  if (captionHtml) {
    await setCaption(page, captionHtml);
  }
  await moveCursorTo(page, locator);
  await locator.click({ timeout: 10_000 });
  await locator.fill('');
  await page.keyboard.type(value, { delay: 18 });
  await page.waitForTimeout(700 + slowMo);
}

async function clickNav(page, label, captionHtml) {
  await demoClick(page, page.getByRole('button', { name: label }), captionHtml);
}

async function clickQuest(page, questName, captionHtml) {
  await demoClick(page, page.locator(`button[aria-label^="${questName}"]`).first(), captionHtml);
}

async function completeVisibleObjectives(page) {
  const checkboxes = page.locator('input.objective-checkbox');
  const count = await checkboxes.count();

  for (let index = 0; index < count; index += 1) {
    const checkbox = checkboxes.nth(index);
    if (!(await checkbox.isChecked())) {
      await demoClick(
        page,
        checkbox,
        `<strong>Quest detail:</strong> check objectives to turn vague onboarding into visible progress.`,
      );
    }
  }
}

async function convertToMp4(webmPath) {
  const mp4Path = path.join(outputDir, 'codequest-bob-demo.mp4');
  const ffmpegPath = process.env.FFMPEG_PATH ?? '/opt/homebrew/bin/ffmpeg';

  if (!fsSync.existsSync(ffmpegPath)) {
    return null;
  }

  await execFileAsync(ffmpegPath, [
    '-y',
    '-i',
    webmPath,
    '-movflags',
    '+faststart',
    '-pix_fmt',
    'yuv420p',
    '-vf',
    'scale=trunc(iw/2)*2:trunc(ih/2)*2',
    mp4Path,
  ]);

  return mp4Path;
}

async function runDemo(page) {
  await page.goto(appUrl, { waitUntil: 'networkidle' });
  await injectDemoChrome(page);

  await setCaption(page, '<strong>CodeQuest Bob:</strong> turn a repository into a guided growth journey.');
  await page.waitForTimeout(2_200 + slowMo);

  await demoType(
    page,
    page.getByLabel('Repository URL'),
    demoRepoUrl,
    '<strong>Step 1:</strong> paste a public repository URL to begin intake.',
  );

  await demoClick(
    page,
    page.getByRole('button', { name: /Generate growth plan/i }).first(),
    '<strong>Step 2:</strong> generate a contributor-ready growth plan from repository context.',
  );

  await demoType(
    page,
    page.getByLabel('GitHub repository URL'),
    demoRepoUrl,
    '<strong>Live scan:</strong> refresh repository metadata from GitHub for the demo.',
  );

  await demoClick(
    page,
    page.getByRole('button', { name: /^Refresh$/i }),
    '<strong>Live scan:</strong> pull language, structure, and repo metadata into the onboarding plan.',
  );
  await page.waitForTimeout(2_500 + slowMo);

  await demoClick(
    page,
    page.getByRole('button', { name: /Generate First PR growth path/i }),
    '<strong>Growth path:</strong> move from scan results into Setup, Explore, Improve, and First PR.',
  );

  await page.waitForTimeout(1_000 + slowMo);
  await clickQuest(
    page,
    'Explore Quest',
    '<strong>Quest Map:</strong> select Explore Quest from the spatial onboarding path.',
  );

  await completeVisibleObjectives(page);

  await demoClick(
    page,
    page.getByRole('button', { name: /Generate Bob briefing/i }),
    '<strong>Speech UX:</strong> generate a written fallback or live IBM TTS/STT briefing.',
  );
  await page.waitForTimeout(2_800 + slowMo);

  const saveButton = page.locator('button[aria-label^="Save "]').first();
  if (await saveButton.count()) {
    await demoClick(
      page,
      saveButton,
      '<strong>Skill Boost Radar:</strong> save a learning recommendation into the Developer Passport.',
    );
  }

  const completeButton = page.getByRole('button', { name: /Complete Quest and Claim Reward/i });
  if (await completeButton.count()) {
    await demoClick(
      page,
      completeButton,
      '<strong>Growth loop:</strong> completed work becomes XP, badges, and passport history.',
    );
  }

  await clickNav(
    page,
    'Quests',
    '<strong>Next:</strong> return to the quest map and open the contribution package.',
  );
  await clickQuest(
    page,
    'First PR Quest',
    '<strong>First PR Quest:</strong> package a small, reviewable contribution.',
  );

  const firstPrPanel = page.locator('.first-pr-package').first();
  await firstPrPanel.scrollIntoViewIfNeeded().catch(() => {});
  await setCaption(page, '<strong>First PR Package:</strong> starter task, review scope, commands, draft, and reviewer notes in one place.');
  await page.waitForTimeout(2_500 + slowMo);

  await clickNav(
    page,
    'Passport',
    '<strong>Developer Passport:</strong> make progress and IBM-assisted learning visible after the session.',
  );
  await page.waitForTimeout(2_500 + slowMo);

  await setCaption(page, '<strong>Submission story:</strong> CodeQuest Bob does not only explain code. It prepares action.');
  await page.waitForTimeout(2_800 + slowMo);
}

async function run() {
  await fs.mkdir(rawVideoDir, { recursive: true });
  await startDevServerIfNeeded();

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
    recordVideo: {
      dir: rawVideoDir,
      size: viewport,
    },
  });

  const page = await context.newPage();
  await runDemo(page);

  const video = page.video();
  await page.close();
  await context.close();
  await browser.close();

  const rawVideoPath = await video.path();
  const webmPath = path.join(outputDir, 'codequest-bob-demo.webm');
  await fs.copyFile(rawVideoPath, webmPath);

  let mp4Path = null;
  try {
    mp4Path = await convertToMp4(webmPath);
  } catch (error) {
    console.warn(`MP4 conversion skipped: ${error instanceof Error ? error.message : String(error)}`);
  }

  const manifest = {
    appUrl,
    demoRepoUrl,
    recordedAt: new Date().toISOString(),
    viewport,
    captions: showCaptions,
    files: {
      webm: path.relative(rootDir, webmPath),
      ...(mp4Path ? { mp4: path.relative(rootDir, mp4Path) } : {}),
    },
  };

  await fs.writeFile(
    path.join(outputDir, 'recording-manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );

  if (devServerProcess) {
    devServerProcess.kill('SIGTERM');
  }

  console.log(`Recorded demo video: ${webmPath}`);
  if (mp4Path) {
    console.log(`Converted MP4 video: ${mp4Path}`);
  }
}

process.on('exit', () => {
  if (devServerProcess && !devServerProcess.killed) {
    devServerProcess.kill('SIGTERM');
  }
});

run().catch((error) => {
  if (devServerProcess && !devServerProcess.killed) {
    devServerProcess.kill('SIGTERM');
  }
  console.error(error);
  process.exit(1);
});
