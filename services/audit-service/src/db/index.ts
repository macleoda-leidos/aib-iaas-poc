import { createRepositories } from '@aib-iaas/database';

export const repos = createRepositories();
export const { audit, applications } = repos;

// Legacy aliases for backwards compatibility
export const getAuditDb = () => {
  const { getDatabase } = require('@aib-iaas/database');
  return getDatabase();
};

export function initAuditDb(): void {
  // Schema is initialized by createRepositories() above — this is a no-op now
  console.log('[Audit DB] Initialized via @aib-iaas/database');
}
