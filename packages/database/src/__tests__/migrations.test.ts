import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { createSqliteDriver, type DbDriver } from '../driver';
import { runMigrations, appliedMigrations, MIGRATIONS } from '../migrations';

/**
 * The migration runner.
 *
 * What it exists to prevent: the schema files are idempotent `CREATE TABLE IF NOT
 * EXISTS` blocks, so a column added to a CREATE statement never reaches a database
 * that already exists, and nothing recorded which shape a given deployment was in.
 * The failure mode is a query referencing a column the schema file declares and the
 * database does not have — at runtime, in production, on the deployed Neon database
 * rather than on any developer's fresh one.
 *
 * The awkward case, and the one most of these cover: a column added by a migration is
 * *also* declared in the CREATE statement, so a fresh database already has it. The
 * migration must therefore be a no-op that still records itself, or it would fail on
 * every new database — the exact opposite of the problem it solves.
 */

let db: Database.Database;
let driver: DbDriver;

/**
 * The RBAC tables the *data* migrations write into.
 *
 * These are owned by `schema.ts`, not by any migration — `initialiseDatabase()` runs the
 * schema first and the migrations after, so in every real boot they are already there.
 * They are created here because these cases exercise `runMigrations`, which runs the whole
 * chain rather than only the one migration under discussion. Kept minimal on purpose: a
 * copy of the real schema would drift from it, and the migrations only touch these columns.
 */
function createRbacTables(): void {
  db.exec(`
    CREATE TABLE permissions (
      id TEXT PRIMARY KEY, code TEXT UNIQUE NOT NULL, name TEXT NOT NULL,
      description TEXT, resource TEXT NOT NULL, action TEXT NOT NULL
    );
    CREATE TABLE role_permissions (
      role_id TEXT NOT NULL, permission_id TEXT NOT NULL,
      PRIMARY KEY (role_id, permission_id)
    );
  `);
}

/** The applications table as it was *before* the debtor_user_id migration. */
function createLegacySchema(): void {
  db.exec(`
    CREATE TABLE users (id TEXT PRIMARY KEY, email TEXT);
    CREATE TABLE applications (
      id TEXT PRIMARY KEY,
      reference_number TEXT UNIQUE NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft'
    );
  `);
  createRbacTables();
}

/** The applications table as a fresh database gets it, column already present. */
function createCurrentSchema(): void {
  db.exec(`
    CREATE TABLE users (id TEXT PRIMARY KEY, email TEXT);
    CREATE TABLE applications (
      id TEXT PRIMARY KEY,
      reference_number TEXT UNIQUE NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      debtor_user_id TEXT REFERENCES users(id)
    );
  `);
  createRbacTables();
}

function columnNames(table: string): string[] {
  return (db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>).map(c => c.name);
}

beforeEach(() => {
  db = new Database(':memory:');
  driver = createSqliteDriver(db);
});

afterEach(() => db.close());

describe('on a database that predates a migration', () => {
  it('adds the missing column', async () => {
    createLegacySchema();
    expect(columnNames('applications')).not.toContain('debtor_user_id');

    await runMigrations(driver);

    expect(columnNames('applications')).toContain('debtor_user_id');
  });

  it('preserves the rows that were already there', async () => {
    // The whole point is to evolve a database in use. Losing its contents would be a
    // worse outcome than the missing column.
    createLegacySchema();
    db.prepare("INSERT INTO applications (id, reference_number, status) VALUES ('a', 'IAAS-2026-00001', 'submitted')").run();

    await runMigrations(driver);

    const row = db.prepare('SELECT * FROM applications WHERE id = ?').get('a') as any;
    expect(row.reference_number).toBe('IAAS-2026-00001');
    expect(row.status).toBe('submitted');
    expect(row.debtor_user_id).toBeNull();
  });

  it('records what it applied', async () => {
    createLegacySchema();
    await runMigrations(driver);
    expect(await appliedMigrations(driver)).toContain('001-applications-debtor-user-id');
  });
});

describe('on a fresh database that already has the column', () => {
  it('does not fail, even though SQLite has no ADD COLUMN IF NOT EXISTS', async () => {
    // Without the skip guard this throws "duplicate column name" on every new
    // database — so the migration that fixes existing deployments would break new ones.
    createCurrentSchema();
    await expect(runMigrations(driver)).resolves.toBeDefined();
  });

  it('still records the migration, so it is not retried for ever', async () => {
    createCurrentSchema();
    await runMigrations(driver);
    expect(await appliedMigrations(driver)).toEqual(MIGRATIONS.map(m => m.id));
  });
});

describe('idempotence', () => {
  it('applies nothing on a second run', async () => {
    createLegacySchema();
    const first = await runMigrations(driver);
    const second = await runMigrations(driver);

    expect(first).toEqual(MIGRATIONS.map(m => m.id));
    expect(second).toEqual([]);
  });

  it('records each migration exactly once across repeated boots', async () => {
    // Every service boot calls this. A duplicate insert would fail on the primary key
    // and take the service down on its second start.
    createLegacySchema();
    for (let i = 0; i < 5; i++) await runMigrations(driver);

    const rows = db.prepare('SELECT id, COUNT(*) as n FROM schema_migrations GROUP BY id').all() as Array<{ n: number }>;
    expect(rows.every(r => r.n === 1)).toBe(true);
  });

  it('creates its bookkeeping table on first use', async () => {
    createLegacySchema();
    await runMigrations(driver);

    const exists = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='schema_migrations'")
      .get();
    expect(exists).toBeDefined();
  });
});

describe('a data migration whose prerequisite table is missing', () => {
  it('fails, naming the migration and the table', async () => {
    // A grant into `permissions` when that table does not exist means schema
    // initialisation has not run — an ordering bug. SQLite's own error is a bare
    // "no such table: permissions" that names neither the migration nor the cause.
    db.exec(`
      CREATE TABLE users (id TEXT PRIMARY KEY, email TEXT);
      CREATE TABLE applications (id TEXT PRIMARY KEY, reference_number TEXT UNIQUE NOT NULL, status TEXT);
    `);

    await expect(runMigrations(driver)).rejects.toThrow(/002-notifications-send-permission.*permissions/s);
  });

  it('does not record the migration it could not run', async () => {
    // The important half. Recording it would mean the permission is never granted, never
    // retried, and nothing anywhere shows that it did not happen — which is exactly the
    // class of silent drift this runner exists to remove.
    db.exec(`
      CREATE TABLE users (id TEXT PRIMARY KEY, email TEXT);
      CREATE TABLE applications (id TEXT PRIMARY KEY, reference_number TEXT UNIQUE NOT NULL, status TEXT);
    `);

    await expect(runMigrations(driver)).rejects.toThrow();
    expect(await appliedMigrations(driver)).not.toContain('002-notifications-send-permission');
  });

  it('applies once the prerequisite exists', async () => {
    // And recovers without intervention: fix the ordering, boot again, it lands.
    db.exec(`
      CREATE TABLE users (id TEXT PRIMARY KEY, email TEXT);
      CREATE TABLE applications (id TEXT PRIMARY KEY, reference_number TEXT UNIQUE NOT NULL, status TEXT);
    `);
    await expect(runMigrations(driver)).rejects.toThrow();

    createRbacTables();
    await runMigrations(driver);

    expect(await appliedMigrations(driver)).toEqual(MIGRATIONS.map(m => m.id));
  });
});

describe('the notifications.send grant', () => {
  it('creates the permission and grants it to the casework roles only', async () => {
    createLegacySchema();
    await runMigrations(driver);

    const perm = db.prepare("SELECT * FROM permissions WHERE code = 'notifications.send'").get() as any;
    expect(perm).toBeDefined();

    const roles = (db
      .prepare("SELECT role_id FROM role_permissions WHERE permission_id = 'perm-notif-send' ORDER BY role_id")
      .all() as Array<{ role_id: string }>).map(r => r.role_id);

    expect(roles).toEqual(['role-adviser', 'role-officer', 'role-senior', 'role-sysadmin']);
    // A debtor holding this would restore the phishing primitive the permission exists to
    // remove, so its absence is asserted rather than merely implied by the list.
    expect(roles).not.toContain('role-debtor');
  });

  it('tolerates the permission already being seeded', async () => {
    // A database seeded from seed-data/permissions.json already has this row, so the
    // migration must be an upsert rather than an insert — otherwise it fails on the
    // primary key on every already-seeded deployment.
    createLegacySchema();
    db.prepare(
      "INSERT INTO permissions (id, code, name, description, resource, action) VALUES ('perm-notif-send', 'notifications.send', 'Send Notifications', 'x', 'notifications', 'send')"
    ).run();
    db.prepare("INSERT INTO role_permissions (role_id, permission_id) VALUES ('role-sysadmin', 'perm-notif-send')").run();

    await expect(runMigrations(driver)).resolves.toBeDefined();

    const count = (db.prepare("SELECT COUNT(*) as n FROM permissions WHERE code = 'notifications.send'").get() as any).n;
    expect(count).toBe(1);
  });
});

describe('the consents table', () => {
  it('is created with the columns the repository reads', async () => {
    createLegacySchema();
    await runMigrations(driver);

    expect(columnNames('consents').sort()).toEqual([
      'application_id', 'consent_given', 'consent_type', 'debtor_id', 'expires_at',
      'id', 'ip_address', 'recorded_at', 'recorded_by', 'user_agent', 'withdrawn_at',
    ]);
  });

  it('does not fail on a database that already has it', async () => {
    // Declared in schema.ts as well, so a fresh database has it before migrations run and
    // the migration must be a no-op. The table is created here with its real columns
    // rather than as a one-column stub: the migration also creates an index over
    // (application_id, consent_type), which a stub would fail on for the wrong reason.
    createLegacySchema();
    db.exec(`
      CREATE TABLE consents (
        id TEXT PRIMARY KEY, application_id TEXT NOT NULL, debtor_id TEXT,
        consent_type TEXT NOT NULL, consent_given INTEGER NOT NULL,
        recorded_at TEXT NOT NULL, expires_at TEXT NOT NULL, recorded_by TEXT,
        ip_address TEXT, user_agent TEXT, withdrawn_at TEXT
      );
    `);

    await expect(runMigrations(driver)).resolves.toBeDefined();
    expect(await appliedMigrations(driver)).toContain('003-consents');
  });
});

describe('the migration list itself', () => {
  it('has unique, ordered ids', async () => {
    // Order is the only thing that makes a migration list meaningful, and ids are
    // numbered so the sort is the apply order.
    const ids = MIGRATIONS.map(m => m.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect([...ids].sort()).toEqual(ids);
  });

  it('defines statements for both backends', async () => {
    // A migration with only one dialect filled in is a database that silently stops
    // evolving on the other one.
    for (const migration of MIGRATIONS) {
      expect(migration.sqlite.length, migration.id).toBeGreaterThan(0);
      expect(migration.postgres.length, migration.id).toBeGreaterThan(0);
      expect(migration.description.length, migration.id).toBeGreaterThan(20);
    }
  });

  it('uses ADD COLUMN IF NOT EXISTS in the PostgreSQL variants', async () => {
    // PostgreSQL supports it, so the postgres path should not depend on the skip
    // guard alone — belt and braces on the backend that holds the real data.
    for (const migration of MIGRATIONS) {
      for (const statement of migration.postgres) {
        if (statement.includes('ADD COLUMN')) {
          expect(statement, migration.id).toContain('IF NOT EXISTS');
        }
      }
    }
  });
});
