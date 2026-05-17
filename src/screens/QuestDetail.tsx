import { useApp } from '../app/useApp';
import { IBMBobBadge } from '../components/ui/IBMBobBadge';
import { LiveSkillBoostRadar } from '../components/skill-boosts';
import { BobBriefingPanel } from '../components/ibm';
import { LocalizedQuestBrief } from '../components/localization';
import {
  ArrowLeft,
  CheckCircle2,
  Clipboard,
  Copy,
  FileCode2,
  GitPullRequest,
  Map,
  Rocket,
  Target,
  Terminal,
  Wrench,
} from 'lucide-react';
import './QuestDetail.css';

const firstPrPackage = {
  starterTask:
    'Improve the IBM service status view by adding clearer integration labels and validating the page with npm run build.',
  reviewScope: [
    'IBM service labels',
    'Skill Boost Radar copy',
    'Growth model documentation',
  ],
  commands: ['npm run lint', 'npm run build'],
  title: 'Improve IBM service labels for contributor onboarding',
  description:
    'This PR clarifies the IBM service status shown during onboarding and keeps the Skill Boost Radar connected to live GitHub, Hugging Face, Watson NLU, and Granite signals.',
  reviewerNotes:
    'Scope is intentionally small: UI copy, service clarity, and build verification. No credentials are exposed in the browser.',
};

export function QuestDetail() {
  const {
    selectedQuestId,
    getQuestById,
    navigateTo,
    toggleObjective,
    completeQuest,
    isQuestCompleted,
    canCompleteQuest,
  } = useApp();

  const questIconMap = {
    map: Map,
    wrench: Wrench,
    target: Target,
    'git-pull-request': GitPullRequest,
  };

  const getIcon = (iconName: string, size = 64) => {
    const IconComponent = questIconMap[iconName as keyof typeof questIconMap] ?? Map;
    return <IconComponent size={size} />;
  };

  const quest = selectedQuestId ? getQuestById(selectedQuestId) : null;

  if (!quest) {
    return (
      <div className="quest-detail-screen">
        <p>Quest not found</p>
        <button className="btn btn-primary" onClick={() => navigateTo('quest-map')}>
          Back to Quest Map
        </button>
      </div>
    );
  }

  const completedObjectives = quest.objectives.filter((objective) => objective.completed).length;
  const progressPercent = Math.round((completedObjectives / quest.objectives.length) * 100);
  const completed = isQuestCompleted(quest.id);
  const readyToComplete = canCompleteQuest(quest.id);
  const copyText = async (value: string) => {
    await navigator.clipboard?.writeText(value);
  };

  return (
    <div className="quest-detail-screen">
      <div className="quest-detail-header">
        <button className="btn-back" onClick={() => navigateTo('quest-map')}>
          <ArrowLeft size={18} />
          Back to Map
        </button>
        <IBMBobBadge variant="compact" />
      </div>

      <div className="quest-detail-hero" style={{ borderColor: quest.color }}>
        <div className="quest-badge-large">{getIcon(quest.badge.icon)}</div>
        <h1>{quest.title}</h1>
        <p className="quest-subtitle-large">{quest.subtitle}</p>
        <div className="quest-progress-panel">
          <div className="quest-progress-copy">
            <span>Quest progress</span>
            <strong>
              {completedObjectives}/{quest.objectives.length} objectives
            </strong>
          </div>
          <div className="quest-progress-track">
            <div className="quest-progress-fill" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
        <div className="quest-tags">
          <span className="tag">Level {quest.level}</span>
          <span className="tag">{quest.difficulty}</span>
          <span className="tag">+{quest.xpReward} XP</span>
          <span className="tag">{quest.estimatedTime}</span>
        </div>
      </div>

      <div className="quest-detail-content">
        <div className="quest-section">
          <h2>Quest Description</h2>
          <p>{quest.description}</p>
        </div>

        <LocalizedQuestBrief quest={quest} />

        <div className="quest-section">
          <h2>Objectives</h2>
          <div className="objectives-list">
            {quest.objectives.map((obj) => (
              <label key={obj.id} className={`objective-item ${obj.completed ? 'completed' : ''}`}>
                <input
                  type="checkbox"
                  checked={obj.completed}
                  disabled={completed}
                  onChange={() => toggleObjective(quest.id, obj.id)}
                  className="objective-checkbox"
                />
                <div className="objective-content">
                  <p className="objective-description">{obj.description}</p>
                  <span className="objective-type">
                    {obj.completed ? 'Progress saved' : obj.type}
                  </span>
                </div>
              </label>
            ))}
          </div>
        </div>

        <BobBriefingPanel
          title={quest.title}
          subtitle={quest.subtitle}
          objectives={quest.objectives.map((objective) => objective.description)}
        />

        <div className="quest-section quest-section-wide">
          <LiveSkillBoostRadar
            title="Recommended Skill Boosts"
            subtitle="AI-powered learning recommendations tailored to your current quest objectives."
            focusSkill={`${quest.title} · ${quest.subtitle}`}
          />
        </div>

        {quest.id === 'quest-004' && (
          <div className="quest-section first-pr-package">
            <div className="first-pr-package-header">
              <div>
                <h2>First PR Package</h2>
                <p>
                  Copy-friendly starter task, review scope, commands, and reviewer notes prepared from
                  IBM Bob repository analysis.
                </p>
              </div>
              <div className="first-pr-ready-badge">
                <GitPullRequest size={20} aria-hidden="true" />
                <span>Ready for review</span>
              </div>
            </div>

            <div className="first-pr-grid">
              <section className="first-pr-panel">
                <h3>
                  <Clipboard size={18} />
                  Starter task
                </h3>
                <p>{firstPrPackage.starterTask}</p>
              </section>

              <section className="first-pr-panel">
                <h3>
                  <FileCode2 size={18} />
                  Review scope
                </h3>
                <ul>
                  {firstPrPackage.reviewScope.map((scope) => (
                    <li key={scope}>
                      {scope}
                    </li>
                  ))}
                </ul>
              </section>

              <section className="first-pr-panel">
                <h3>
                  <Terminal size={18} />
                  Build and test commands
                </h3>
                <div className="command-list">
                  {firstPrPackage.commands.map((command) => (
                    <button
                      key={command}
                      type="button"
                      className="copy-command"
                      onClick={() => copyText(command)}
                    >
                      <code>{command}</code>
                      <Copy size={16} aria-hidden="true" />
                    </button>
                  ))}
                </div>
              </section>

              <section className="first-pr-panel first-pr-panel-wide">
                <h3>
                  <GitPullRequest size={18} />
                  PR draft
                </h3>
                <div className="pr-draft-row">
                  <span>Title</span>
                  <button type="button" onClick={() => copyText(firstPrPackage.title)}>
                    <Copy size={16} aria-hidden="true" />
                    Copy
                  </button>
                </div>
                <p className="pr-draft-text">{firstPrPackage.title}</p>
                <div className="pr-draft-row">
                  <span>Description</span>
                  <button type="button" onClick={() => copyText(firstPrPackage.description)}>
                    <Copy size={16} aria-hidden="true" />
                    Copy
                  </button>
                </div>
                <p className="pr-draft-text">{firstPrPackage.description}</p>
                <div className="reviewer-notes">
                  <strong>Reviewer notes</strong>
                  <p>{firstPrPackage.reviewerNotes}</p>
                </div>
              </section>
            </div>
          </div>
        )}

        <div className="quest-section">
          <h2>Reward</h2>
          <div className="reward-card">
            <div className="reward-badge">
              <span className="reward-icon">{getIcon(quest.badge.icon, 48)}</span>
              <div className="reward-info">
                <h3>{quest.badge.name}</h3>
                <p>{quest.badge.description}</p>
                <span className="reward-rarity">{quest.badge.rarity}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="quest-actions">
          <button
            className="btn btn-primary btn-large"
            disabled={!readyToComplete && !completed}
            onClick={() => completeQuest(quest.id)}
          >
            {completed ? <CheckCircle2 size={20} /> : <Rocket size={20} />}
            {completed
              ? 'Quest Completed'
              : readyToComplete
                ? 'Complete Quest and Claim Reward'
                : 'Complete all objectives first'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Made with Bob
