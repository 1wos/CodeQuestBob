import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = path.join(rootDir, 'docs', 'submission-assets', 'demo-video');
const audioDir = path.join(outputDir, 'voiceover-segments');
const sourceVideo = path.join(outputDir, 'codequest-bob-demo.mp4');
const outputVideo = path.join(outputDir, 'codequest-bob-demo-voiceover.mp4');
const srtPath = path.join(outputDir, 'codequest-bob-demo-voiceover.srt');
const scriptPath = path.join(outputDir, 'narration-script.md');

const ffmpegPath = process.env.FFMPEG_PATH ?? '/opt/homebrew/bin/ffmpeg';
const ffprobePath = process.env.FFPROBE_PATH ?? '/opt/homebrew/bin/ffprobe';
const azPath = process.env.AZURE_CLI_PATH ?? '/opt/homebrew/bin/az';
const sayPath = process.env.SAY_PATH ?? '/usr/bin/say';

const narration = [
  {
    start: 0.7,
    end: 5.4,
    text: 'CodeQuest Bob turns an unfamiliar repository into a guided developer growth journey.',
  },
  {
    start: 5.7,
    end: 11.7,
    text: 'We start with repository intake. GitHub context becomes the basis for a practical onboarding path.',
  },
  {
    start: 12.0,
    end: 17.9,
    text: 'The quest map becomes the center of the product: setup, exploration, improvement, and first PR.',
  },
  {
    start: 18.2,
    end: 24.8,
    text: 'Inside each quest, objectives turn scattered maintainer advice into visible, trackable progress.',
  },
  {
    start: 25.1,
    end: 31.9,
    text: 'Bob briefing adds a speech layer. If live speech is unavailable, the written guidance still works.',
  },
  {
    start: 32.2,
    end: 38.6,
    text: 'Skill Boost Radar saves relevant learning recommendations into the Developer Passport.',
  },
  {
    start: 39.0,
    end: 45.4,
    text: 'First PR Package turns analysis into action: task, commands, draft, checklist, and reviewer notes.',
  },
  {
    start: 45.8,
    end: 50.7,
    text: 'The Passport records growth, badges, saved resources, and AI-assisted activity after the session.',
  },
];

const escapeXml = (value) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const timestamp = (seconds, separator = ',') => {
  const whole = Math.floor(seconds);
  const ms = Math.round((seconds - whole) * 1000);
  const hh = Math.floor(whole / 3600);
  const mm = Math.floor((whole % 3600) / 60);
  const ss = whole % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}${separator}${String(ms).padStart(3, '0')}`;
};

async function runCommand(command, args, options = {}) {
  const { stdout } = await execFileAsync(command, args, {
    cwd: rootDir,
    maxBuffer: 1024 * 1024 * 10,
    ...options,
  });
  return stdout.trim();
}

async function getVideoDuration() {
  const value = await runCommand(ffprobePath, [
    '-v',
    'error',
    '-show_entries',
    'format=duration',
    '-of',
    'default=noprint_wrappers=1:nokey=1',
    sourceVideo,
  ]);

  return Number(value);
}

async function discoverAzureSpeechConfig() {
  if (process.env.AZURE_SPEECH_KEY && process.env.AZURE_SPEECH_REGION) {
    return {
      provider: 'azure-env',
      key: process.env.AZURE_SPEECH_KEY,
      region: process.env.AZURE_SPEECH_REGION,
      voice: process.env.AZURE_SPEECH_VOICE ?? 'en-US-AvaMultilingualNeural',
    };
  }

  if (
    process.env.AZURE_SPEECH_ACCOUNT_NAME &&
    process.env.AZURE_SPEECH_RESOURCE_GROUP &&
    fsSync.existsSync(azPath)
  ) {
    const [key, region] = await Promise.all([
      runCommand(azPath, [
        'cognitiveservices',
        'account',
        'keys',
        'list',
        '--name',
        process.env.AZURE_SPEECH_ACCOUNT_NAME,
        '--resource-group',
        process.env.AZURE_SPEECH_RESOURCE_GROUP,
        '--query',
        'key1',
        '-o',
        'tsv',
      ]),
      runCommand(azPath, [
        'cognitiveservices',
        'account',
        'show',
        '--name',
        process.env.AZURE_SPEECH_ACCOUNT_NAME,
        '--resource-group',
        process.env.AZURE_SPEECH_RESOURCE_GROUP,
        '--query',
        'location',
        '-o',
        'tsv',
      ]),
    ]);

    return {
      provider: 'azure-cli',
      key,
      region,
      voice: process.env.AZURE_SPEECH_VOICE ?? 'en-US-AvaMultilingualNeural',
    };
  }

  if (!fsSync.existsSync(azPath)) {
    return null;
  }

  try {
    await runCommand(azPath, ['account', 'show', '--query', 'id', '-o', 'tsv']);
    const accounts = JSON.parse(
      await runCommand(azPath, [
        'cognitiveservices',
        'account',
        'list',
        '--query',
        "[?kind=='SpeechServices'].{name:name,resourceGroup:resourceGroup,location:location}",
        '-o',
        'json',
      ]),
    );

    if (!Array.isArray(accounts) || accounts.length !== 1) {
      return null;
    }

    const account = accounts[0];
    const key = await runCommand(azPath, [
      'cognitiveservices',
      'account',
      'keys',
      'list',
      '--name',
      account.name,
      '--resource-group',
      account.resourceGroup,
      '--query',
      'key1',
      '-o',
      'tsv',
    ]);

    return {
      provider: 'azure-cli-auto',
      key,
      region: account.location,
      voice: process.env.AZURE_SPEECH_VOICE ?? 'en-US-AvaMultilingualNeural',
      accountName: account.name,
    };
  } catch {
    return null;
  }
}

async function synthesizeAzureSegment(segment, index, config) {
  const filePath = path.join(audioDir, `segment-${String(index + 1).padStart(2, '0')}.mp3`);
  const endpoint = `https://${config.region}.tts.speech.microsoft.com/cognitiveservices/v1`;
  const ssml = [
    "<speak version='1.0' xml:lang='en-US'>",
    `  <voice name='${escapeXml(config.voice)}'>`,
    `    <prosody rate='+8%'>${escapeXml(segment.text)}</prosody>`,
    '  </voice>',
    '</speak>',
  ].join('\n');

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': config.key,
      'Content-Type': 'application/ssml+xml',
      'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
      'User-Agent': 'codequest-bob-demo',
    },
    body: ssml,
  });

  if (!response.ok) {
    throw new Error(`Azure Speech TTS failed with HTTP ${response.status}`);
  }

  await fs.writeFile(filePath, Buffer.from(await response.arrayBuffer()));
  return filePath;
}

async function synthesizeMacSegment(segment, index) {
  const filePath = path.join(audioDir, `segment-${String(index + 1).padStart(2, '0')}.aiff`);
  const voice = process.env.MACOS_TTS_VOICE ?? 'Samantha';
  const rate = process.env.MACOS_TTS_RATE ?? '205';

  try {
    await runCommand(sayPath, ['-v', voice, '-r', rate, '-o', filePath, segment.text]);
  } catch {
    await runCommand(sayPath, ['-r', rate, '-o', filePath, segment.text]);
  }

  return filePath;
}

async function synthesizeSegments() {
  await fs.rm(audioDir, { recursive: true, force: true });
  await fs.mkdir(audioDir, { recursive: true });

  let azureConfig = null;
  let provider = 'macos-say';

  try {
    azureConfig = await discoverAzureSpeechConfig();
  } catch {
    azureConfig = null;
  }

  if (azureConfig) {
    try {
      const files = [];
      for (const [index, segment] of narration.entries()) {
        files.push(await synthesizeAzureSegment(segment, index, azureConfig));
      }
      provider = azureConfig.provider;
      return { provider, files };
    } catch (error) {
      console.warn(`Azure TTS unavailable, falling back to macOS voice: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  const files = [];
  for (const [index, segment] of narration.entries()) {
    files.push(await synthesizeMacSegment(segment, index));
  }

  return { provider, files };
}

async function writeNarrationDocs(provider, duration) {
  const srt = narration
    .map((segment, index) =>
      [
        String(index + 1),
        `${timestamp(segment.start)} --> ${timestamp(Math.min(segment.end, duration))}`,
        segment.text,
        '',
      ].join('\n'),
    )
    .join('\n');

  const markdown = [
    '# CodeQuest Bob Demo Narration',
    '',
    `Provider: ${provider}`,
    `Video duration: ${duration.toFixed(2)} seconds`,
    '',
    '| Time | Narration |',
    '|---|---|',
    ...narration.map(
      (segment) =>
        `| ${timestamp(segment.start, '.')} - ${timestamp(segment.end, '.')} | ${segment.text} |`,
    ),
    '',
  ].join('\n');

  await fs.writeFile(srtPath, srt);
  await fs.writeFile(scriptPath, markdown);
}

async function muxVoiceover(audioFiles, duration) {
  const inputs = ['-i', sourceVideo];
  for (const file of audioFiles) {
    inputs.push('-i', file);
  }

  const delayedInputs = narration.map((segment, index) => {
    const inputIndex = index + 1;
    const delayMs = Math.round(segment.start * 1000);
    return `[${inputIndex}:a]adelay=${delayMs}|${delayMs},volume=1.0[a${index}]`;
  });
  const mixedLabels = narration.map((_, index) => `[a${index}]`).join('');
  const filter = [
    ...delayedInputs,
    `${mixedLabels}amix=inputs=${narration.length}:duration=longest:normalize=0,atrim=0:${duration.toFixed(3)},asetpts=N/SR/TB[voice]`,
  ].join(';');

  await runCommand(ffmpegPath, [
    '-y',
    ...inputs,
    '-filter_complex',
    filter,
    '-map',
    '0:v:0',
    '-map',
    '[voice]',
    '-c:v',
    'copy',
    '-c:a',
    'aac',
    '-b:a',
    '160k',
    '-movflags',
    '+faststart',
    '-shortest',
    outputVideo,
  ]);
}

async function run() {
  if (!fsSync.existsSync(sourceVideo)) {
    throw new Error(`Missing demo video. Run npm run record:demo first: ${sourceVideo}`);
  }

  if (!fsSync.existsSync(ffmpegPath) || !fsSync.existsSync(ffprobePath)) {
    throw new Error('ffmpeg and ffprobe are required to add voiceover.');
  }

  const duration = await getVideoDuration();
  const { provider, files } = await synthesizeSegments();
  await muxVoiceover(files, duration);
  await writeNarrationDocs(provider, duration);

  const manifest = {
    provider,
    generatedAt: new Date().toISOString(),
    sourceVideo: path.relative(rootDir, sourceVideo),
    outputVideo: path.relative(rootDir, outputVideo),
    captions: path.relative(rootDir, srtPath),
    script: path.relative(rootDir, scriptPath),
    segmentCount: narration.length,
    durationSeconds: duration,
  };

  await fs.writeFile(
    path.join(outputDir, 'voiceover-manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );

  console.log(`Voiceover provider: ${provider}`);
  console.log(`Voiceover video: ${outputVideo}`);
  console.log(`Captions: ${srtPath}`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
