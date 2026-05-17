import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

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

    if (fs.existsSync(bundledModules)) {
      return createRequire(path.join(bundledModules, 'package.json'))(packageName);
    }

    throw new Error(`${packageName} is not available.`);
  }
}

let chromium;
let pptxgen;

try {
  ({ chromium } = requireTool('playwright'));
  pptxgen = requireTool('pptxgenjs');
} catch {
  console.error(
    'playwright and pptxgenjs are required to build the deck. Run inside Codex desktop runtime or install them locally.',
  );
  process.exit(1);
}

const PptxGenJS = pptxgen.default ?? pptxgen;
const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceHtml = path.join(rootDir, 'docs', 'submission-assets', 'codequest-bob-pitch-deck.html');
const outputDir = path.join(rootDir, 'docs', 'submission-assets');
const renderedDir = path.join(outputDir, 'rendered', 'html-slides');
const outputPath = path.join(outputDir, 'codequest-bob-pitch-deck.pptx');

async function renderSlides() {
  fs.mkdirSync(renderedDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 2,
  });

  await page.goto(pathToFileURL(sourceHtml).href, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  const slides = await page.locator('.slide').all();
  const images = [];

  for (let index = 0; index < slides.length; index += 1) {
    const filePath = path.join(renderedDir, `slide-${String(index + 1).padStart(2, '0')}.png`);
    await slides[index].screenshot({ path: filePath });
    images.push(filePath);
  }

  await browser.close();
  return images;
}

async function buildPptx(images) {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = 'AweSombob';
  pptx.subject = 'IBM Bob Hackathon pitch deck';
  pptx.title = 'CodeQuest Bob';
  pptx.company = 'AweSombob';
  pptx.lang = 'en-US';
  pptx.defineLayout({ name: 'LAYOUT_WIDE', width: 13.333, height: 7.5 });

  images.forEach((image) => {
    const slide = pptx.addSlide();
    slide.background = { color: 'FFFFFF' };
    slide.addImage({ path: image, x: 0, y: 0, w: 13.333, h: 7.5 });
  });

  await pptx.writeFile({ fileName: outputPath });
}

async function run() {
  const images = await renderSlides();
  await buildPptx(images);
  console.log(`Rendered ${images.length} HTML slides and wrote ${outputPath}`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
