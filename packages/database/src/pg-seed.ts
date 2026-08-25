import { Pool } from 'pg';
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

  await pool.query(`
    INSERT INTO users (id, email, first_name, last_name, role_id, organisation_id, status) VALUES
    ('user-admin', 'admin@aib-poc.example.com', 'Admin', 'User', 'role-sysadmin', 'org-aib', 'active'),
    ('user-demo', 'demo@example.com', 'Demo', 'User', 'role-officer', 'org-aib', 'active'),
    ('user-adviser', 'adviser@cas.example.org', 'Karen', 'MacLeod', 'role-adviser', 'org-cas', 'active'),
    ('user-debtor', 'john.testerton@example.com', 'John', 'Testerton', 'role-debtor', NULL, 'active'),
    ('user-cyberops', 'david.chen@aib.gov.uk', 'David', 'Chen', 'role-cyberops', 'org-aib', 'active'),
    ('user-stats', 'stats@aib.gov.uk', 'Analytics', 'User', 'role-statistician', 'org-aib', 'active')
    ON CONFLICT (id) DO NOTHING;
  `);

  console.log('[PostgreSQL] Seed data inserted (5 orgs, 6 users)');
}
