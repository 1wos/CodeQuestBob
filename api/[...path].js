const json = (response, statusCode, body) => {
  response.status(statusCode).json(body);
};

const basicAuth = (apiKey) => {
  return `Basic ${Buffer.from(`apikey:${apiKey}`).toString('base64')}`;
};

const timed = async (task) => {
  const startedAt = Date.now();
  const value = await task();
  return { value, latencyMs: Date.now() - startedAt };
};

const normalizeId = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const truncate = (value, maxLength = 220) => {
  if (!value) return 'No description provided.';
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}...` : value;
};

const env = () => process.env;

const getIamToken = async () => {
  const runtimeEnv = env();
  if (!runtimeEnv.IBM_CLOUD_API_KEY) {
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
      apikey: runtimeEnv.IBM_CLOUD_API_KEY,
    }),
  });

  if (!response.ok) {
    throw new Error(`IAM token request failed with HTTP ${response.status}`);
  }

  const payload = await response.json();
  if (!payload.access_token) {
    throw new Error('IAM token response did not include access_token');
  }

  return payload.access_token;
};

const fallbackKeywords = (text) => {
  const stopWords = new Set(['the', 'and', 'for', 'with', 'from', 'that', 'this', 'your', 'into', 'code', 'using']);

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

const checkWatsonx = async (iamToken) => {
  const runtimeEnv = env();
  if (
    !runtimeEnv.WATSONX_URL ||
    !runtimeEnv.WATSONX_MODEL_ID ||
    (!runtimeEnv.WATSONX_PROJECT_ID && !runtimeEnv.WATSONX_SPACE_ID)
  ) {
    return {
      id: 'watsonx-ai',
      name: 'watsonx.ai / IBM Granite',
      status: 'missing',
      detail: 'Missing watsonx URL, model ID, project ID, or deployment space ID.',
    };
  }

  try {
    const { value, latencyMs } = await timed(async () => {
      const response = await fetch(`${runtimeEnv.WATSONX_URL}/ml/v1/text/generation?version=2023-05-29`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${iamToken}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          model_id: runtimeEnv.WATSONX_MODEL_ID,
          input: 'Return only this exact phrase: CodeQuest ready',
          parameters: {
            max_new_tokens: 12,
            temperature: 0,
          },
          ...(runtimeEnv.WATSONX_PROJECT_ID
            ? { project_id: runtimeEnv.WATSONX_PROJECT_ID }
            : { space_id: runtimeEnv.WATSONX_SPACE_ID }),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      await response.json();
      return runtimeEnv.WATSONX_MODEL_ID;
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

const checkNlu = async () => {
  const runtimeEnv = env();
  if (!runtimeEnv.NLU_URL || !runtimeEnv.NLU_API_KEY) {
    return {
      id: 'nlu',
      name: 'Natural Language Understanding',
      status: 'missing',
      detail: 'Missing NLU URL or API key.',
    };
  }

  try {
    const { value, latencyMs } = await timed(async () => {
      const response = await fetch(`${runtimeEnv.NLU_URL}/v1/analyze?version=${runtimeEnv.NLU_VERSION || '2022-04-07'}`, {
        method: 'POST',
        headers: {
          Authorization: basicAuth(runtimeEnv.NLU_API_KEY),
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

      const payload = await response.json();
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

const synthesizeSpeech = async (text = 'Code Quest Bob is ready.') => {
  const runtimeEnv = env();
  if (!runtimeEnv.TTS_URL || !runtimeEnv.TTS_API_KEY) {
    throw new Error('Missing TTS URL or API key');
  }

  const response = await fetch(
    `${runtimeEnv.TTS_URL}/v1/synthesize?voice=${encodeURIComponent(runtimeEnv.TTS_VOICE || 'en-US_AllisonV3Voice')}`,
    {
      method: 'POST',
      headers: {
        Authorization: basicAuth(runtimeEnv.TTS_API_KEY),
        'Content-Type': 'application/json',
        Accept: 'audio/wav',
      },
      body: JSON.stringify({ text }),
    },
  );

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return Buffer.from(await response.arrayBuffer());
};

const recognizeSpeech = async (audio) => {
  const runtimeEnv = env();
  if (!runtimeEnv.STT_URL || !runtimeEnv.STT_API_KEY) {
    throw new Error('Missing STT URL or API key');
  }

  const response = await fetch(
    `${runtimeEnv.STT_URL}/v1/recognize?model=${encodeURIComponent(runtimeEnv.STT_MODEL || 'en-US_BroadbandModel')}`,
    {
      method: 'POST',
      headers: {
        Authorization: basicAuth(runtimeEnv.STT_API_KEY),
        'Content-Type': 'audio/wav',
        Accept: 'application/json',
      },
      body: audio,
    },
  );

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const payload = await response.json();
  return payload.results?.[0]?.alternatives?.[0]?.transcript?.trim() || 'speech recognized';
};

const buildBriefingText = (request) => {
  const title = request.title?.trim() || 'CodeQuest Bob quest';
  const subtitle = request.subtitle?.trim() || 'repository onboarding workflow';
  const objectives = (request.objectives || []).filter(Boolean).slice(0, 4);
  const objectiveText = objectives.length > 0
    ? ` Focus on ${objectives.map((objective, index) => `step ${index + 1}: ${objective}`).join('. ')}.`
    : '';

  return `CodeQuest Bob briefing. You are starting ${title}. ${subtitle}. This quest turns repository context into measurable contributor progress.${objectiveText} When you finish, save your progress in your developer passport.`;
};

const checkTtsAndStt = async () => {
  const runtimeEnv = env();
  const results = [];

  if (!runtimeEnv.TTS_URL || !runtimeEnv.TTS_API_KEY) {
    results.push({
      id: 'tts',
      name: 'Text to Speech',
      status: 'missing',
      detail: 'Missing TTS URL or API key.',
    });
  } else {
    try {
      const { value, latencyMs } = await timed(() => synthesizeSpeech());
      results.push({
        id: 'tts',
        name: 'Text to Speech',
        status: 'live',
        detail: `Generated ${Math.round(value.byteLength / 1024)} KB WAV briefing.`,
        latencyMs,
      });

      if (!runtimeEnv.STT_URL || !runtimeEnv.STT_API_KEY) {
        results.push({
          id: 'stt',
          name: 'Speech to Text',
          status: 'configured',
          detail: 'Credentials expected, but STT URL or key is missing.',
        });
      } else {
        try {
          const { value: transcript, latencyMs: sttLatencyMs } = await timed(() => recognizeSpeech(value));
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
        status: runtimeEnv.STT_URL && runtimeEnv.STT_API_KEY ? 'configured' : 'missing',
        detail: 'STT check requires successful TTS audio generation.',
      });
    }
  }

  return results;
};

const fetchGithubTrendResources = async (limit) => {
  const runtimeEnv = env();
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
          ...(runtimeEnv.GITHUB_TOKEN ? { Authorization: `Bearer ${runtimeEnv.GITHUB_TOKEN}` } : {}),
        },
      },
    );

    if (!response.ok) continue;

    const payload = await response.json();
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

const fetchHuggingFaceTrendResources = async (limit) => {
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

  const payload = await response.json();

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

const extractNluKeywords = async (text) => {
  const runtimeEnv = env();
  if (!runtimeEnv.NLU_URL || !runtimeEnv.NLU_API_KEY) {
    return fallbackKeywords(text);
  }

  try {
    const response = await fetch(`${runtimeEnv.NLU_URL}/v1/analyze?version=${runtimeEnv.NLU_VERSION || '2022-04-07'}`, {
      method: 'POST',
      headers: {
        Authorization: basicAuth(runtimeEnv.NLU_API_KEY),
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

    const payload = await response.json();
    return payload.keywords?.map((keyword) => keyword.text).filter(Boolean).slice(0, 5) || fallbackKeywords(text);
  } catch {
    return fallbackKeywords(text);
  }
};

const mapRelatedQuest = (resource) => {
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

const cleanGeneratedReason = (value) => {
  if (!value) return '';

  const normalized = value.replace(/\s+/g, ' ').trim();
  const resourceSentenceIndex = normalized.indexOf('This resource');
  const cleaned = resourceSentenceIndex >= 0 ? normalized.slice(resourceSentenceIndex) : normalized;

  return cleaned.replace(/^[,.\s:-]+/, '').trim();
};

const generateGraniteReason = async (iamToken, resource, keywords) => {
  const runtimeEnv = env();
  const fallback = `Recommended for ${mapRelatedQuest(resource).relatedQuestTitle}: learn ${keywords.slice(0, 3).join(', ') || resource.source} patterns that strengthen repository onboarding.`;

  if (
    !iamToken ||
    !runtimeEnv.WATSONX_URL ||
    !runtimeEnv.WATSONX_MODEL_ID ||
    (!runtimeEnv.WATSONX_PROJECT_ID && !runtimeEnv.WATSONX_SPACE_ID)
  ) {
    return { reason: fallback, generatedBy: 'Rule-based ranking' };
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

    const response = await fetch(`${runtimeEnv.WATSONX_URL}/ml/v1/text/generation?version=2023-05-29`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${iamToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        model_id: runtimeEnv.WATSONX_MODEL_ID,
        input: prompt,
        parameters: {
          max_new_tokens: 56,
          temperature: 0.2,
        },
        ...(runtimeEnv.WATSONX_PROJECT_ID
          ? { project_id: runtimeEnv.WATSONX_PROJECT_ID }
          : { space_id: runtimeEnv.WATSONX_SPACE_ID }),
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const payload = await response.json();
    const generatedText = cleanGeneratedReason(payload.results?.[0]?.generated_text);
    return {
      reason: generatedText || fallback,
      generatedBy: 'watsonx.ai / IBM Granite',
    };
  } catch {
    return { reason: fallback, generatedBy: 'Rule-based ranking' };
  }
};

const buildSkillBoostRecommendations = async (resources) => {
  let iamToken = null;

  try {
    iamToken = await getIamToken();
  } catch {
    iamToken = null;
  }

  return Promise.all(
    resources.map(async (resource) => {
      const keywords = await extractNluKeywords(`${resource.title}. ${resource.description}`);
      const { reason, generatedBy } = await generateGraniteReason(iamToken, resource, keywords);
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

const saveSkillBoostToCloudant = async (document) => {
  const runtimeEnv = env();
  if (!runtimeEnv.CLOUDANT_URL) {
    throw new Error('CLOUDANT_URL is not configured');
  }

  const iamToken = await getIamToken();
  const databaseName = runtimeEnv.CLOUDANT_DB || 'codequest_skill_boosts';
  const documentId =
    typeof document === 'object' && document && 'id' in document
      ? normalizeId(String(document.id))
      : `skill-boost-${Date.now()}`;

  const databaseUrl = `${runtimeEnv.CLOUDANT_URL.replace(/\/$/, '')}/${encodeURIComponent(databaseName)}`;
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

const parseGithubRepoUrl = (value) => {
  const url = new URL(value);
  if (url.hostname !== 'github.com') {
    throw new Error('Only github.com repository URLs are supported.');
  }

  const [owner, repo] = url.pathname.replace(/^\/|\/$/g, '').split('/');
  if (!owner || !repo) {
    throw new Error('GitHub repository URL must include owner and repo.');
  }

  return { owner, repo: repo.replace(/\.git$/, '') };
};

const toLanguagePercentages = (languages) => {
  const total = Object.values(languages).reduce((sum, value) => sum + value, 0);
  if (total === 0) return {};

  return Object.fromEntries(
    Object.entries(languages)
      .sort(([, left], [, right]) => right - left)
      .slice(0, 6)
      .map(([language, bytes]) => [language, Math.round((bytes / total) * 100)]),
  );
};

const inferEntryPoints = (items) => {
  const names = new Set(items.map((item) => item.name));
  const preferred = ['README.md', 'package.json', 'src', 'app', 'pages', 'vite.config.ts', 'next.config.js'];
  return preferred.filter((item) => names.has(item)).slice(0, 5);
};

const inferKeyDirectories = (items) => {
  const preferred = ['src', 'app', 'components', 'pages', 'packages', 'docs', 'tests', 'public'];
  const directories = new Set(items.filter((item) => item.type === 'dir').map((item) => item.name));
  return preferred.filter((directory) => directories.has(directory)).slice(0, 5);
};

const githubHeaders = () => {
  const runtimeEnv = env();

  return {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'CodeQuest-Bob-Hackathon',
    ...(runtimeEnv.GITHUB_TOKEN ? { Authorization: `Bearer ${runtimeEnv.GITHUB_TOKEN}` } : {}),
  };
};

const fetchGithubRepoSummary = async (repoUrl) => {
  const { owner, repo } = parseGithubRepoUrl(repoUrl);
  const apiBase = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
  const headers = githubHeaders();

  const [repoResponse, languagesResponse, contentsResponse] = await Promise.all([
    fetch(apiBase, { headers }),
    fetch(`${apiBase}/languages`, { headers }),
    fetch(`${apiBase}/contents`, { headers }),
  ]);

  if (!repoResponse.ok) {
    throw new Error(`GitHub repository lookup failed with HTTP ${repoResponse.status}`);
  }

  const repoPayload = await repoResponse.json();
  const languagePayload = languagesResponse.ok ? await languagesResponse.json() : {};
  const contentsPayload = contentsResponse.ok ? await contentsResponse.json() : [];
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

const handlers = {
  'GET /api/ibm/status': async (request, response) => {
    const startedAt = Date.now();

    try {
      const iamToken = await getIamToken();
      const [watsonxResult, nluResult, speechResults] = await Promise.all([
        checkWatsonx(iamToken),
        checkNlu(),
        checkTtsAndStt(),
      ]);

      json(response, 200, {
        mode: 'live',
        checkedAt: new Date().toISOString(),
        totalLatencyMs: Date.now() - startedAt,
        services: [watsonxResult, nluResult, ...speechResults],
      });
    } catch {
      json(response, 200, {
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
  },
  'GET /api/github/repo-scan': async (request, response) => {
    try {
      const repoUrl = request.query.repoUrl;

      if (!repoUrl || Array.isArray(repoUrl)) {
        json(response, 400, {
          mode: 'invalid',
          detail: 'repoUrl query parameter is required.',
        });
        return;
      }

      const summary = await fetchGithubRepoSummary(repoUrl);
      json(response, 200, {
        mode: 'live',
        checkedAt: new Date().toISOString(),
        summary,
      });
    } catch (error) {
      json(response, 200, {
        mode: 'unavailable',
        checkedAt: new Date().toISOString(),
        detail: error instanceof Error ? error.message : 'GitHub repository scan could not complete.',
      });
    }
  },
  'POST /api/ibm/briefing': async (request, response) => {
    const startedAt = Date.now();

    try {
      const briefingText = buildBriefingText(request.body || {});
      const audio = await synthesizeSpeech(briefingText);
      const transcript = await recognizeSpeech(audio);

      json(response, 200, {
        mode: 'live',
        checkedAt: new Date().toISOString(),
        totalLatencyMs: Date.now() - startedAt,
        briefingText,
        transcript,
        audioDataUrl: `data:audio/wav;base64,${audio.toString('base64')}`,
        sources: ['IBM Text to Speech', 'IBM Speech to Text'],
      });
    } catch {
      json(response, 200, {
        mode: 'unavailable',
        checkedAt: new Date().toISOString(),
        totalLatencyMs: Date.now() - startedAt,
        briefingText: '',
        transcript: '',
        audioDataUrl: '',
        sources: [],
      });
    }
  },
  'GET /api/resources/trends': async (request, response) => {
    try {
      const [githubResources, huggingFaceResources] = await Promise.all([
        fetchGithubTrendResources(5),
        fetchHuggingFaceTrendResources(5),
      ]);

      json(response, 200, {
        checkedAt: new Date().toISOString(),
        resources: [...githubResources, ...huggingFaceResources],
      });
    } catch {
      json(response, 200, {
        checkedAt: new Date().toISOString(),
        resources: [],
        error: 'Trend resources could not be refreshed.',
      });
    }
  },
  'GET /api/ibm/skill-boosts': async (request, response) => {
    const startedAt = Date.now();

    try {
      const [githubResources, huggingFaceResources] = await Promise.all([
        fetchGithubTrendResources(3),
        fetchHuggingFaceTrendResources(3),
      ]);
      const recommendations = await buildSkillBoostRecommendations([...githubResources, ...huggingFaceResources]);

      json(response, 200, {
        mode: 'live',
        checkedAt: new Date().toISOString(),
        totalLatencyMs: Date.now() - startedAt,
        sources: ['GitHub Search API', 'Hugging Face Hub API', 'Watson NLU', 'watsonx.ai / IBM Granite'],
        recommendations,
      });
    } catch {
      json(response, 200, {
        mode: 'unavailable',
        checkedAt: new Date().toISOString(),
        totalLatencyMs: Date.now() - startedAt,
        sources: ['Rule-based ranking'],
        recommendations: [],
        error: 'Live ecosystem radar could not complete.',
      });
    }
  },
  'POST /api/cloudant/skill-boosts': async (request, response) => {
    try {
      const result = await saveSkillBoostToCloudant(request.body || {});

      json(response, 200, {
        mode: 'live',
        checkedAt: new Date().toISOString(),
        result,
      });
    } catch {
      json(response, 200, {
        mode: 'unavailable',
        checkedAt: new Date().toISOString(),
        detail: 'IBM service log save is currently skipped.',
      });
    }
  },
};

export default async function handler(request, response) {
  const path = request.url?.split('?')[0] || '';
  const key = `${request.method} ${path}`;
  const routeHandler = handlers[key];

  if (!routeHandler) {
    json(response, 404, {
      mode: 'missing',
      detail: `No CodeQuest Bob API handler for ${key}.`,
    });
    return;
  }

  await routeHandler(request, response);
}
