import { createRepositories, initialiseDatabase } from '@aib-iaas/database';

export const repos = createRepositories();
export const { users, organisations, driver } = repos;

// Legacy aliases for backwards compatibility
export const getUserDb = () => {
  const { getDatabase } = require('@aib-iaas/database');
  return getDatabase();
};

export async function initUserDb(): Promise<void> {
  await initialiseDatabase();
  console.log('[User DB] Initialized via @aib-iaas/database');
}
