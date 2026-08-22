import { createRepositories } from '@aib-iaas/database';

export const repos = createRepositories();
export const { applications, audit, recommendations, users, documents, organisations, payments } = repos;

// Re-export for backwards compatibility
export { getDatabase } from '@aib-iaas/database';

// Legacy alias — some routes may still call initDatabase()
export function initDatabase(): void {
  // Schema is initialized by createRepositories() above — this is a no-op now
  console.log('[Database] Initialized via @aib-iaas/database');
}
