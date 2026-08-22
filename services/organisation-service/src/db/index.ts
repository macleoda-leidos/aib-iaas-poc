import { createRepositories } from '@aib-iaas/database';

export const repos = createRepositories();
export const { organisations, users } = repos;

// Legacy aliases for backwards compatibility
export const getOrgDb = () => {
  const { getDatabase } = require('@aib-iaas/database');
  return getDatabase();
};

export function initOrgDb(): void {
  // Schema is initialized by createRepositories() above — this is a no-op now
  // Seed data is now handled by @aib-iaas/database seed function
  console.log('[Organisation DB] Initialized via @aib-iaas/database');
}
