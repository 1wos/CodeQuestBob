import { useEffect, useMemo, useState } from 'react';
import { RefreshCw, Server, ShieldCheck } from 'lucide-react';
import { useApp } from '../../app/useApp';
import type { SkillBoostResource as DomainSkillBoostResource } from '../../domain/types';
import { SkillBoostRadar, type SkillBoostResource as RadarResource } from './SkillBoostRadar';
import './SkillBoostRadar.css';

type SkillBoostApiResponse = {
  mode: 'live' | 'unavailable';
  checkedAt: string;
  totalLatencyMs: number;
  sources: string[];
  recommendations: DomainSkillBoostResource[];
  error?: string;
};

type CloudantSaveResponse = {
  mode: 'live' | 'unavailable';
  detail?: string;
};

type LiveSkillBoostRadarProps = {
  title?: string;
  subtitle?: string;
  focusSkill?: string;
};

const difficultyByQuest: Record<string, RadarResource['difficulty']> = {
  'quest-001': 'Foundational',
  'quest-002': 'Foundational',
  'quest-003': 'Intermediate',
  'quest-004': 'Advanced',
};

const typeBySource: Record<DomainSkillBoostResource['source'], RadarResource['type']> = {
  GitHub: 'practice',
  'Hugging Face': 'guide',
};

const toRadarResource = (
  resource: DomainSkillBoostResource,
  savedIds: Set<string>,
): RadarResource => ({
  id: resource.id,
  title: resource.title,
  provider: `${resource.source} · ${resource.generatedBy}`,
  type: typeBySource[resource.source],
  skillArea: resource.relatedQuestTitle,
  difficulty: difficultyByQuest[resource.relatedQuestId] || 'Intermediate',
  estimatedTime: resource.source === 'GitHub' ? '20 min' : '30 min',
  relevanceScore: resource.generatedBy === 'watsonx.ai / IBM Granite' ? 92 : 78,
  reason: resource.recommendationReason,
  href: resource.url,
  isSaved: savedIds.has(resource.id),
});

export function LiveSkillBoostRadar({
  title = 'Skill Boost Radar',
  subtitle = 'Live GitHub and Hugging Face signals converted into growth recommendations by IBM NLU and Granite.',
  focusSkill = 'Repository onboarding and first PR readiness',
}: LiveSkillBoostRadarProps) {
  const { saveRadarBoost, savedRadarBoosts } = useApp();
  const [apiResponse, setApiResponse] = useState<SkillBoostApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState('Loading learning recommendations...');
  const [cloudantMessage, setCloudantMessage] = useState<string | null>(null);

  const savedIds = useMemo(
    () => new Set(savedRadarBoosts.map((resource) => resource.id)),
    [savedRadarBoosts],
  );

  const radarResources = useMemo(
    () => apiResponse?.recommendations.map((resource) => toRadarResource(resource, savedIds)) || [],
    [apiResponse, savedIds],
  );

  const fetchRecommendations = async () => {
    const response = await fetch('/api/ibm/skill-boosts');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return (await response.json()) as SkillBoostApiResponse;
  };

  const loadRecommendations = async () => {
    setIsLoading(true);
    setCloudantMessage(null);
    setStatusMessage('Refreshing GitHub and Hugging Face learning signals...');

    try {
      const payload = await fetchRecommendations();
      setApiResponse(payload);
      setStatusMessage(
        payload.mode === 'live'
          ? `Recommendations refreshed in ${payload.totalLatencyMs} ms.`
          : payload.error || 'Live recommendations are not available right now.',
      );
    } catch {
      setStatusMessage('Live recommendations are not available right now. You can continue with saved guidance.');
      setApiResponse({
        mode: 'unavailable',
        checkedAt: new Date().toISOString(),
        totalLatencyMs: 0,
        sources: ['Rule-based ranking'],
        recommendations: [],
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadInitialRecommendations = async () => {
      try {
        const payload = await fetchRecommendations();
        if (!isMounted) return;
        setApiResponse(payload);
        setStatusMessage(
          payload.mode === 'live'
            ? `Recommendations refreshed in ${payload.totalLatencyMs} ms.`
            : payload.error || 'Live recommendations are not available right now.',
        );
      } catch {
        if (!isMounted) return;
        setStatusMessage('Live recommendations are not available right now. You can continue with saved guidance.');
        setApiResponse({
          mode: 'unavailable',
          checkedAt: new Date().toISOString(),
          totalLatencyMs: 0,
          sources: ['Rule-based ranking'],
          recommendations: [],
        });
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadInitialRecommendations();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSaveResource = async (radarResource: RadarResource) => {
    const sourceResource = apiResponse?.recommendations.find(
      (resource) => resource.id === radarResource.id,
    );

    if (!sourceResource) return;

    saveRadarBoost(sourceResource);
    setCloudantMessage('Saved to Developer Passport.');

    try {
      const response = await fetch('/api/cloudant/skill-boosts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sourceResource),
      });
      const payload = (await response.json()) as CloudantSaveResponse;
      setCloudantMessage(
        payload.mode === 'live'
          ? 'Saved to Developer Passport and IBM service log.'
          : 'Saved to Developer Passport.',
      );
    } catch {
      setCloudantMessage('Saved to Developer Passport.');
    }
  };

  return (
    <div className="live-skill-boost-radar">
      <div className="live-skill-boost-radar__toolbar">
        <div className="live-skill-boost-radar__status" role="status" aria-live="polite">
          <Server size={16} aria-hidden="true" />
          <span>{statusMessage}</span>
        </div>
        <button
          type="button"
          className="live-skill-boost-radar__refresh"
          onClick={loadRecommendations}
          disabled={isLoading}
        >
          <RefreshCw size={16} aria-hidden="true" />
          {isLoading ? 'Running radar' : 'Refresh live radar'}
        </button>
      </div>

      <SkillBoostRadar
        title={title}
        subtitle={subtitle}
        focusSkill={focusSkill}
        resources={radarResources}
        onSaveResource={handleSaveResource}
      />

      {apiResponse && (
        <div className="live-skill-boost-radar__source-note">
          <ShieldCheck size={16} aria-hidden="true" />
          <span>
            Sources: {apiResponse.sources.join(' · ')} · Checked{' '}
            {new Date(apiResponse.checkedAt).toLocaleTimeString()}
          </span>
        </div>
      )}

      {cloudantMessage && (
        <div className="live-skill-boost-radar__cloudant" role="status" aria-live="polite">
          {cloudantMessage}
        </div>
      )}
    </div>
  );
}
