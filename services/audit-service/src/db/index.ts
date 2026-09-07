import { createRepositories, initialiseDatabase, getDatabase } from '@aib-iaas/database';

export const repos = createRepositories();
export const { audit, applications, driver } = repos;

// Disable FK enforcement for the audit service — it's an independent microservice
// that logs events referencing application IDs from other services' databases.
//
// SQLite only, and no PostgreSQL equivalent is needed: `pragma` is a better-sqlite3
// method with no analogue in `pg`, and pg-schema.ts declares no foreign key on
// audit_events.application_id at all, so PostgreSQL already behaves the way this
// pragma makes SQLite behave.
if (driver.dialect === 'sqlite') {
  getDatabase().pragma('foreign_keys = OFF');
}

// Legacy aliases for backwards compatibility
export const getAuditDb = () => {
  const { getDatabase } = require('@aib-iaas/database');
  return getDatabase();
};

export async function initAuditDb(): Promise<void> {
  await initialiseDatabase();
  console.log('[Audit DB] Initialized via @aib-iaas/database');
}
