export { getDatabase, closeDatabase, getDatabasePath } from './connection';
export { initializeSchema } from './schema';

// PostgreSQL support (dual-mode)
export { isPostgresEnabled, getPgPool, closePgPool } from './pg-connection';
export { initPgSchema } from './pg-schema';
export { seedPgDatabase } from './pg-seed';

// Repositories
export { ApplicationRepository } from './repositories/applications';
export { AuditRepository } from './repositories/audit';
export { RecommendationRepository } from './repositories/recommendations';
export { UserRepository } from './repositories/users';
export { DocumentRepository } from './repositories/documents';
export { OrganisationRepository } from './repositories/organisations';
export { PaymentRepository } from './repositories/payments';

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
import { ApplicationRepository } from './repositories/applications';
import { AuditRepository } from './repositories/audit';
import { RecommendationRepository } from './repositories/recommendations';
import { UserRepository } from './repositories/users';
import { DocumentRepository } from './repositories/documents';
import { OrganisationRepository } from './repositories/organisations';
import { PaymentRepository } from './repositories/payments';

export interface Repositories {
  applications: ApplicationRepository;
  audit: AuditRepository;
  recommendations: RecommendationRepository;
  users: UserRepository;
  documents: DocumentRepository;
  organisations: OrganisationRepository;
  payments: PaymentRepository;
}

/**
 * Create all repositories from a single database connection.
 * Initializes the schema on first call.
 *
 * Usage:
 *   import { createRepositories } from '@aib-iaas/database';
 *   const repos = createRepositories();
 *   const app = repos.applications.findById('...');
 */
export function createRepositories(): Repositories {
  const db = getDatabase();
  initializeSchema(db);

  return {
    applications: new ApplicationRepository(db),
    audit: new AuditRepository(db),
    recommendations: new RecommendationRepository(db),
    users: new UserRepository(db),
    documents: new DocumentRepository(db),
    organisations: new OrganisationRepository(db),
    payments: new PaymentRepository(db),
  };
}
