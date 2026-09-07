import { createRepositories, initialiseDatabase } from '@aib-iaas/database';

export const repos = createRepositories();
export const { organisations, users, driver } = repos;

// Legacy aliases for backwards compatibility
export const getOrgDb = () => {
  const { getDatabase } = require('@aib-iaas/database');
  return getDatabase();
};

export async function initOrgDb(): Promise<void> {
  await initialiseDatabase();
  console.log('[Organisation DB] Initialized via @aib-iaas/database');
}
