import type { DeveloperPassport, SkillBoost } from '../domain/types';

export const mockPassport: DeveloperPassport = {
  userId: 'user-001',
  username: 'Somi Jeong',
  createdAt: new Date('2026-05-16T08:00:00Z'),
  stats: {
    totalXP: 0,
    level: 1,
    questsCompleted: 0,
    badgesEarned: 0,
    incidentsResolved: 0,
    skillBoostsUnlocked: 0,
  },
  achievements: {
    badges: [],
    completedQuests: [],
    incidentDrills: [],
    skillBoosts: [],
  },
  timeline: [],
  ibmBobUsage: {
    totalSessions: 3,
    totalTokens: 45231,
    totalTime: 1847, // ~30 minutes
    sessionsExported: [
      'session-01-repo-analysis',
      'session-02-quest-generation',
      'session-03-implementation-review',
    ],
  },
};

export const mockSkillBoosts: SkillBoost[] = [
  {
    id: 'boost-001',
    title: 'Git Branch Strategy',
    description: 'Learn effective branching strategies for collaborative development',
    category: 'git',
    content: {
      type: 'best_practice',
      text: 'Use feature branches for new work, keep main branch stable, and use descriptive branch names like feature/add-login or fix/navigation-bug.',
      codeExample:
        'git checkout -b feature/add-user-profile\ngit commit -m "Add user profile component"\ngit push origin feature/add-user-profile',
      links: [
        {
          title: 'Git Branching Guide',
          url: 'https://git-scm.com/book/en/v2/Git-Branching-Branching-Workflows',
        },
      ],
    },
    ibmService: 'watsonx.ai',
    triggeredBy: 'quest-002',
  },
  {
    id: 'boost-002',
    title: 'Debugging with Browser DevTools',
    description: 'Master browser debugging techniques for faster issue resolution',
    category: 'debugging',
    content: {
      type: 'tutorial',
      text: 'Use breakpoints, console.log strategically, inspect network requests, and leverage React DevTools for component debugging.',
      links: [
        {
          title: 'Chrome DevTools',
          url: 'https://developer.chrome.com/docs/devtools/',
        },
      ],
    },
    ibmService: 'granite',
    triggeredBy: 'quest-003',
  },
];

// Made with Bob
