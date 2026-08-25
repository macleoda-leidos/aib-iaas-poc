import { getDatabase } from './connection';
import { initializeSchema } from './schema';
import { PERMISSIONS, ROLES, resolveGrants, seedRbacSqlite } from './rbac';
import { readFileSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';

function loadJSON(filename: string): any[] {
  const filePath = join(__dirname, 'seed-data', filename);
  return JSON.parse(readFileSync(filePath, 'utf-8'));
}

/**
 * Seeds the database with all reference and sample data from JSON files.
 * Idempotent — uses INSERT OR IGNORE for reference data.
 */
export function seedDatabase(): void {
  const db = getDatabase();
  initializeSchema(db);

  console.log('[Database] Seeding...');

  // ─── Roles, permissions and grants ───────────
  // initializeSchema above has already applied these; calling it explicitly
  // keeps this function's output a complete account of what was seeded rather
  // than relying on a side effect of schema initialisation.
  seedRbacSqlite(db);
  console.log(`  [+] ${ROLES.length} roles`);
  console.log(`  [+] ${PERMISSIONS.length} permissions`);
  console.log(`  [+] ${resolveGrants().length} role-permission grants`);

  // ─── Organisations ───────────────────────────
  const orgs = loadJSON('organisations.json');
  const insertOrg = db.prepare(`
    INSERT OR IGNORE INTO organisations (id, name, type, parent_id, status, registration_number, contact_email, contact_phone, address_line1, address_city, address_postcode, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `);
  for (const org of orgs) {
    insertOrg.run(
      org.id, org.name, org.type, org.parentId || null,
      org.status, org.registrationNumber || null,
      org.contactEmail || null, org.contactPhone || null,
      org.addressLine1 || null, org.addressCity || null, org.addressPostcode || null
    );
  }
  console.log(`  [+] ${orgs.length} organisations`);

  // ─── Users ───────────────────────────────────
  const users = loadJSON('users.json');
  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users (id, email, first_name, last_name, display_name, role_id, organisation_id, status, mfa_enabled, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `);
  for (const user of users) {
    insertUser.run(
      user.id, user.email, user.firstName, user.lastName,
      user.displayName || `${user.firstName} ${user.lastName}`,
      user.roleId, user.organisationId || null,
      user.status, user.mfaEnabled ? 1 : 0
    );
  }
  console.log(`  [+] ${users.length} users`);

  // ─── Applications with related data ──────────
  const applications = loadJSON('applications.json');
  const insertApp = db.prepare(`
    INSERT OR IGNORE INTO applications (id, reference_number, status, assigned_to, submitted_at, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `);
  const insertApplicant = db.prepare(`
    INSERT OR IGNORE INTO applicants (id, application_id, title, first_name, last_name, date_of_birth, ni_number, marital_status, dependants, employment, email, phone)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertAddress = db.prepare(`
    INSERT OR IGNORE INTO addresses (id, application_id, line1, line2, city, postcode, is_current, resident_from, resident_to)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertDebt = db.prepare(`
    INSERT OR IGNORE INTO debts (id, application_id, creditor, type, amount, monthly_payment, account_ref)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const insertAsset = db.prepare(`
    INSERT OR IGNORE INTO assets (id, application_id, type, description, value, outstanding, is_essential)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const insertIE = db.prepare(`
    INSERT OR IGNORE INTO income_expenditure (id, application_id, income, expenditure)
    VALUES (?, ?, ?, ?)
  `);
  const insertRec = db.prepare(`
    INSERT OR IGNORE INTO recommendations (id, application_id, product, confidence, confidence_pct, reasoning, factors, alternatives, engine_version, generated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `);

  const seedApps = db.transaction(() => {
    for (const app of applications) {
      insertApp.run(app.id, app.referenceNumber, app.status, app.assignedTo || null, app.submittedAt || null);

      if (app.applicant) {
        const a = app.applicant;
        insertApplicant.run(
          `${app.id}-applicant`, app.id,
          a.title || null, a.firstName, a.lastName,
          a.dateOfBirth || null, a.niNumber || null,
          a.maritalStatus || null, a.dependants || 0,
          a.employment || null, a.email || null, a.phone || null
        );
      }

      if (app.addresses) {
        for (let i = 0; i < app.addresses.length; i++) {
          const addr = app.addresses[i];
          insertAddress.run(
            `${app.id}-addr-${i}`, app.id,
            addr.line1, addr.line2 || null, addr.city, addr.postcode,
            addr.isCurrent ? 1 : 0,
            addr.residentFrom || null, addr.residentTo || null
          );
        }
      }

      if (app.debts) {
        for (let i = 0; i < app.debts.length; i++) {
          const d = app.debts[i];
          insertDebt.run(
            `${app.id}-debt-${i}`, app.id,
            d.creditor, d.type, d.amount, d.monthlyPayment || 0, d.accountRef || null
          );
        }
      }

      if (app.assets) {
        for (let i = 0; i < app.assets.length; i++) {
          const a = app.assets[i];
          insertAsset.run(
            `${app.id}-asset-${i}`, app.id,
            a.type, a.description, a.value, a.outstanding || 0, a.isEssential ? 1 : 0
          );
        }
      }

      if (app.incomeExpenditure) {
        insertIE.run(
          `${app.id}-ie`, app.id,
          JSON.stringify(app.incomeExpenditure.income),
          JSON.stringify(app.incomeExpenditure.expenditure)
        );
      }

      if (app.recommendation) {
        const r = app.recommendation;
        insertRec.run(
          `${app.id}-rec`, app.id,
          r.product, r.confidence, r.confidencePct,
          JSON.stringify(r.reasoning), JSON.stringify(r.factors),
          JSON.stringify(r.alternatives), r.engineVersion
        );
      }
    }
  });
  seedApps();
  console.log(`  [+] ${applications.length} applications (with relations)`);

  // ─── Audit Events ────────────────────────────
  const auditEvents = loadJSON('audit-events.json');
  const insertAudit = db.prepare(`
    INSERT OR IGNORE INTO audit_events (id, application_id, action, actor_id, actor_name, actor_type, details, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const evt of auditEvents) {
    insertAudit.run(
      evt.id, evt.applicationId || null, evt.action,
      evt.actorId || null, evt.actorName || null, evt.actorType,
      evt.details ? JSON.stringify(evt.details) : null,
      evt.timestamp
    );
  }
  console.log(`  [+] ${auditEvents.length} audit events`);

  console.log('[Database] Seed complete!');
}

// Allow running directly: npx tsx packages/database/src/seed.ts
if (require.main === module) {
  seedDatabase();
}
