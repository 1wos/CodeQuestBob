import { createContext } from 'react';
import type { AppState, GrowthQuest, Screen, SkillBoostResource } from '../domain/types';

export interface AppContextType extends AppState {
  navigateTo: (screen: Screen, questId?: string) => void;
  selectQuest: (questId: string) => void;
  getQuestById: (questId: string) => GrowthQuest | undefined;
  toggleObjective: (questId: string, objectiveId: string) => void;
  completeQuest: (questId: string) => void;
  saveRadarBoost: (boost: SkillBoostResource) => void;
  isQuestCompleted: (questId: string) => boolean;
  canCompleteQuest: (questId: string) => boolean;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);
