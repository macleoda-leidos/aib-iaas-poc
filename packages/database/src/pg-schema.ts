import { Pool } from 'pg';

export async function initPgSchema(pool: Pool): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS roles (id TEXT PRIMARY KEY, name TEXT UNIQUE NOT NULL, display_name TEXT NOT NULL, description TEXT, level INTEGER DEFAULT 0, created_at TIMESTAMPTZ DEFAULT NOW());
    CREATE TABLE IF NOT EXISTS permissions (id TEXT PRIMARY KEY, code TEXT UNIQUE NOT NULL, name TEXT NOT NULL, description TEXT, resource TEXT NOT NULL, action TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS role_permissions (role_id TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE, permission_id TEXT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE, PRIMARY KEY (role_id, permission_id));
    CREATE TABLE IF NOT EXISTS organisations (id TEXT PRIMARY KEY, name TEXT NOT NULL, type TEXT NOT NULL, parent_id TEXT, status TEXT DEFAULT 'active', registration_number TEXT, contact_email TEXT, contact_phone TEXT, address_line1 TEXT, address_city TEXT, address_postcode TEXT, metadata TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW());
    CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, first_name TEXT NOT NULL, last_name TEXT NOT NULL, display_name TEXT, role_id TEXT REFERENCES roles(id), organisation_id TEXT, status TEXT DEFAULT 'active', password_hash TEXT, mfa_enabled BOOLEAN DEFAULT false, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW());
    CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, user_id TEXT REFERENCES users(id) ON DELETE CASCADE, token TEXT UNIQUE NOT NULL, expires_at TIMESTAMPTZ NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW());
    CREATE TABLE IF NOT EXISTS applications (id TEXT PRIMARY KEY, reference_number TEXT UNIQUE NOT NULL, status TEXT DEFAULT 'draft', system_checks TEXT, credit_check TEXT, assigned_to TEXT, submitted_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW());
    CREATE TABLE IF NOT EXISTS applicants (id TEXT PRIMARY KEY, application_id TEXT UNIQUE REFERENCES applications(id) ON DELETE CASCADE, title TEXT, first_name TEXT NOT NULL, last_name TEXT NOT NULL, date_of_birth TEXT, ni_number TEXT, marital_status TEXT, dependants INTEGER DEFAULT 0, employment TEXT, email TEXT, phone TEXT);
    CREATE TABLE IF NOT EXISTS addresses (id TEXT PRIMARY KEY, application_id TEXT REFERENCES applications(id) ON DELETE CASCADE, line1 TEXT NOT NULL, line2 TEXT, city TEXT NOT NULL, postcode TEXT NOT NULL, is_current BOOLEAN DEFAULT false, resident_from TEXT, resident_to TEXT);
    CREATE TABLE IF NOT EXISTS debts (id TEXT PRIMARY KEY, application_id TEXT REFERENCES applications(id) ON DELETE CASCADE, creditor TEXT NOT NULL, type TEXT NOT NULL, amount DOUBLE PRECISION NOT NULL, monthly_payment DOUBLE PRECISION DEFAULT 0, account_ref TEXT);
    CREATE TABLE IF NOT EXISTS assets (id TEXT PRIMARY KEY, application_id TEXT REFERENCES applications(id) ON DELETE CASCADE, type TEXT NOT NULL, description TEXT NOT NULL, value DOUBLE PRECISION NOT NULL, outstanding DOUBLE PRECISION DEFAULT 0, is_essential BOOLEAN DEFAULT false);
    CREATE TABLE IF NOT EXISTS income_expenditure (id TEXT PRIMARY KEY, application_id TEXT UNIQUE REFERENCES applications(id) ON DELETE CASCADE, income TEXT NOT NULL, expenditure TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS documents (id TEXT PRIMARY KEY, application_id TEXT REFERENCES applications(id) ON DELETE CASCADE, filename TEXT NOT NULL, original_name TEXT NOT NULL, mime_type TEXT NOT NULL, size INTEGER NOT NULL, category TEXT NOT NULL, storage_path TEXT NOT NULL, scan_status TEXT DEFAULT 'pending', scan_result TEXT, uploaded_at TIMESTAMPTZ DEFAULT NOW());
    CREATE TABLE IF NOT EXISTS recommendations (id TEXT PRIMARY KEY, application_id TEXT UNIQUE REFERENCES applications(id) ON DELETE CASCADE, product TEXT NOT NULL, confidence TEXT NOT NULL, confidence_pct INTEGER NOT NULL, reasoning TEXT NOT NULL, factors TEXT NOT NULL, alternatives TEXT NOT NULL, engine_version TEXT NOT NULL, generated_at TIMESTAMPTZ DEFAULT NOW());
    CREATE TABLE IF NOT EXISTS audit_events (id TEXT PRIMARY KEY, application_id TEXT, action TEXT NOT NULL, actor_id TEXT, actor_name TEXT, actor_type TEXT NOT NULL, details TEXT, timestamp TIMESTAMPTZ DEFAULT NOW());
    CREATE TABLE IF NOT EXISTS payments (id TEXT PRIMARY KEY, application_id TEXT REFERENCES applications(id), amount DOUBLE PRECISION NOT NULL, currency TEXT DEFAULT 'GBP', status TEXT DEFAULT 'pending', provider TEXT, provider_ref TEXT, paid_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT NOW());
    CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
    CREATE INDEX IF NOT EXISTS idx_applications_ref ON applications(reference_number);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_audit_app ON audit_events(application_id);
    CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_events(timestamp);
  `);
  console.log('[PostgreSQL] Schema initialized (16 tables + 5 indexes)');
}
