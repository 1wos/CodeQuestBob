import { lazy, Suspense } from 'react';
import { useApp } from '../app/useApp';
import { Bot, GitPullRequest, Map, Target, Wrench } from 'lucide-react';
import { InfoPopover } from '../components/ui/InfoPopover';
import './QuestMap.css';

const RepositoryOrbitMap = lazy(() =>
  import('../components/three').then((module) => ({ default: module.RepositoryOrbitMap })),
);

const repoDistricts = [
  { label: 'Setup runway', signal: 'Environment readiness', note: 'Install, run, and validate the baseline' },
  { label: 'Product flow', signal: 'Contributor journey', note: 'Move from repo intake to guided quests' },
  { label: 'Learning radar', signal: 'Skill recommendations', note: 'Turn live trends into focused boosts' },
  { label: 'IBM service hub', signal: 'IBM service support', note: 'Keeps model, language, and speech services visible without exposing internals' },
];

export function QuestMap() {
  const { quests, selectQuest, isQuestCompleted } = useApp();
  const completedQuestIds = quests
    .filter((quest) => isQuestCompleted(quest.id))
    .map((quest) => quest.id);

  const questIconMap = {
    map: Map,
    wrench: Wrench,
    target: Target,
    'git-pull-request': GitPullRequest,
  };

  const getIcon = (iconName: string) => {
    const IconComponent = questIconMap[iconName as keyof typeof questIconMap] ?? Map;
    return <IconComponent size={48} />;
  };

  return (
    <div className="quest-map-screen">
      <div className="quest-map-header">
        <h1>Growth Quest Map</h1>
        <p>Setup → Explore → Improve → First PR, guided by IBM Bob repository context.</p>
      </div>

      <div className="quest-map-content">
        <Suspense
          fallback={
            <div className="repository-orbit-loading" role="status">
              Loading interactive repository map
            </div>
          }
        >
          <RepositoryOrbitMap
            quests={quests}
            completedQuestIds={completedQuestIds}
            onSelectQuest={selectQuest}
          />
        </Suspense>

        <div className="quest-path" aria-label="CodeQuest Bob onboarding quest path">
          {quests.map((quest, index) => (
            <div key={quest.id} className="quest-node">
              {isQuestCompleted(quest.id) && <div className="quest-completed-label">Completed</div>}
              <button
                type="button"
                className={`quest-card level-${quest.level} ${
                  isQuestCompleted(quest.id) ? 'completed' : ''
                }`}
                aria-label={`${quest.title}, Level ${quest.level}, ${quest.difficulty}, ${quest.xpReward} XP`}
                onClick={() => selectQuest(quest.id)}
                style={{ borderColor: quest.color }}
              >
                <div className="quest-card-topline">
                  <InfoPopover
                    label="Quest Level"
                    description="Represents the progression stage in your onboarding journey"
                  >
                    <span className="quest-level">Level {quest.level}</span>
                  </InfoPopover>
                  <InfoPopover
                    label="Quest Difficulty"
                    description="Estimated complexity based on repository analysis and required skills"
                  >
                    <span className="quest-difficulty">{quest.difficulty}</span>
                  </InfoPopover>
                </div>
                <div className="quest-card-visual">
                  <div className="quest-icon">{getIcon(quest.badge.icon)}</div>
                  <span className="quest-stage-number">{String(index + 1).padStart(2, '0')}</span>
                </div>
                <h3 className="quest-title">{quest.title}</h3>
                <p className="quest-subtitle">{quest.subtitle}</p>
                <div className="quest-meta">
                  <InfoPopover
                    label="Experience Points"
                    description="Earned upon quest completion and added to your Developer Passport"
                  >
                    <span className="quest-xp">+{quest.xpReward} XP</span>
                  </InfoPopover>
                  <span className="quest-time">{quest.estimatedTime}</span>
                </div>
              </button>
              {index < quests.length - 1 && <div className="quest-connector" aria-hidden="true" />}
            </div>
          ))}
        </div>

        <section className="repo-spatial-layer" aria-label="Onboarding journey map">
          <div className="repo-spatial-copy">
            <span>Onboarding journey map</span>
            <p>Quest progress is grouped by what a new contributor needs to accomplish, not by internal implementation files.</p>
          </div>
          <div className="repo-district-grid">
            {repoDistricts.map((district) => (
              <div key={district.label} className="repo-district">
                <strong>{district.label}</strong>
                <span className="repo-district-signal">{district.signal}</span>
                <span>{district.note}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="quest-map-footer">
        <p className="powered-by">
          <Bot size={18} className="powered-icon" />
          Quests generated by IBM Bob analyzing your repository
        </p>
      </div>
    </div>
  );
}

// Made with Bob
