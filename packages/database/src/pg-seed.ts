import { Pool } from 'pg';

export async function seedPgDatabase(pool: Pool): Promise<void> {
  const { rows } = await pool.query('SELECT COUNT(*) as c FROM roles');
  if (parseInt(rows[0].c) > 0) { console.log('[PostgreSQL] Already seeded — skipping'); return; }

  await pool.query(`
    INSERT INTO roles (id, name, display_name, description, level) VALUES
    ('role-sysadmin', 'system_admin', 'System Administrator', 'Full access', 100),
    ('role-senior', 'aib_senior_officer', 'AiB Senior Officer', 'Approve applications', 80),
    ('role-officer', 'aib_officer', 'AiB Case Officer', 'Process applications', 60),
    ('role-adviser', 'money_adviser', 'Money Adviser', 'Submit on behalf of clients', 50),
    ('role-debtor', 'debtor', 'Debtor', 'Apply for debt solutions', 10),
    ('role-cyberops', 'cyberops_analyst', 'CyberOps Analyst', 'Security monitoring', 70),
    ('role-statistician', 'statistician', 'AiB Statistician', 'Analytics and reporting', 40),
    ('role-creditor', 'creditor', 'Creditor', 'View cases and submit claims', 30),
    ('role-supplier', 'supplier_trustee', 'Supplier/Trustee', 'Manage assigned cases', 40)
    ON CONFLICT (id) DO NOTHING;
  `);

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

  console.log('[PostgreSQL] Seed data inserted (9 roles, 5 orgs, 6 users)');
}
