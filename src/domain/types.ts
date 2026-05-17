// Core TypeScript domain models for CodeQuest Bob

export interface RepoScanResult {
  id: string;
  repoName: string;
  repoUrl: string;
  scannedAt: Date;
  stats: {
    totalFiles: number;
    totalLines: number;
    languages: Record<string, number>; // language -> percentage
    complexity: 'beginner' | 'intermediate' | 'advanced';
  };
  insights: {
    mainEntryPoints: string[];
    keyDirectories: string[];
    documentationQuality: number; // 0-100
    testCoverage: number; // 0-100
    contributionOpportunities: string[];
  };
  bobAnalysis: {
    sessionId: string;
    analysisTime: number; // seconds
    tokensUsed: number;
    recommendations: string[];
  };
}

export interface QuestObjective {
  id: string;
  description: string;
  type: 'explore' | 'contribute' | 'respond';
  completed: boolean;
  completionRecord?: {
    type: 'file_read' | 'command_run' | 'code_written' | 'issue_resolved';
    details: string;
  };
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string; // lucide-react icon name
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt?: Date;
  category: 'explorer' | 'contributor' | 'responder' | 'skill';
}

export interface GrowthQuest {
  id: string;
  level: 1 | 2 | 3;
  title: string;
  subtitle: string;
  description: string;
  objectives: QuestObjective[];
  xpReward: number;
  badge: Badge;
  estimatedTime: string; // "15-30 min"
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  prerequisites?: string[];
  color: string; // For visual representation
  position: [number, number, number]; // 3D position for future visual layer
  status?: 'not-started' | 'in-progress' | 'completed';
}

export interface SkillBoost {
  id: string;
  title: string;
  description: string;
  category: 'git' | 'debugging' | 'testing' | 'architecture' | 'security';
  content: {
    type: 'tip' | 'tutorial' | 'best_practice';
    text: string;
    codeExample?: string;
    links?: Array<{ title: string; url: string }>;
  };
  ibmService: 'watsonx.ai' | 'granite' | 'nlu' | 'tts';
  triggeredBy?: string; // quest or objective id
}

export interface SkillBoostResource {
  id: string;
  source: 'GitHub' | 'Hugging Face';
  title: string;
  description: string;
  url: string;
  signal: string;
  language?: string;
  tags: string[];
  nluKeywords: string[];
  recommendationReason: string;
  relatedQuestId: string;
  relatedQuestTitle: string;
  generatedBy: 'watsonx.ai / IBM Granite' | 'Rule-based ranking';
}

export interface IncidentDrill {
  id: string;
  title: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  scenario: string;
  symptoms: string[];
  affectedFiles: string[];
  hints: Array<{
    level: 1 | 2 | 3;
    text: string;
    ibmService: 'granite' | 'watsonx.ai';
  }>;
  solution: {
    steps: string[];
    explanation: string;
    preventionTips: string[];
  };
  timeLimit?: number; // minutes
  xpReward: number;
}

export interface TimelineEvent {
  timestamp: Date;
  type: 'quest' | 'badge' | 'incident' | 'skill' | 'scan' | 'pr';
  description: string;
  xpGained: number;
}

export interface DeveloperPassport {
  userId: string;
  username: string;
  createdAt: Date;
  stats: {
    totalXP: number;
    level: number;
    questsCompleted: number;
    badgesEarned: number;
    incidentsResolved: number;
    skillBoostsUnlocked: number;
  };
  achievements: {
    badges: Badge[];
    completedQuests: string[]; // quest ids
    incidentDrills: string[]; // drill ids
    skillBoosts: string[]; // boost ids
  };
  timeline: TimelineEvent[];
  ibmBobUsage: {
    totalSessions: number;
    totalTokens: number;
    totalTime: number; // seconds
    sessionsExported: string[]; // session ids
  };
}

export interface IBMService {
  id: string;
  name: string;
  description: string;
  icon: string; // lucide-react icon name
  usedFor: string[];
  color: string;
  docsUrl: string;
}

export type Screen =
  | 'landing'
  | 'repo-scan'
  | 'quest-map'
  | 'passport'
  | 'overview'
  | 'repository-intake'
  | 'growth-plan'
  | 'quest-detail'
  | 'developer-passport'
  | 'ibm-integrations';

export interface AppState {
  currentScreen: Screen;
  selectedQuestId: string | null;
  repoScan: RepoScanResult | null;
  passport: DeveloperPassport;
  quests: GrowthQuest[];
  skillBoosts: SkillBoost[];
  savedRadarBoosts: SkillBoostResource[];
}

// Activity log for Overview screen
export interface ActivityLogEntry {
  id: string;
  timestamp: Date;
  type: 'scan' | 'quest_start' | 'quest_complete' | 'badge_earned' | 'skill_unlock';
  description: string;
  metadata?: Record<string, unknown>;
}

// Made with Bob
