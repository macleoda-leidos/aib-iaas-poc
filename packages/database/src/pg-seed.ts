import { Pool } from 'pg';
import { DEMO_MFA_SECRET } from '@aib-iaas/auth';
import { getDemoPasswordHash } from './schema';
import { PERMISSIONS, ROLES, resolveGrants, seedRbacPostgres } from './rbac';

export async function seedPgDatabase(pool: Pool): Promise<void> {
  // RBAC is seeded unconditionally, ahead of the "already seeded" guard below.
  // The guard tests for roles, and roles were the one thing this function did
  // insert — so any database seeded before permissions existed would return
  // early here forever and keep every role on zero permissions. The inserts are
  // idempotent, so re-running costs nothing.
  await seedRbacPostgres(pool);
  console.log(
    `[PostgreSQL] RBAC seeded (${ROLES.length} roles, ${PERMISSIONS.length} permissions, ${resolveGrants().length} grants)`
  );

  // Purge withdrawn permission codes (GAP-011 residual #4) — INSERT ... ON
  // CONFLICT DO NOTHING adds new codes but never removes obsolete ones, so an
  // existing Neon database keeps stale codes and their grants. role_permissions
  // is ON DELETE CASCADE, so dropping the permission drops its grants too.
  const canonicalCodes = PERMISSIONS.map(p => p.code);
  const placeholders = canonicalCodes.map((_, i) => `$${i + 1}`).join(', ');
  await pool.query(`DELETE FROM permissions WHERE code NOT IN (${placeholders})`, canonicalCodes);

  const { rows } = await pool.query('SELECT COUNT(*) as c FROM organisations');
  if (parseInt(rows[0].c) > 0) { console.log('[PostgreSQL] Already seeded — skipping'); return; }

  await pool.query(`
    INSERT INTO organisations (id, name, type, status) VALUES
    ('org-aib', 'Accountant in Bankruptcy', 'aib', 'active'),
    ('org-cas', 'Citizens Advice Scotland', 'money_adviser', 'active'),
    ('org-rbs', 'Royal Bank of Scotland', 'creditor', 'active'),
    ('org-stepchange', 'StepChange Scotland', 'money_adviser', 'active'),
    ('org-wylie', 'Wylie & Bisset LLP', 'trust_deed_provider', 'active')
    ON CONFLICT (id) DO NOTHING;
  `);

  // Real bcrypt('demo') hash for every user; demo TOTP secret and mfa_enabled on
  // the two accounts the demo/admin flow uses, matching the SQLite inline seed.
  const demoHash = getDemoPasswordHash();
  const pgUsers: Array<[string, string, string, string, string, string | null, boolean]> = [
    ['user-admin', 'admin@aib-poc.example.com', 'Admin', 'User', 'role-sysadmin', 'org-aib', true],
    ['user-demo', 'demo@example.com', 'Demo', 'User', 'role-officer', 'org-aib', true],
    ['user-adviser', 'adviser@cas.example.org', 'Karen', 'MacLeod', 'role-adviser', 'org-cas', false],
    ['user-debtor', 'john.testerton@example.com', 'John', 'Testerton', 'role-debtor', null, false],
    ['user-cyberops', 'david.chen@aib.gov.uk', 'David', 'Chen', 'role-cyberops', 'org-aib', false],
    ['user-stats', 'stats@aib.gov.uk', 'Analytics', 'User', 'role-statistician', 'org-aib', false],
  ];
  for (const [id, email, firstName, lastName, roleId, orgId, mfa] of pgUsers) {
    await pool.query(
      `INSERT INTO users (id, email, first_name, last_name, role_id, organisation_id, status, password_hash, mfa_enabled, mfa_secret)
       VALUES ($1, $2, $3, $4, $5, $6, 'active', $7, $8, $9) ON CONFLICT (id) DO NOTHING`,
      [id, email, firstName, lastName, roleId, orgId, demoHash, mfa, mfa ? DEMO_MFA_SECRET : null]
    );
  }

  console.log('[PostgreSQL] Seed data inserted (5 orgs, 6 users)');
}
