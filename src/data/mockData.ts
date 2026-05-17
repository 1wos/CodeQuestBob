// Re-export all mock data from modular files
export { mockRepoScan } from './mockRepo';
export { mockQuests } from './mockQuests';
export { mockPassport, mockSkillBoosts } from './mockPassport';
export {
  ibmServices,
  liveIntegrations,
  configuredIntegrations,
  architectureExtensions,
  ibmServices as mockIBMServices
} from './ibmServices';
export type { IBMServiceWithStatus, IntegrationStatus } from './ibmServices';

// Made with Bob
