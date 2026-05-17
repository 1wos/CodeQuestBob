import {
  ArrowUpRight,
  Bookmark,
  BookOpen,
  Clock3,
  Gauge,
  Lightbulb,
  Target,
} from 'lucide-react';
import './SkillBoostRadar.css';

export type SkillBoostResourceType = 'course' | 'lab' | 'guide' | 'video' | 'practice';

export type SkillBoostResource = {
  id: string;
  title: string;
  provider: string;
  type: SkillBoostResourceType;
  skillArea: string;
  difficulty: 'Foundational' | 'Intermediate' | 'Advanced';
  estimatedTime: string;
  relevanceScore: number;
  reason: string;
  href?: string;
  isSaved?: boolean;
};

export type SkillBoostRadarProps = {
  resources?: SkillBoostResource[];
  title?: string;
  subtitle?: string;
  focusSkill?: string;
  emptyText?: string;
  onSaveResource?: (resource: SkillBoostResource) => void;
  onOpenResource?: (resource: SkillBoostResource) => void;
};

const fallbackResources: SkillBoostResource[] = [
  {
    id: 'watsonx-prompt-lab',
    title: 'Build Reliable Prompt Workflows with watsonx.ai',
    provider: 'IBM SkillsBuild',
    type: 'lab',
    skillArea: 'AI Engineering',
    difficulty: 'Intermediate',
    estimatedTime: '45 min',
    relevanceScore: 94,
    reason: 'Maps to repository findings around prompt structure, safety review, and repeatable evaluation.',
    href: 'https://skillsbuild.org/',
  },
  {
    id: 'cloud-native-observability',
    title: 'Cloud Native Observability Essentials',
    provider: 'IBM Cloud',
    type: 'guide',
    skillArea: 'Operations',
    difficulty: 'Foundational',
    estimatedTime: '30 min',
    relevanceScore: 88,
    reason: 'Supports the next milestone for deployability, tracing, and service readiness.',
  },
  {
    id: 'secure-api-integration',
    title: 'Secure API Integration Patterns',
    provider: 'IBM Developer',
    type: 'course',
    skillArea: 'Security',
    difficulty: 'Intermediate',
    estimatedTime: '1 hr',
    relevanceScore: 82,
    reason: 'Relevant for protecting credentials, handling proxy failures, and documenting integration controls.',
  },
];

const typeLabels: Record<SkillBoostResourceType, string> = {
  course: 'Course',
  lab: 'Lab',
  guide: 'Guide',
  video: 'Video',
  practice: 'Practice',
};

const getDifficultyClassName = (difficulty: SkillBoostResource['difficulty']) =>
  difficulty.toLowerCase();

export function SkillBoostRadar({
  resources = fallbackResources,
  title = 'Skill Boost Radar',
  subtitle = 'Recommended learning resources ranked by repository context and growth quest alignment.',
  focusSkill = 'AI delivery readiness',
  emptyText = 'No resources loaded yet. Run the live radar to fetch GitHub and Hugging Face signals.',
  onSaveResource,
  onOpenResource,
}: SkillBoostRadarProps) {
  const topScore = resources.length > 0 ? Math.max(...resources.map((resource) => resource.relevanceScore)) : 0;
  const resourceCountLabel = `${resources.length} ${resources.length === 1 ? 'resource' : 'resources'}`;

  const handleOpenResource = (resource: SkillBoostResource) => {
    if (onOpenResource) {
      onOpenResource(resource);
      return;
    }

    if (resource.href) {
      window.open(resource.href, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <section className="skill-boost-radar" aria-labelledby="skill-boost-radar-title">
      <div className="skill-boost-radar__header">
        <div className="skill-boost-radar__title-group">
          <div className="skill-boost-radar__icon" aria-hidden="true">
            <Gauge size={22} />
          </div>
          <div>
            <h2 id="skill-boost-radar-title">{title}</h2>
            <p>{subtitle}</p>
          </div>
        </div>
        <div className="skill-boost-radar__summary" aria-label="Skill boost summary">
          <span>{resourceCountLabel}</span>
          <strong>{topScore}% match</strong>
        </div>
      </div>

      <div className="skill-boost-radar__context" aria-label="Current development focus">
        <Target size={18} />
        <span>Focus area</span>
        <strong>{focusSkill}</strong>
      </div>

      <div className="skill-boost-radar__list">
        {resources.length === 0 ? (
          <div className="skill-boost-radar__empty">
            <Lightbulb size={18} aria-hidden="true" />
            <p>{emptyText}</p>
          </div>
        ) : resources.map((resource) => (
          <article className="skill-boost-radar__item" key={resource.id}>
            <div className="skill-boost-radar__score" aria-label={`${resource.relevanceScore}% match`}>
              <span>{resource.relevanceScore}</span>
              <small>%</small>
            </div>

            <div className="skill-boost-radar__details">
              <div className="skill-boost-radar__resource-header">
                <div>
                  <p className="skill-boost-radar__provider">{resource.provider}</p>
                  <h3>{resource.title}</h3>
                </div>
                <span className={`skill-boost-radar__difficulty ${getDifficultyClassName(resource.difficulty)}`}>
                  {resource.difficulty}
                </span>
              </div>

              <p className="skill-boost-radar__reason">
                <Lightbulb size={16} aria-hidden="true" />
                <span>{resource.reason}</span>
              </p>

              <div className="skill-boost-radar__meta" aria-label="Resource details">
                <span>
                  <BookOpen size={15} aria-hidden="true" />
                  {typeLabels[resource.type]}
                </span>
                <span>
                  <Target size={15} aria-hidden="true" />
                  {resource.skillArea}
                </span>
                <span>
                  <Clock3 size={15} aria-hidden="true" />
                  {resource.estimatedTime}
                </span>
              </div>
            </div>

            <div className="skill-boost-radar__actions">
              <button
                type="button"
                className="skill-boost-radar__icon-button"
                onClick={() => onSaveResource?.(resource)}
                disabled={!onSaveResource}
                aria-label={`Save ${resource.title}`}
                title={onSaveResource ? `Save ${resource.title}` : 'Save action not connected'}
              >
                <Bookmark size={18} fill={resource.isSaved ? 'currentColor' : 'none'} />
              </button>
              <button
                type="button"
                className="skill-boost-radar__open-button"
                onClick={() => handleOpenResource(resource)}
                disabled={!resource.href && !onOpenResource}
              >
                Open
                <ArrowUpRight size={16} aria-hidden="true" />
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
