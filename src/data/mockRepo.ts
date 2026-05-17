import type { RepoScanResult } from '../domain/types';

export const mockRepoScan: RepoScanResult = {
  id: 'scan-001',
  repoName: 'codequest-bob',
  repoUrl: 'https://github.com/ideation-lab/codequest-bob',
  scannedAt: new Date('2026-05-16T08:30:00Z'),
  stats: {
    totalFiles: 42,
    totalLines: 3847,
    languages: {
      TypeScript: 68,
      CSS: 18,
      HTML: 8,
      JSON: 6,
    },
    complexity: 'intermediate',
  },
  insights: {
    mainEntryPoints: ['Application entry flow', 'Workspace shell'],
    keyDirectories: ['Reusable interface system', 'Quest experience screens', 'Growth data model'],
    documentationQuality: 72,
    testCoverage: 45,
    contributionOpportunities: [
      'Add unit tests for domain models',
      'Improve accessibility in UI components',
      'Add error boundary components',
      'Document 3D scene architecture',
    ],
  },
  bobAnalysis: {
    sessionId: 'bob-session-001',
    analysisTime: 47,
    tokensUsed: 12847,
    recommendations: [
      'Start with Explore Quest to understand the codebase structure',
      'Focus on small interface improvements for first contribution opportunities',
      'Review existing tests before adding new features',
      'Check documentation gaps in the growth data model',
    ],
  },
};

// Made with Bob
