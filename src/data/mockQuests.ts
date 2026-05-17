import type { GrowthQuest, Badge } from '../domain/types';

const setupBadge: Badge = {
  id: 'badge-setup',
  name: 'Environment Ready',
  description: 'Verified the repository can run locally and the first contribution path is reachable.',
  icon: 'wrench',
  rarity: 'common',
  category: 'explorer',
};

const explorerBadge: Badge = {
  id: 'badge-explorer',
  name: 'Repository Explorer',
  description: 'Mapped the repository structure, entry points, and contribution starting areas.',
  icon: 'map',
  rarity: 'common',
  category: 'explorer',
};

const improveBadge: Badge = {
  id: 'badge-improve',
  name: 'Starter Improvement',
  description: 'Identified a small, reviewable improvement and gathered the files and commands needed.',
  icon: 'target',
  rarity: 'rare',
  category: 'contributor',
};

const firstPrBadge: Badge = {
  id: 'badge-first-pr',
  name: 'First PR Ready',
  description: 'Prepared a copy-friendly pull request package with task, files, commands, and reviewer notes.',
  icon: 'git-pull-request',
  rarity: 'epic',
  category: 'contributor',
};

export const mockQuests: GrowthQuest[] = [
  {
    id: 'quest-001',
    level: 1,
    title: 'Setup Quest',
    subtitle: 'Get the repository running locally',
    description:
      'Follow the repository-specific setup path IBM Bob extracted from scripts, entry points, and project structure. This quest proves the contributor can run the app before changing it.',
    objectives: [
      {
        id: 'obj-001-1',
        description: 'Clone the repository and inspect package scripts',
        type: 'explore',
        completed: false,
      },
      {
        id: 'obj-001-2',
        description: 'Install dependencies with npm install',
        type: 'explore',
        completed: false,
      },
      {
        id: 'obj-001-3',
        description: 'Run npm run dev and confirm the app opens locally',
        type: 'explore',
        completed: false,
      },
      {
        id: 'obj-001-4',
        description: 'Run npm run build to verify the baseline is healthy',
        type: 'explore',
        completed: false,
      },
    ],
    xpReward: 75,
    badge: setupBadge,
    estimatedTime: '10-15 min',
    difficulty: 'beginner',
    color: '#0f62fe',
    position: [-6, 0, 0],
    status: 'not-started',
  },
  {
    id: 'quest-002',
    level: 1,
    title: 'Explore Quest',
    subtitle: 'Build a mental map of the codebase',
    description:
      'Use IBM Bob analysis to understand the product flow, growth model, and integration boundaries before attempting a change.',
    objectives: [
      {
        id: 'obj-002-1',
        description: 'Review the application entry flow and how a user moves through the workspace',
        type: 'explore',
        completed: false,
      },
      {
        id: 'obj-002-2',
        description: 'Inspect the growth model behind quests, passport progress, and IBM service signals',
        type: 'explore',
        completed: false,
      },
      {
        id: 'obj-002-3',
        description: 'Open the onboarding map and identify the main contribution areas',
        type: 'explore',
        completed: false,
      },
      {
        id: 'obj-002-4',
        description: 'Save one Skill Boost that supports the current quest',
        type: 'explore',
        completed: false,
      },
    ],
    xpReward: 125,
    badge: explorerBadge,
    estimatedTime: '15-25 min',
    difficulty: 'beginner',
    prerequisites: ['quest-001'],
    color: '#4589ff',
    position: [-2, 0, 0],
    status: 'not-started',
  },
  {
    id: 'quest-003',
    level: 2,
    title: 'Improve Quest',
    subtitle: 'Choose a small, reviewable change',
    description:
      'Turn repository understanding into a beginner-friendly contribution candidate. The goal is not a huge refactor; it is a scoped improvement that a maintainer can review quickly.',
    objectives: [
      {
        id: 'obj-003-1',
        description: 'Pick one starter task from IBM Bob recommendations',
        type: 'contribute',
        completed: false,
      },
      {
        id: 'obj-003-2',
        description: 'Identify the review scope and the safest test/build command',
        type: 'contribute',
        completed: false,
      },
      {
        id: 'obj-003-3',
        description: 'Draft an implementation note explaining scope and risk',
        type: 'contribute',
        completed: false,
      },
      {
        id: 'obj-003-4',
        description: 'Check the change against accessibility and IBM service readiness requirements',
        type: 'contribute',
        completed: false,
      },
    ],
    xpReward: 225,
    badge: improveBadge,
    estimatedTime: '25-40 min',
    difficulty: 'intermediate',
    prerequisites: ['quest-001', 'quest-002'],
    color: '#0043ce',
    position: [2, 0, 0],
    status: 'not-started',
  },
  {
    id: 'quest-004',
    level: 3,
    title: 'First PR Quest',
    subtitle: 'Package the contribution for review',
    description:
      'Generate a First PR Package that makes the user contribution-ready: task, review scope, commands, title, description, checklist, and reviewer notes in one copy-friendly view.',
    objectives: [
      {
        id: 'obj-004-1',
        description: 'Review the recommended starter task and review scope',
        type: 'contribute',
        completed: false,
      },
      {
        id: 'obj-004-2',
        description: 'Copy the build/test commands into the local terminal',
        type: 'contribute',
        completed: false,
      },
      {
        id: 'obj-004-3',
        description: 'Prepare a PR title and description draft',
        type: 'contribute',
        completed: false,
      },
      {
        id: 'obj-004-4',
        description: 'Complete the PR readiness checklist',
        type: 'contribute',
        completed: false,
      },
    ],
    xpReward: 350,
    badge: firstPrBadge,
    estimatedTime: '30-45 min',
    difficulty: 'advanced',
    prerequisites: ['quest-001', 'quest-002', 'quest-003'],
    color: '#24a148',
    position: [6, 0, 0],
    status: 'not-started',
  },
];
