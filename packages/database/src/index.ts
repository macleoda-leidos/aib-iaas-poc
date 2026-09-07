export { getDatabase, closeDatabase, getDatabasePath } from './connection';
export { initializeSchema } from './schema';

// RBAC reference data — the single definition of roles, permissions and grants
export {
  ROLES,
  PERMISSIONS,
  ROLE_GRANTS,
  resolveGrants,
  seedRbacSqlite,
  seedRbacPostgres,
} from './rbac';
export type { SeedRole, SeedPermission, RoleGrant } from './rbac';

// PostgreSQL support (dual-mode)
export { isPostgresEnabled, getPgPool, closePgPool } from './pg-connection';
export { initPgSchema } from './pg-schema';
export { seedPgDatabase } from './pg-seed';
export { seedPgApplications } from './pg-seed-applications';

// The one async query surface the repositories are built on. Exported so services
// with raw SQL of their own (api-gateway's reports, consolidated-api's demo seed)
// can reach both backends the same way the repositories do, rather than holding a
// better-sqlite3 handle that PostgreSQL never sees.
export {
  toPostgresPlaceholders,
  createSqliteDriver,
  createPostgresDriver,
} from './driver';
export type { DbDriver, RunResult } from './driver';

// Versioned schema changes. `CREATE TABLE IF NOT EXISTS` cannot alter a database
// that already exists; this is what can, and it records what it did.
export { runMigrations, appliedMigrations, MIGRATIONS } from './migrations';
export type { Migration } from './migrations';

// The relational detail behind the 100 demo applications — debts, addresses, income,
// recommendations, audit trail and payments. Driver-based, so it seeds both backends
// from one definition.
export { seedDemoDetail } from './seed-demo';
export type { DemoSeedCounts } from './seed-demo';

// Repositories
export { ApplicationRepository } from './repositories/applications';
export { AuditRepository } from './repositories/audit';
export { RecommendationRepository } from './repositories/recommendations';
export { UserRepository } from './repositories/users';
export { DocumentRepository } from './repositories/documents';
export { OrganisationRepository } from './repositories/organisations';
export { PaymentRepository } from './repositories/payments';
export { ConsentRepository, CONSENT_VALIDITY_DAYS } from './repositories/consents';

// Types - Applications
export type {
  Application,
  ApplicationWithRelations,
  Applicant,
  Address,
  Debt,
  Asset,
  IncomeExpenditure,
  CreateApplicationInput,
  CreateApplicantInput,
  CreateAddressInput,
  CreateDebtInput,
  CreateAssetInput,
  CreateIncomeExpenditureInput,
  ListApplicationsParams,
} from './repositories/applications';

// Types - Audit
export type {
  AuditEvent,
  CreateAuditEventInput,
  ListAuditEventsParams,
} from './repositories/audit';

// Types - Recommendations
export type {
  Recommendation,
  CreateRecommendationInput,
} from './repositories/recommendations';

// Types - Consents
export type {
  Consent,
  RecordConsentInput,
} from './repositories/consents';

// Types - Users
export type {
  User,
  UserWithRole,
  Role,
  Permission,
  Session,
  CreateUserInput,
  ListUsersParams,
} from './repositories/users';

// Types - Documents
export type {
  Document,
  CreateDocumentInput,
} from './repositories/documents';

// Types - Organisations
export type {
  Organisation,
  CreateOrganisationInput,
  ListOrganisationsParams,
} from './repositories/organisations';

// Types - Payments
export type {
  Payment,
  CreatePaymentInput,
} from './repositories/payments';

// ─── Convenience factory ───────────────────────

import { getDatabase } from './connection';
import { initializeSchema } from './schema';
import { isPostgresEnabled, getPgPool } from './pg-connection';
import { initPgSchema } from './pg-schema';
import { seedPgDatabase } from './pg-seed';
import { createSqliteDriver, createPostgresDriver } from './driver';
import type { DbDriver } from './driver';
import { runMigrations } from './migrations';
import { ApplicationRepository } from './repositories/applications';
import { AuditRepository } from './repositories/audit';
import { RecommendationRepository } from './repositories/recommendations';
import { UserRepository } from './repositories/users';
import { DocumentRepository } from './repositories/documents';
import { OrganisationRepository } from './repositories/organisations';
import { PaymentRepository } from './repositories/payments';
import { ConsentRepository } from './repositories/consents';

export interface Repositories {
  applications: ApplicationRepository;
  audit: AuditRepository;
  recommendations: RecommendationRepository;
  users: UserRepository;
  documents: DocumentRepository;
  organisations: OrganisationRepository;
  payments: PaymentRepository;
  consents: ConsentRepository;
  /**
   * The driver the repositories were built on, for the few callers with SQL of
   * their own — api-gateway's dashboard aggregates, consolidated-api's demo seed.
   * Exposed so they share this connection and this dialect rather than opening a
   * better-sqlite3 handle that PostgreSQL never sees.
   */
  driver: DbDriver;
}

/**
 * Pick the backend from the environment: PostgreSQL when `DATABASE_URL` is a
 * `postgresql://` URI, SQLite otherwise.
 *
 * Both connection constructors are lazy and synchronous — `getDatabase()` opens a
 * file handle, and `pg.Pool` does not connect until its first query — so choosing
 * a driver costs nothing and cannot fail here for want of a reachable server.
 */
export function createDriver(): DbDriver {
  return isPostgresEnabled() ? createPostgresDriver(getPgPool()) : createSqliteDriver(getDatabase());
}

/**
 * Create all repositories over whichever backend the environment selects.
 *
 * Stays synchronous. Four services do `export const repos = createRepositories()`
 * at module top level and re-export destructured members; an async factory would
 * make `repos` a promise and break all four. Nothing here needs to await:
 * connections are lazy, and the only async step — PostgreSQL schema creation —
 * lives in `initialiseDatabase()` below.
 *
 * Usage:
 *   import { createRepositories } from '@aib-iaas/database';
 *   const repos = createRepositories();
 *   const app = await repos.applications.findById('...');
 */
export function createRepositories(): Repositories {
  const driver = createDriver();

  // SQLite's schema creation is synchronous, and is done here rather than in
  // `initialiseDatabase()` so that importing a service's app is enough to have a
  // usable database — which is how every service test obtains one. PostgreSQL
  // cannot follow suit, hence the separate awaited call.
  if (driver.dialect === 'sqlite') {
    initializeSchema(getDatabase());
  }

  return {
    applications: new ApplicationRepository(driver),
    audit: new AuditRepository(driver),
    recommendations: new RecommendationRepository(driver),
    users: new UserRepository(driver),
    documents: new DocumentRepository(driver),
    organisations: new OrganisationRepository(driver),
    payments: new PaymentRepository(driver),
    consents: new ConsentRepository(driver),
    driver,
  };
}

/**
 * Bring the selected backend's schema into existence, and its reference data with
 * it. Await this during service bootstrap, before accepting requests.
 *
 * Idempotent on both backends: every statement is `CREATE ... IF NOT EXISTS` or a
 * conflict-tolerant insert, so a second call is a no-op rather than an error.
 */
export async function initialiseDatabase(): Promise<void> {
  const driver = createDriver();

  if (isPostgresEnabled()) {
    const pool = getPgPool();
    await initPgSchema(pool);
    // Roles, permissions, organisations and users — the equivalent of what
    // initializeSchema() seeds into SQLite. Without it every RBAC check on a fresh
    // Neon database fails against an empty roles table.
    await seedPgDatabase(pool);
  } else {
    initializeSchema(getDatabase());
  }

  // After the CREATE statements, which only ever act on a database that does not yet
  // have the table. Migrations are what reach a database that already exists — see
  // ./migrations.ts for what this runner does and does not promise.
  await runMigrations(driver);
}
