import type Database from 'better-sqlite3';
import { getDatabase, createRepositories } from '@aib-iaas/database';

/**
 * Notifications now live in the SHARED @aib-iaas/database store, not a separate
 * notification-service SQLite file. This unification lets the api-gateway fire a
 * notification on a lifecycle event (via NotificationRepository) and have it be
 * read back by these same routes — previously the two sides wrote to and read
 * from different database files, so gateway-fired notifications were invisible.
 *
 * The routes still use raw SQL against `getNotificationDb()`; it just returns the
 * shared connection now, whose schema (initializeSchema) owns the notifications
 * table. getNotificationDb/initNotificationDb keep their names so the
 * consolidated-api wiring is unchanged.
 */
export function getNotificationDb(): Database.Database {
  return getDatabase();
}

export function initNotificationDb(): void {
  // Ensure the shared schema (which owns the notifications table) is initialised.
  createRepositories();
  console.log('[Notification DB] Using shared @aib-iaas/database store');
}
