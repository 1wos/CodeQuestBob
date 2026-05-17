import { useState } from 'react';
import type { ReactNode } from 'react';
import type { Screen, GrowthQuest, DeveloperPassport, SkillBoostResource } from '../domain/types';
import { mockRepoScan, mockPassport, mockQuests, mockSkillBoosts } from '../data/mockData';
import { AppContext, type AppContextType } from './context';

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentScreen, setCurrentScreen] = useState<Screen>('landing');
  const [selectedQuestId, setSelectedQuestId] = useState<string | null>(null);
  const [quests, setQuests] = useState<GrowthQuest[]>(mockQuests);
  const [passport, setPassport] = useState<DeveloperPassport>(mockPassport);
  const [savedRadarBoosts, setSavedRadarBoosts] = useState<SkillBoostResource[]>([]);

  const navigateTo = (screen: Screen, questId?: string) => {
    setCurrentScreen(screen);
    if (questId) {
      setSelectedQuestId(questId);
    }
  };

  const selectQuest = (questId: string) => {
    setSelectedQuestId(questId);
    setCurrentScreen('quest-detail');
  };

  const getQuestById = (questId: string) => {
    return quests.find((q) => q.id === questId);
  };

  const isQuestCompleted = (questId: string) => {
    return passport.achievements.completedQuests.includes(questId);
  };

  const canCompleteQuest = (questId: string) => {
    const quest = quests.find((q) => q.id === questId);
    return Boolean(
      quest &&
        !passport.achievements.completedQuests.includes(questId) &&
        quest.objectives.every((objective) => objective.completed),
    );
  };

  const toggleObjective = (questId: string, objectiveId: string) => {
    if (isQuestCompleted(questId)) return;

    setQuests((currentQuests) =>
      currentQuests.map((quest) =>
        quest.id === questId
          ? {
              ...quest,
              objectives: quest.objectives.map((objective) =>
                objective.id === objectiveId
                  ? {
                      ...objective,
                      completed: !objective.completed,
                      completionRecord: !objective.completed
                        ? {
                            type: objective.type === 'explore' ? 'file_read' : 'code_written',
                            details: `Validated during ${quest.title}`,
                          }
                        : undefined,
                    }
                  : objective,
              ),
            }
          : quest,
      ),
    );
  };

  const completeQuest = (questId: string) => {
    const quest = quests.find((item) => item.id === questId);
    if (!quest || isQuestCompleted(questId) || !quest.objectives.every((item) => item.completed)) {
      return;
    }

    const relatedSkillBoosts = mockSkillBoosts
      .filter((boost) => boost.triggeredBy === questId)
      .map((boost) => boost.id);

    setPassport((currentPassport) => {
      const totalXP = currentPassport.stats.totalXP + quest.xpReward;
      const completedQuests = [...currentPassport.achievements.completedQuests, quest.id];
      const badges = [
        ...currentPassport.achievements.badges,
        { ...quest.badge, unlockedAt: new Date() },
      ];
      const skillBoosts = Array.from(
        new Set([...currentPassport.achievements.skillBoosts, ...relatedSkillBoosts]),
      );

      return {
        ...currentPassport,
        stats: {
          ...currentPassport.stats,
          totalXP,
          level: Math.max(1, Math.floor(totalXP / 250) + 1),
          questsCompleted: completedQuests.length,
          badgesEarned: badges.length,
          incidentsResolved: currentPassport.stats.incidentsResolved,
          skillBoostsUnlocked: skillBoosts.length,
        },
        achievements: {
          ...currentPassport.achievements,
          completedQuests,
          badges,
          skillBoosts,
        },
        timeline: [
          {
            timestamp: new Date(),
            type: 'quest',
            description: `Completed ${quest.title}`,
            xpGained: quest.xpReward,
          },
          {
            timestamp: new Date(),
            type: 'badge',
            description: `Earned ${quest.badge.name}`,
            xpGained: 0,
          },
          ...currentPassport.timeline,
        ],
      };
    });
  };

  const saveRadarBoost = (boost: SkillBoostResource) => {
    setSavedRadarBoosts((currentBoosts) => {
      if (currentBoosts.some((item) => item.id === boost.id)) {
        return currentBoosts;
      }
      return [boost, ...currentBoosts];
    });

    setPassport((currentPassport) => {
      if (currentPassport.achievements.skillBoosts.includes(boost.id)) {
        return currentPassport;
      }

      const skillBoosts = [boost.id, ...currentPassport.achievements.skillBoosts];

      return {
        ...currentPassport,
        stats: {
          ...currentPassport.stats,
          totalXP: currentPassport.stats.totalXP + 25,
          level: Math.max(1, Math.floor((currentPassport.stats.totalXP + 25) / 250) + 1),
          skillBoostsUnlocked: skillBoosts.length,
        },
        achievements: {
          ...currentPassport.achievements,
          skillBoosts,
        },
        timeline: [
          {
            timestamp: new Date(),
            type: 'skill',
            description: `Saved Skill Boost from ${boost.source}: ${boost.title}`,
            xpGained: 25,
          },
          ...currentPassport.timeline,
        ],
      };
    });
  };

  const value: AppContextType = {
    currentScreen,
    selectedQuestId,
    repoScan: mockRepoScan,
    passport,
    quests,
    skillBoosts: mockSkillBoosts,
    savedRadarBoosts,
    navigateTo,
    selectQuest,
    getQuestById,
    toggleObjective,
    completeQuest,
    saveRadarBoost,
    isQuestCompleted,
    canCompleteQuest,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// Made with Bob
