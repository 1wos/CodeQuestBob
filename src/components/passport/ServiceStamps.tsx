import { useApp } from '../../app/useApp';
import type { ComponentType } from 'react';
import {
  Search,
  Sparkles,
  BookOpen,
  Mic,
  Radar,
  GitPullRequest,
  ShieldCheck,
} from 'lucide-react';
import './ServiceStamps.css';

interface Stamp {
  id: string;
  title: string;
  description: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  unlocked: boolean;
  unlockedAt?: Date;
}

export function ServiceStamps() {
  const { passport, savedRadarBoosts, isQuestCompleted } = useApp();

  // Derive stamp unlock states from existing app state
  const stamps: Stamp[] = [
    {
      id: 'repo-scanner',
      title: 'Repository Started',
      description: 'Repo intake is ready',
      icon: Search,
      unlocked: true, // Always unlocked if passport exists
      unlockedAt: passport.createdAt,
    },
    {
      id: 'granite-coach',
      title: 'AI Coach',
      description: 'Quest guidance is ready',
      icon: Sparkles,
      unlocked: passport.stats.totalXP > 0, // Earned if any XP exists
    },
    {
      id: 'nlu-scout',
      title: 'Learning Scout',
      description: 'Learning signals saved',
      icon: BookOpen,
      unlocked: savedRadarBoosts.length > 0, // Earned if any boosts are saved
    },
    {
      id: 'speech-loop',
      title: 'Audio Briefing',
      description: 'Quest briefing is ready',
      icon: Mic,
      unlocked: true, // TTS/STT is always available
    },
    {
      id: 'skill-radar',
      title: 'Skill Boost Saved',
      description: 'Recommendation added to Passport',
      icon: Radar,
      unlocked: savedRadarBoosts.length > 0,
    },
    {
      id: 'first-pr-ready',
      title: 'PR Package Ready',
      description: 'Contribution package prepared',
      icon: GitPullRequest,
      unlocked: isQuestCompleted('quest-004'), // Earned if First PR Quest is completed
    },
    {
      id: 'passport-keeper',
      title: 'Growth Record',
      description: 'Passport timeline is growing',
      icon: ShieldCheck,
      unlocked: passport.stats.questsCompleted > 0 || passport.stats.badgesEarned > 0,
    },
  ];

  const earnedCount = stamps.filter((s) => s.unlocked).length;

  return (
    <div className="service-stamps">
      <div className="stamps-header">
        <h3>Quest Badges</h3>
        <span className="stamps-count">
          {earnedCount} / {stamps.length} earned
        </span>
      </div>
      <div className="stamps-grid">
        {stamps.map((stamp) => {
          const Icon = stamp.icon;
          return (
            <div
              key={stamp.id}
              className={`stamp-card ${stamp.unlocked ? 'unlocked' : 'locked'}`}
              title={stamp.unlocked ? stamp.description : 'Not earned yet'}
            >
              <div className="stamp-icon">
                <Icon size={24} className="stamp-icon-svg" />
              </div>
              <div className="stamp-content">
                <div className="stamp-title">{stamp.title}</div>
                <div className="stamp-description">{stamp.description}</div>
              </div>
              {stamp.unlocked && <div className="stamp-badge">Earned</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Made with Bob
