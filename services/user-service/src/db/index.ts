import { createRepositories } from '@aib-iaas/database';

export const repos = createRepositories();
export const { users, organisations } = repos;

// Legacy aliases for backwards compatibility
export const getUserDb = () => {
  const { getDatabase } = require('@aib-iaas/database');
  return getDatabase();
};

export function initUserDb(): void {
  // Schema is initialized by createRepositories() above — this is a no-op now
  // Seed data is now handled by @aib-iaas/database seed function
  console.log('[User DB] Initialized via @aib-iaas/database');
}
