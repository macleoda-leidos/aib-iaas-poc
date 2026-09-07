import { createRepositories, initialiseDatabase } from '@aib-iaas/database';

export const repos = createRepositories();
export const { applications, audit, recommendations, users, documents, organisations, payments, driver } = repos;

// Re-export for backwards compatibility
export { getDatabase } from '@aib-iaas/database';

/**
 * Bring the schema into existence before the service serves anything.
 *
 * Async because PostgreSQL's schema creation is. Callers must await it — under
 * SQLite the work has already happened synchronously inside createRepositories()
 * above, so a missed await shows up only against PostgreSQL, which is exactly the
 * class of bug this migration exists to remove.
 */
export async function initDatabase(): Promise<void> {
  await initialiseDatabase();
  console.log('[Database] Initialized via @aib-iaas/database');
}
