import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

type RuntimeCheck = {
  id: string;
  name: string;
  status: 'live' | 'configured' | 'failed' | 'missing';
  detail: string;
  latencyMs?: number;
};

type EnvMap = Record<string, string | undefined>;

type TrendResource = {
  id: string;
  source: 'GitHub' | 'Hugging Face';
  title: string;
  description: string;
  url: string;
  signal: string;
  language?: string;
  tags: string[];
};

type SkillBoostRecommendation = TrendResource & {
  nluKeywords: string[];
  recommendationReason: string;
  relatedQuestId: string;
  relatedQuestTitle: string;
  generatedBy: 'watsonx.ai / IBM Granite' | 'Rule-based ranking';
};

type BobBriefingRequest = {
  title?: string;
  subtitle?: string;
  objectives?: string[];
};

type GithubRepoSummary = {
  repoName: string;
  repoUrl: string;
  description: string;
  defaultBranch: string;
  stars: number;
  forks: number;
  openIssues: number;
  updatedAt: string;
  languages: Record<string, number>;
  rootFiles: Array<{ name: string; type: 'file' | 'dir'; path: string }>;
  entryPoints: string[];
  keyDirectories: string[];
};

const jsonResponse = (res: import('node:http').ServerResponse, statusCode: number, body: unknown) => {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body, null, 2));
};

const basicAuth = (apiKey: string) => {
  return `Basic ${Buffer.from(`apikey:${apiKey}`).toString('base64')}`;
};

const timed = async <T>(task: () => Promise<T>) => {
  const startedAt = Date.now();
  const value = await task();
  return { value, latencyMs: Date.now() - startedAt };
};

const readRequestJson = async <T>(req: import('node:http').IncomingMessage): Promise<T> => {
  const chunks: Buffer[] = [];

  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as T;
};

const getIamToken = async (env: EnvMap) => {
  if (!env.IBM_CLOUD_API_KEY) {
    throw new Error('IBM_CLOUD_API_KEY is not configured');
  }

  const response = await fetch('https://iam.cloud.ibm.com/identity/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ibm:params:oauth:grant-type:apikey',
      apikey: env.IBM_CLOUD_API_KEY,
    }),
  });

  if (!response.ok) {
    throw new Error(`IAM token request failed with HTTP ${response.status}`);
  }

  const payload = (await response.json()) as { access_token?: string };
  if (!payload.access_token) {
    throw new Error('IAM token response did not include access_token');
  }

  return payload.access_token;
};

const checkWatsonx = async (env: EnvMap, iamToken: string): Promise<RuntimeCheck> => {
  if (!env.WATSONX_URL || !env.WATSONX_MODEL_ID || (!env.WATSONX_PROJECT_ID && !env.WATSONX_SPACE_ID)) {
    return {
      id: 'watsonx-ai',
      name: 'watsonx.ai / IBM Granite',
      status: 'missing',
      detail: 'Missing watsonx URL, model ID, project ID, or deployment space ID.',
    };
  }

  try {
    const { value, latencyMs } = await timed(async () => {
      const response = await fetch(`${env.WATSONX_URL}/ml/v1/text/generation?version=2023-05-29`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${iamToken}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          model_id: env.WATSONX_MODEL_ID,
          input: 'Return only this exact phrase: CodeQuest ready',
          parameters: {
            max_new_tokens: 12,
            temperature: 0,
          },
          ...(env.WATSONX_PROJECT_ID
            ? { project_id: env.WATSONX_PROJECT_ID }
            : { space_id: env.WATSONX_SPACE_ID }),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      await response.json();
      return env.WATSONX_MODEL_ID;
    });

    return {
      id: 'watsonx-ai',
      name: 'watsonx.ai / IBM Granite',
      status: 'live',
      detail: `Granite generation endpoint responded using ${value}.`,
      latencyMs,
    };
  } catch (error) {
    return {
      id: 'watsonx-ai',
      name: 'watsonx.ai / IBM Granite',
      status: 'failed',
      detail: error instanceof Error ? error.message : 'Unknown watsonx.ai error',
    };
  }
};

const checkNlu = async (env: EnvMap): Promise<RuntimeCheck> => {
  if (!env.NLU_URL || !env.NLU_API_KEY) {
    return {
      id: 'nlu',
      name: 'Natural Language Understanding',
      status: 'missing',
      detail: 'Missing NLU URL or API key.',
    };
  }

  try {
    const { value, latencyMs } = await timed(async () => {
      const response = await fetch(`${env.NLU_URL}/v1/analyze?version=${env.NLU_VERSION || '2022-04-07'}`, {
        method: 'POST',
        headers: {
          Authorization: basicAuth(env.NLU_API_KEY || ''),
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          text: 'CodeQuest Bob turns repository onboarding into measurable developer growth quests.',
          features: {
            keywords: {
              limit: 3,
            },
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const payload = (await response.json()) as {
        keywords?: Array<{ text: string }>;
      };

      return payload.keywords?.map((keyword) => keyword.text).join(', ') || 'keywords extracted';
    });

    return {
      id: 'nlu',
      name: 'Natural Language Understanding',
      status: 'live',
      detail: `Extracted keywords: ${value}`,
      latencyMs,
    };
  } catch (error) {
    return {
      id: 'nlu',
      name: 'Natural Language Understanding',
      status: 'failed',
      detail: error instanceof Error ? error.message : 'Unknown NLU error',
    };
  }
};

const synthesizeSpeech = async (env: EnvMap, text = 'Code Quest Bob is ready.') => {
  if (!env.TTS_URL || !env.TTS_API_KEY) {
    throw new Error('Missing TTS URL or API key');
  }

  const response = await fetch(
    `${env.TTS_URL}/v1/synthesize?voice=${encodeURIComponent(env.TTS_VOICE || 'en-US_AllisonV3Voice')}`,
    {
      method: 'POST',
      headers: {
        Authorization: basicAuth(env.TTS_API_KEY),
        'Content-Type': 'application/json',
        Accept: 'audio/wav',
      },
      body: JSON.stringify({
        text,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return Buffer.from(await response.arrayBuffer());
};

const recognizeSpeech = async (env: EnvMap, audio: Buffer) => {
  if (!env.STT_URL || !env.STT_API_KEY) {
    throw new Error('Missing STT URL or API key');
  }

  const response = await fetch(
    `${env.STT_URL}/v1/recognize?model=${encodeURIComponent(env.STT_MODEL || 'en-US_BroadbandModel')}`,
    {
      method: 'POST',
      headers: {
        Authorization: basicAuth(env.STT_API_KEY),
        'Content-Type': 'audio/wav',
        Accept: 'application/json',
      },
      body: audio,
    },
  );

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const payload = (await response.json()) as {
    results?: Array<{ alternatives?: Array<{ transcript?: string }> }>;
  };

  return payload.results?.[0]?.alternatives?.[0]?.transcript?.trim() || 'speech recognized';
};

const buildBriefingText = (request: BobBriefingRequest) => {
  const title = request.title?.trim() || 'CodeQuest Bob quest';
  const subtitle = request.subtitle?.trim() || 'repository onboarding workflow';
  const objectives = (request.objectives || []).filter(Boolean).slice(0, 4);
  const objectiveText = objectives.length > 0
    ? ` Focus on ${objectives.map((objective, index) => `step ${index + 1}: ${objective}`).join('. ')}.`
    : '';

  return `CodeQuest Bob briefing. You are starting ${title}. ${subtitle}. This quest turns repository context into measurable contributor progress.${objectiveText} When you finish, save your progress in your developer passport.`;
};

const checkTtsAndStt = async (env: EnvMap): Promise<RuntimeCheck[]> => {
  const results: RuntimeCheck[] = [];

  if (!env.TTS_URL || !env.TTS_API_KEY) {
    results.push({
      id: 'tts',
      name: 'Text to Speech',
      status: 'missing',
      detail: 'Missing TTS URL or API key.',
    });
  } else {
    try {
      const { value, latencyMs } = await timed(() => synthesizeSpeech(env));
      results.push({
        id: 'tts',
        name: 'Text to Speech',
        status: 'live',
        detail: `Generated ${Math.round(value.byteLength / 1024)} KB WAV briefing.`,
        latencyMs,
      });

      if (!env.STT_URL || !env.STT_API_KEY) {
        results.push({
          id: 'stt',
          name: 'Speech to Text',
          status: 'configured',
          detail: 'Credentials expected, but STT URL or key is missing.',
        });
      } else {
        try {
          const { value: transcript, latencyMs: sttLatencyMs } = await timed(async () => {
            return recognizeSpeech(env, value);
          });

          results.push({
            id: 'stt',
            name: 'Speech to Text',
            status: 'live',
            detail: `Recognized generated briefing: "${transcript}"`,
            latencyMs: sttLatencyMs,
          });
        } catch (error) {
          results.push({
            id: 'stt',
            name: 'Speech to Text',
            status: 'failed',
            detail: error instanceof Error ? error.message : 'Unknown STT error',
          });
        }
      }
    } catch (error) {
      results.push({
        id: 'tts',
        name: 'Text to Speech',
        status: 'failed',
        detail: error instanceof Error ? error.message : 'Unknown TTS error',
      });
      results.push({
        id: 'stt',
        name: 'Speech to Text',
        status: env.STT_URL && env.STT_API_KEY ? 'configured' : 'missing',
        detail: 'STT check requires successful TTS audio generation.',
      });
    }
  }

  return results;
};

const normalizeId = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const truncate = (value: string | undefined, maxLength = 220) => {
  if (!value) return 'No description provided.';
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;
};

const fallbackKeywords = (text: string) => {
  const stopWords = new Set([
    'the',
    'and',
    'for',
    'with',
    'from',
    'that',
    'this',
    'your',
    'into',
    'code',
    'using',
  ]);

  return Array.from(
    new Set(
      text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, ' ')
        .split(/\s+/)
        .filter((word) => word.length > 3 && !stopWords.has(word))
        .slice(0, 6),
    ),
  );
};

const cleanGeneratedReason = (value: string | undefined) => {
  if (!value) return '';

  const normalized = value.replace(/\s+/g, ' ').trim();
  const resourceSentenceIndex = normalized.indexOf('This resource');
  const cleaned = resourceSentenceIndex >= 0 ? normalized.slice(resourceSentenceIndex) : normalized;

  return cleaned.replace(/^[,.\s:-]+/, '').trim();
};

const fetchGithubTrendResources = async (env: EnvMap, limit: number): Promise<TrendResource[]> => {
  const queries = [
    'topic:developer-tools language:TypeScript stars:>100',
    'ai-agent language:TypeScript stars:>50',
    'onboarding developer-tools stars:>20',
  ];

  for (const query of queries) {
    const response = await fetch(
      `https://api.github.com/search/repositories?${new URLSearchParams({
        q: query,
        sort: 'updated',
        order: 'desc',
        per_page: String(limit),
      })}`,
      {
        headers: {
          Accept: 'application/vnd.github+json',
          'User-Agent': 'CodeQuest-Bob-Hackathon',
          ...(env.GITHUB_TOKEN ? { Authorization: `Bearer ${env.GITHUB_TOKEN}` } : {}),
        },
      },
    );

    if (!response.ok) continue;

    const payload = (await response.json()) as {
      items?: Array<{
        full_name: string;
        html_url: string;
        description?: string;
        language?: string;
        stargazers_count?: number;
        topics?: string[];
        updated_at?: string;
      }>;
    };

    const items = payload.items || [];
    if (items.length > 0) {
      return items.slice(0, limit).map((repo) => ({
        id: `github-${normalizeId(repo.full_name)}`,
        source: 'GitHub',
        title: repo.full_name,
        description: truncate(repo.description),
        url: repo.html_url,
        signal: `${repo.stargazers_count?.toLocaleString() || '0'} stars · updated ${repo.updated_at?.slice(0, 10) || 'recently'}`,
        language: repo.language,
        tags: (repo.topics || []).slice(0, 5),
      }));
    }
  }

  return [];
};

const fetchHuggingFaceTrendResources = async (limit: number): Promise<TrendResource[]> => {
  const response = await fetch(
    `https://huggingface.co/api/models?${new URLSearchParams({
      sort: 'downloads',
      direction: '-1',
      filter: 'text-generation',
      limit: String(limit),
    })}`,
    { headers: { Accept: 'application/json' } },
  );

  if (!response.ok) {
    throw new Error(`Hugging Face API failed with HTTP ${response.status}`);
  }

  const payload = (await response.json()) as Array<{
    id?: string;
    modelId?: string;
    downloads?: number;
    likes?: number;
    tags?: string[];
  }>;

  return payload.slice(0, limit).map((model) => {
    const modelId = model.modelId || model.id || 'unknown-model';
    const tags = (model.tags || []).filter((tag) => !tag.startsWith('region:')).slice(0, 5);

    return {
      id: `hf-${normalizeId(modelId)}`,
      source: 'Hugging Face',
      title: modelId,
      description: `Popular text-generation model on Hugging Face. Tags: ${tags.join(', ') || 'model hub'}.`,
      url: `https://huggingface.co/${modelId}`,
      signal: `${model.downloads?.toLocaleString() || '0'} downloads · ${model.likes?.toLocaleString() || '0'} likes`,
      tags,
    };
  });
};

const extractNluKeywords = async (env: EnvMap, text: string) => {
  if (!env.NLU_URL || !env.NLU_API_KEY) {
    return fallbackKeywords(text);
  }

  try {
    const response = await fetch(`${env.NLU_URL}/v1/analyze?version=${env.NLU_VERSION || '2022-04-07'}`, {
      method: 'POST',
      headers: {
        Authorization: basicAuth(env.NLU_API_KEY),
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        text,
        features: {
          keywords: {
            limit: 5,
          },
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const payload = (await response.json()) as {
      keywords?: Array<{ text: string }>;
    };

    return payload.keywords?.map((keyword) => keyword.text).filter(Boolean).slice(0, 5) || fallbackKeywords(text);
  } catch {
    return fallbackKeywords(text);
  }
};

const mapRelatedQuest = (resource: TrendResource) => {
  const text = `${resource.title} ${resource.description} ${resource.tags.join(' ')}`.toLowerCase();

  if (text.includes('pull') || text.includes('pr') || text.includes('lint')) {
    return { relatedQuestId: 'quest-004', relatedQuestTitle: 'First PR Quest' };
  }

  if (text.includes('test') || text.includes('debug') || text.includes('refactor') || text.includes('quality')) {
    return { relatedQuestId: 'quest-003', relatedQuestTitle: 'Improve Quest' };
  }

  if (text.includes('architecture') || text.includes('map') || text.includes('documentation')) {
    return { relatedQuestId: 'quest-002', relatedQuestTitle: 'Explore Quest' };
  }

  return { relatedQuestId: 'quest-001', relatedQuestTitle: 'Setup Quest' };
};

const generateGraniteReason = async (
  env: EnvMap,
  iamToken: string | null,
  resource: TrendResource,
  keywords: string[],
) => {
  const fallback = `Recommended for ${mapRelatedQuest(resource).relatedQuestTitle}: learn ${keywords.slice(0, 3).join(', ') || resource.source} patterns that strengthen repository onboarding.`;

  if (!iamToken || !env.WATSONX_URL || !env.WATSONX_MODEL_ID || (!env.WATSONX_PROJECT_ID && !env.WATSONX_SPACE_ID)) {
    return { reason: fallback, generatedBy: 'Rule-based ranking' as const };
  }

  try {
    const prompt = [
      'You are CodeQuest Bob, an IBM-powered developer onboarding coach.',
      'Write one concise sentence explaining why this resource is a useful Skill Boost for a new contributor.',
      'Avoid marketing language. Mention the related developer workflow.',
      `Resource: ${resource.title}`,
      `Source: ${resource.source}`,
      `Description: ${resource.description}`,
      `Keywords: ${keywords.join(', ')}`,
    ].join('\n');

    const response = await fetch(`${env.WATSONX_URL}/ml/v1/text/generation?version=2023-05-29`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${iamToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        model_id: env.WATSONX_MODEL_ID,
        input: prompt,
        parameters: {
          max_new_tokens: 56,
          temperature: 0.2,
        },
        ...(env.WATSONX_PROJECT_ID
          ? { project_id: env.WATSONX_PROJECT_ID }
          : { space_id: env.WATSONX_SPACE_ID }),
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const payload = (await response.json()) as {
      results?: Array<{ generated_text?: string }>;
    };

    const generatedText = cleanGeneratedReason(payload.results?.[0]?.generated_text);
    return {
      reason: generatedText || fallback,
      generatedBy: 'watsonx.ai / IBM Granite' as const,
    };
  } catch {
    return { reason: fallback, generatedBy: 'Rule-based ranking' as const };
  }
};

const buildSkillBoostRecommendations = async (
  env: EnvMap,
  resources: TrendResource[],
): Promise<SkillBoostRecommendation[]> => {
  let iamToken: string | null = null;

  try {
    iamToken = await getIamToken(env);
  } catch {
    iamToken = null;
  }

  return Promise.all(
    resources.map(async (resource) => {
      const keywords = await extractNluKeywords(env, `${resource.title}. ${resource.description}`);
      const { reason, generatedBy } = await generateGraniteReason(env, iamToken, resource, keywords);
      const quest = mapRelatedQuest(resource);

      return {
        ...resource,
        nluKeywords: keywords,
        recommendationReason: reason,
        relatedQuestId: quest.relatedQuestId,
        relatedQuestTitle: quest.relatedQuestTitle,
        generatedBy,
      };
    }),
  );
};

const saveSkillBoostToCloudant = async (env: EnvMap, document: unknown) => {
  if (!env.CLOUDANT_URL) {
    throw new Error('CLOUDANT_URL is not configured');
  }

  const iamToken = await getIamToken(env);
  const databaseName = env.CLOUDANT_DB || 'codequest_skill_boosts';
  const documentId =
    typeof document === 'object' && document && 'id' in document
      ? normalizeId(String((document as { id: unknown }).id))
      : `skill-boost-${Date.now()}`;

  const databaseUrl = `${env.CLOUDANT_URL.replace(/\/$/, '')}/${encodeURIComponent(databaseName)}`;
  const createDatabase = await fetch(databaseUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${iamToken}`,
      Accept: 'application/json',
    },
  });

  if (!createDatabase.ok && createDatabase.status !== 412) {
    throw new Error(`Cloudant database create failed with HTTP ${createDatabase.status}`);
  }

  const response = await fetch(`${databaseUrl}/${encodeURIComponent(documentId)}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${iamToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      ...(typeof document === 'object' && document ? document : { value: document }),
      type: 'skill_boost_recommendation',
      savedAt: new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    throw new Error(`Cloudant save failed with HTTP ${response.status}`);
  }

  return response.json();
};

const parseGithubRepoUrl = (value: string) => {
  try {
    const url = new URL(value);
    if (url.hostname !== 'github.com') {
      throw new Error('Only github.com repository URLs are supported.');
    }

    const [owner, repo] = url.pathname.replace(/^\/|\/$/g, '').split('/');
    if (!owner || !repo) {
      throw new Error('GitHub repository URL must include owner and repo.');
    }

    return { owner, repo: repo.replace(/\.git$/, '') };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Invalid GitHub repository URL.', { cause: error });
  }
};

const githubHeaders = (env: EnvMap) => ({
  Accept: 'application/vnd.github+json',
  'User-Agent': 'CodeQuest-Bob-Hackathon',
  ...(env.GITHUB_TOKEN ? { Authorization: `Bearer ${env.GITHUB_TOKEN}` } : {}),
});

const toLanguagePercentages = (languages: Record<string, number>) => {
  const total = Object.values(languages).reduce((sum, value) => sum + value, 0);
  if (total === 0) return {};

  return Object.fromEntries(
    Object.entries(languages)
      .sort(([, left], [, right]) => right - left)
      .slice(0, 6)
      .map(([language, bytes]) => [language, Math.round((bytes / total) * 100)]),
  );
};

const inferEntryPoints = (items: GithubRepoSummary['rootFiles']) => {
  const names = new Set(items.map((item) => item.name));
  const preferred = ['README.md', 'package.json', 'src', 'app', 'pages', 'vite.config.ts', 'next.config.js'];
  return preferred.filter((item) => names.has(item)).slice(0, 5);
};

const inferKeyDirectories = (items: GithubRepoSummary['rootFiles']) => {
  const preferred = ['src', 'app', 'components', 'pages', 'packages', 'docs', 'tests', 'public'];
  const directories = new Set(items.filter((item) => item.type === 'dir').map((item) => item.name));
  return preferred.filter((directory) => directories.has(directory)).slice(0, 5);
};

const fetchGithubRepoSummary = async (env: EnvMap, repoUrl: string): Promise<GithubRepoSummary> => {
  const { owner, repo } = parseGithubRepoUrl(repoUrl);
  const apiBase = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
  const headers = githubHeaders(env);

  const [repoResponse, languagesResponse, contentsResponse] = await Promise.all([
    fetch(apiBase, { headers }),
    fetch(`${apiBase}/languages`, { headers }),
    fetch(`${apiBase}/contents`, { headers }),
  ]);

  if (!repoResponse.ok) {
    throw new Error(`GitHub repository lookup failed with HTTP ${repoResponse.status}`);
  }

  const repoPayload = (await repoResponse.json()) as {
    full_name: string;
    html_url: string;
    description?: string;
    default_branch: string;
    stargazers_count: number;
    forks_count: number;
    open_issues_count: number;
    updated_at: string;
  };

  const languagePayload = languagesResponse.ok
    ? ((await languagesResponse.json()) as Record<string, number>)
    : {};

  const contentsPayload = contentsResponse.ok
    ? ((await contentsResponse.json()) as Array<{ name: string; type: 'file' | 'dir'; path: string }>)
    : [];

  const rootFiles = contentsPayload
    .filter((item) => item.type === 'file' || item.type === 'dir')
    .slice(0, 16)
    .map((item) => ({ name: item.name, type: item.type, path: item.path }));

  return {
    repoName: repoPayload.full_name,
    repoUrl: repoPayload.html_url,
    description: truncate(repoPayload.description, 180),
    defaultBranch: repoPayload.default_branch,
    stars: repoPayload.stargazers_count,
    forks: repoPayload.forks_count,
    openIssues: repoPayload.open_issues_count,
    updatedAt: repoPayload.updated_at,
    languages: toLanguagePercentages(languagePayload),
    rootFiles,
    entryPoints: inferEntryPoints(rootFiles),
    keyDirectories: inferKeyDirectories(rootFiles),
  };
};

const ibmRuntimePlugin = (): Plugin => {
  return {
    name: 'codequest-bob-ibm-runtime',
    configureServer(server) {
      const env = loadEnv(server.config.mode, process.cwd(), '');

      server.middlewares.use('/api/ibm/status', async (req, res, next) => {
        if (req.method !== 'GET') {
          next();
          return;
        }

        const startedAt = Date.now();

        try {
          const iamToken = await getIamToken(env);
          const [watsonxResult, nluResult, speechResults] = await Promise.all([
            checkWatsonx(env, iamToken),
            checkNlu(env),
            checkTtsAndStt(env),
          ]);
          const services = [watsonxResult, nluResult, ...speechResults];

          jsonResponse(res, 200, {
            mode: 'live',
            checkedAt: new Date().toISOString(),
            totalLatencyMs: Date.now() - startedAt,
            services,
          });
        } catch {
          jsonResponse(res, 200, {
            mode: 'unavailable',
            checkedAt: new Date().toISOString(),
            totalLatencyMs: Date.now() - startedAt,
            services: [
              {
                id: 'ibm-cloud',
                name: 'IBM Cloud IAM',
                status: 'failed',
                detail: 'IBM service verification could not complete in this runtime.',
              },
            ],
          });
        }
      });

      server.middlewares.use('/api/github/repo-scan', async (req, res, next) => {
        if (req.method !== 'GET') {
          next();
          return;
        }

        try {
          const requestUrl = new URL(req.url || '/', 'http://localhost');
          const repoUrl = requestUrl.searchParams.get('repoUrl');

          if (!repoUrl) {
            jsonResponse(res, 400, {
              mode: 'invalid',
              detail: 'repoUrl query parameter is required.',
            });
            return;
          }

          const summary = await fetchGithubRepoSummary(env, repoUrl);
          jsonResponse(res, 200, {
            mode: 'live',
            checkedAt: new Date().toISOString(),
            summary,
          });
        } catch (error) {
          jsonResponse(res, 200, {
            mode: 'unavailable',
            checkedAt: new Date().toISOString(),
            detail: error instanceof Error ? error.message : 'GitHub repository scan could not complete.',
          });
        }
      });

      server.middlewares.use('/api/ibm/briefing', async (req, res, next) => {
        if (req.method !== 'POST') {
          next();
          return;
        }

        const startedAt = Date.now();

        try {
          const briefingRequest = await readRequestJson<BobBriefingRequest>(req);
          const briefingText = buildBriefingText(briefingRequest);
          const audio = await synthesizeSpeech(env, briefingText);
          const transcript = await recognizeSpeech(env, audio);

          jsonResponse(res, 200, {
            mode: 'live',
            checkedAt: new Date().toISOString(),
            totalLatencyMs: Date.now() - startedAt,
            briefingText,
            transcript,
            audioDataUrl: `data:audio/wav;base64,${audio.toString('base64')}`,
            sources: ['IBM Text to Speech', 'IBM Speech to Text'],
          });
        } catch {
          jsonResponse(res, 200, {
            mode: 'unavailable',
            checkedAt: new Date().toISOString(),
            totalLatencyMs: Date.now() - startedAt,
            briefingText: '',
            transcript: '',
            audioDataUrl: '',
            sources: [],
          });
        }
      });

      server.middlewares.use('/api/resources/trends', async (req, res, next) => {
        if (req.method !== 'GET') {
          next();
          return;
        }

        try {
          const [githubResources, huggingFaceResources] = await Promise.all([
            fetchGithubTrendResources(env, 5),
            fetchHuggingFaceTrendResources(5),
          ]);

          jsonResponse(res, 200, {
            checkedAt: new Date().toISOString(),
            resources: [...githubResources, ...huggingFaceResources],
          });
        } catch {
          jsonResponse(res, 200, {
            checkedAt: new Date().toISOString(),
            resources: [],
            error: 'Trend resources could not be refreshed.',
          });
        }
      });

      server.middlewares.use('/api/ibm/skill-boosts', async (req, res, next) => {
        if (req.method !== 'GET') {
          next();
          return;
        }

        const startedAt = Date.now();

        try {
          const [githubResources, huggingFaceResources] = await Promise.all([
            fetchGithubTrendResources(env, 3),
            fetchHuggingFaceTrendResources(3),
          ]);
          const resources = [...githubResources, ...huggingFaceResources];
          const recommendations = await buildSkillBoostRecommendations(env, resources);

          jsonResponse(res, 200, {
            mode: 'live',
            checkedAt: new Date().toISOString(),
            totalLatencyMs: Date.now() - startedAt,
            sources: ['GitHub Search API', 'Hugging Face Hub API', 'Watson NLU', 'watsonx.ai / IBM Granite'],
            recommendations,
          });
        } catch {
          jsonResponse(res, 200, {
            mode: 'unavailable',
            checkedAt: new Date().toISOString(),
            totalLatencyMs: Date.now() - startedAt,
            sources: ['Rule-based ranking'],
            recommendations: [],
            error: 'Live ecosystem radar could not complete.',
          });
        }
      });

      server.middlewares.use('/api/cloudant/skill-boosts', async (req, res, next) => {
        if (req.method !== 'POST') {
          next();
          return;
        }

        try {
          const document = await readRequestJson(req);
          const result = await saveSkillBoostToCloudant(env, document);

          jsonResponse(res, 200, {
            mode: 'live',
            checkedAt: new Date().toISOString(),
            result,
          });
        } catch {
          jsonResponse(res, 200, {
            mode: 'unavailable',
            checkedAt: new Date().toISOString(),
            detail: 'IBM service log save is currently skipped.',
          });
        }
      });
    },
  };
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), ibmRuntimePlugin()],
})
