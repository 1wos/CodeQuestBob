import type { IBMService } from '../domain/types';

export type IntegrationStatus = 'live' | 'configured' | 'architecture';

export interface IBMServiceWithStatus extends IBMService {
  status: IntegrationStatus;
  statusLabel: string;
}

export const ibmServices: IBMServiceWithStatus[] = [
  {
    id: 'ibm-bob',
    name: 'IBM Bob IDE',
    description:
      'AI-powered IDE assistant that analyzes repositories, generates growth quests, and provides intelligent code insights.',
    icon: 'bot',
    usedFor: [
      'Repository analysis and structure mapping',
      'Growth quest generation based on codebase',
      'First PR package creation',
      'Code review and improvement suggestions',
    ],
    color: '#0f62fe',
    docsUrl: 'https://www.ibm.com/products/watsonx-code-assistant',
    status: 'live',
    statusLabel: 'Active - Session reports exported',
  },
  {
    id: 'watsonx-ai',
    name: 'watsonx.ai / IBM Granite',
    description:
      'Enterprise AI platform with Granite foundation models for code generation, improvement hints, and just-in-time learning.',
    icon: 'sparkles',
    usedFor: [
      'Skill Boost content generation',
      'Improvement hint generation',
      'Root cause analysis assistance',
      'Solution recommendations',
    ],
    color: '#8a3ffc',
    docsUrl: 'https://www.ibm.com/products/watsonx-ai',
    status: 'live',
    statusLabel: 'Smoke tested - Granite 3.8B',
  },
  {
    id: 'nlu',
    name: 'Natural Language Understanding',
    description:
      'Extract insights from documentation to assess complexity and identify learning opportunities.',
    icon: 'book-open',
    usedFor: [
      'README and docs topic extraction',
      'Complexity assessment',
      'Documentation quality scoring',
      'Learning path recommendations',
    ],
    color: '#24a148',
    docsUrl: 'https://www.ibm.com/cloud/watson-natural-language-understanding',
    status: 'live',
    statusLabel: 'Smoke tested - API configured',
  },
  {
    id: 'tts',
    name: 'Text to Speech',
    description:
      'Convert quest briefings and instructions to speech for accessible, hands-free learning.',
    icon: 'volume-2',
    usedFor: [
      'Quest briefing narration',
      'First PR briefing audio',
      'Accessibility features',
      'Multi-modal learning support',
    ],
    color: '#fa4d56',
    docsUrl: 'https://www.ibm.com/cloud/watson-text-to-speech',
    status: 'live',
    statusLabel: 'Smoke tested - API configured',
  },
  {
    id: 'stt',
    name: 'Speech to Text',
    description:
      'Verify generated quest briefings with speech recognition and support future hands-free navigation.',
    icon: 'mic',
    usedFor: [
      'Quest briefing transcript verification',
      'Teach-back loop validation',
      'Accessibility features',
      'Future voice navigation',
    ],
    color: '#0043ce',
    docsUrl: 'https://www.ibm.com/cloud/watson-speech-to-text',
    status: 'live',
    statusLabel: 'Smoke tested - API configured',
  },
  {
    id: 'watsonx-governance',
    name: 'watsonx.governance',
    description:
      'Ensure responsible AI usage with traceability, compliance, and security monitoring.',
    icon: 'shield-check',
    usedFor: [
      'AI decision traceability',
      'Compliance monitoring',
      'Security best practices',
      'Responsible AI guidelines',
    ],
    color: '#ff832b',
    docsUrl: 'https://www.ibm.com/products/watsonx-governance',
    status: 'architecture',
    statusLabel: 'Architecture extension',
  },
  {
    id: 'watsonx-orchestrate',
    name: 'watsonx Orchestrate',
    description:
      'Automate follow-up growth workflows and integrate with enterprise systems.',
    icon: 'workflow',
    usedFor: [
      'Automated quest progression',
      'Team onboarding workflows',
      'Integration with HR systems',
      'Growth milestone notifications',
    ],
    color: '#0f62fe',
    docsUrl: 'https://www.ibm.com/products/watsonx-orchestrate',
    status: 'architecture',
    statusLabel: 'Architecture extension',
  },
  {
    id: 'cos',
    name: 'Cloud Object Storage',
    description:
      'Store session reports, badge assets, and developer growth artifacts at scale.',
    icon: 'database',
    usedFor: [
      'Session report storage',
      'Badge and achievement assets',
      'Growth passport backups',
      'Audit trail persistence',
    ],
    color: '#24a148',
    docsUrl: 'https://www.ibm.com/cloud/object-storage',
    status: 'architecture',
    statusLabel: 'Architecture extension',
  },
  {
    id: 'cloudant',
    name: 'Cloudant',
    description:
      'NoSQL database for storing user progress, quest state, and growth timelines.',
    icon: 'server',
    usedFor: [
      'User progress persistence',
      'Quest state management',
      'Growth timeline storage',
      'Multi-device sync',
    ],
    color: '#0043ce',
    docsUrl: 'https://www.ibm.com/cloud/cloudant',
    status: 'architecture',
    statusLabel: 'Architecture extension',
  },
];

export const liveIntegrations = ibmServices.filter((s) => s.status === 'live');
export const configuredIntegrations = ibmServices.filter((s) => s.status === 'configured');
export const architectureExtensions = ibmServices.filter((s) => s.status === 'architecture');

// Made with Bob
