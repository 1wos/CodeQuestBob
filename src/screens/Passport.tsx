import { useApp } from '../app/useApp';
import { IBMBobBadge } from '../components/ui/IBMBobBadge';
import { LiveSkillBoostRadar } from '../components/skill-boosts';
import { ServiceStamps } from '../components/passport/ServiceStamps';
import { GitPullRequest, Map, Rocket, Target, UserRound, Wrench } from 'lucide-react';
import './Passport.css';

export function Passport() {
  const { passport, savedRadarBoosts } = useApp();

  const badgeIconMap = {
    map: Map,
    wrench: Wrench,
    target: Target,
    'git-pull-request': GitPullRequest,
  };

  const getBadgeIcon = (iconName: string) => {
    const IconComponent = badgeIconMap[iconName as keyof typeof badgeIconMap] ?? Map;
    return <IconComponent size={40} />;
  };

  return (
    <div className="passport-screen">
      <div className="passport-header">
        <h1>Developer Growth Passport</h1>
        <IBMBobBadge variant="compact" />
      </div>

      <div className="passport-hero">
        <div className="passport-avatar">
          <UserRound size={36} />
        </div>
        <h2>{passport.username}</h2>
        <div className="passport-level">
          <span className="level-badge">Level {passport.stats.level}</span>
          <span className="xp-text">{passport.stats.totalXP} XP</span>
        </div>
      </div>

      <div className="passport-stats">
        <div className="stat-box">
          <div className="stat-value">{passport.stats.questsCompleted}</div>
          <div className="stat-label">Quests Completed</div>
        </div>
        <div className="stat-box">
          <div className="stat-value">{passport.stats.badgesEarned}</div>
          <div className="stat-label">Badges Earned</div>
        </div>
        <div className="stat-box">
          <div className="stat-value">{passport.stats.incidentsResolved}</div>
          <div className="stat-label">Review Drills</div>
        </div>
        <div className="stat-box">
          <div className="stat-value">{passport.stats.skillBoostsUnlocked}</div>
          <div className="stat-label">Skill Boosts</div>
        </div>
      </div>

      <ServiceStamps />

      <div className="passport-section">
        <h3>AI Analysis Activity</h3>
        <div className="bob-usage-grid">
          <div className="usage-item">
            <span className="usage-label">Analysis Sessions:</span>
            <span className="usage-value">{passport.ibmBobUsage.totalSessions}</span>
          </div>
          <div className="usage-item">
            <span className="usage-label">Tokens Processed:</span>
            <span className="usage-value">{passport.ibmBobUsage.totalTokens.toLocaleString()}</span>
          </div>
          <div className="usage-item">
            <span className="usage-label">Analysis Time:</span>
            <span className="usage-value">{Math.floor(passport.ibmBobUsage.totalTime / 60)} min</span>
          </div>
          <div className="usage-item">
            <span className="usage-label">Reports Generated:</span>
            <span className="usage-value">{passport.ibmBobUsage.sessionsExported.length}</span>
          </div>
        </div>
      </div>

      <div className="passport-section">
        <h3>Saved Skill Boosts</h3>
        {savedRadarBoosts.length === 0 ? (
          <p className="empty-state">Save live recommendations to build your growth record.</p>
        ) : (
          <div className="saved-skill-boost-list">
            {savedRadarBoosts.map((boost) => (
              <a
                key={boost.id}
                className="saved-skill-boost-item"
                href={boost.url}
                target="_blank"
                rel="noreferrer"
              >
                <span>{boost.source}</span>
                <strong>{boost.title}</strong>
                <small>{boost.relatedQuestTitle}</small>
              </a>
            ))}
          </div>
        )}
      </div>

      <div className="passport-section">
        <LiveSkillBoostRadar
          title="Skill Boost Radar"
          subtitle="Refresh live GitHub and Hugging Face recommendations, then save the best ones into this Developer Passport."
          focusSkill="Continuous developer growth"
        />
      </div>

      <div className="passport-section">
        <h3>Badge Collection</h3>
        {passport.achievements.badges.length === 0 ? (
          <p className="empty-state">Complete quests to earn badges.</p>
        ) : (
          <div className="badge-grid">
            {passport.achievements.badges.map((badge) => (
              <div key={badge.id} className="badge-item">
                <div className="badge-icon-large">{getBadgeIcon(badge.icon)}</div>
                <h4>{badge.name}</h4>
                <p>{badge.description}</p>
                <span className={`badge-rarity rarity-${badge.rarity}`}>{badge.rarity}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="passport-section">
        <h3>Growth Timeline</h3>
        {passport.timeline.length === 0 ? (
          <p className="empty-state">
            <Rocket size={16} />
            Your journey begins now. Start your first quest.
          </p>
        ) : (
          <div className="timeline">
            {passport.timeline.map((event, index) => (
              <div key={index} className="timeline-event">
                <div className="timeline-marker" />
                <div className="timeline-content">
                  <div className="timeline-header">
                    <span className="timeline-type">{event.type}</span>
                    <span className="timeline-xp">+{event.xpGained} XP</span>
                  </div>
                  <p className="timeline-description">{event.description}</p>
                  <span className="timeline-date">
                    {new Date(event.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Made with Bob
