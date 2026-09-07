import type { DbDriver } from './driver';

/**
 * Versioned schema migrations, recorded so that a database's shape is knowable.
 *
 * The schema files next door are idempotent `CREATE TABLE IF NOT EXISTS` blocks,
 * which handle a *fresh* database perfectly and an *existing* one not at all: adding
 * a column to a CREATE statement is invisible to every database already created, and
 * nothing anywhere recorded which shape a given deployment was in. The first symptom
 * would be a query referencing a column the schema file declares and the database
 * does not have.
 *
 * This is a deliberately small runner rather than Drizzle or Prisma Migrate. What it
 * provides is the part that was missing and cannot be retrofitted later — a record of
 * what has been applied — while staying inside the driver abstraction so one
 * definition covers both backends. What it does **not** provide, and should not be
 * mistaken for:
 *
 *  - **No down migrations.** There is no rollback. A bad migration is fixed by
 *    writing another one.
 *  - **No schema diffing.** Migrations are hand-written; nothing checks that the
 *    accumulated migrations agree with `schema.ts` and `pg-schema.ts`.
 *  - **No locking.** Two instances starting simultaneously against one database could
 *    both attempt the same migration. Tolerable because every statement here is
 *    written to be idempotent anyway, and because the deployed topology is a single
 *    container — but it is the first thing that would need solving on more than one.
 *
 * When a real migration tool takes over, `schema_migrations` is the table it should
 * adopt or import, so the history is not lost.
 */

export interface Migration {
  /** Ordered, immutable identifier. Never renumber an applied migration. */
  id: string;
  description: string;
  /** Statements for SQLite, run in order. */
  sqlite: string[];
  /** Statements for PostgreSQL, run in order. */
  postgres: string[];
  /**
   * Skip the statements if this column already exists, but still record the
   * migration as applied.
   *
   * Needed because a column added here is *also* declared in the CREATE TABLE
   * statements, so a fresh database already has it. SQLite has no
   * `ADD COLUMN IF NOT EXISTS`, so without this the migration would fail on every
   * new database — the opposite of the problem it exists to solve.
   */
  skipIfColumnExists?: { table: string; column: string };
  /**
   * Tables this migration writes into but does not create.
   *
   * A *data* migration — granting a permission, backfilling a row — depends on tables the
   * schema files own. `initialiseDatabase()` runs the schema before the migrations, so in
   * every real boot they are present. If one is not, that is an ordering bug, and the
   * default SQLite error for it is a bare "no such table: permissions" with nothing naming
   * the migration that wanted it.
   *
   * Deliberately fails rather than skipping. Silently skipping would leave the permission
   * ungranted for ever *and* record the migration as applied, so it would never be
   * retried and nothing would show that it had not happened — which is the shape of defect
   * this whole file exists to remove.
   */
  requiresTables?: string[];
}

/**
 * "Insert this row unless it is already there", in each dialect's own spelling.
 *
 * Data migrations run against databases that may already have been seeded, so every
 * insert here must tolerate the row existing. SQLite spells it `INSERT OR IGNORE`;
 * PostgreSQL has no such form and needs `ON CONFLICT DO NOTHING`. Using the wrong
 * dialect's spelling is a syntax error rather than a silent one, which is the reason to
 * build the statement in one place rather than writing both by hand per migration.
 */
function upsert(table: string, columns: string, values: string, dialect: 'sqlite' | 'postgres'): string {
  return dialect === 'postgres'
    ? `INSERT INTO ${table} (${columns}) VALUES ${values} ON CONFLICT DO NOTHING`
    : `INSERT OR IGNORE INTO ${table} (${columns}) VALUES ${values}`;
}

/** SQL string literal. Only ever called with constants from this file. */
const q = (s: string) => `'${s.replace(/'/g, "''")}'`;

/**
 * Roles entitled to send case correspondence.
 *
 * Not every member of staff: a cyberops analyst investigates, a statistician aggregates
 * and a creditor is an external party. Sending a notification writes a message
 * attributed to the service into someone's case record, so the grant follows who does
 * casework rather than who is internal.
 */
const NOTIFICATION_SENDER_ROLES = ['role-sysadmin', 'role-senior', 'role-officer', 'role-adviser'];

export const MIGRATIONS: Migration[] = [
  {
    id: '001-applications-debtor-user-id',
    description:
      'Link an application to the debtor it is about, so ownership can be checked. ' +
      'Distinct from assigned_to, which is the member of staff handling it.',
    skipIfColumnExists: { table: 'applications', column: 'debtor_user_id' },
    sqlite: ['ALTER TABLE applications ADD COLUMN debtor_user_id TEXT REFERENCES users(id)'],
    postgres: ['ALTER TABLE applications ADD COLUMN IF NOT EXISTS debtor_user_id TEXT REFERENCES users(id)'],
  },

  {
    id: '002-notifications-send-permission',
    description:
      'Add the notifications.send permission and grant it to the casework roles. ' +
      'POST /api/notifications/send let any authenticated caller — including a debtor — ' +
      'write an arbitrary subject and body to any user, attributed to the service: a ' +
      'phishing primitive inside the product\'s own channel. Authentication alone did not ' +
      'close it, it only required the sender to log in first.',
    requiresTables: ['permissions', 'role_permissions'],
    sqlite: [
      upsert(
        'permissions',
        'id, code, name, description, resource, action',
        `(${q('perm-notif-send')}, ${q('notifications.send')}, ${q('Send Notifications')}, ` +
          `${q('Send case correspondence to a user')}, ${q('notifications')}, ${q('send')})`,
        'sqlite'
      ),
      ...NOTIFICATION_SENDER_ROLES.map(roleId =>
        upsert(
          'role_permissions',
          'role_id, permission_id',
          `(${q(roleId)}, ${q('perm-notif-send')})`,
          'sqlite'
        )
      ),
    ],
    postgres: [
      upsert(
        'permissions',
        'id, code, name, description, resource, action',
        `(${q('perm-notif-send')}, ${q('notifications.send')}, ${q('Send Notifications')}, ` +
          `${q('Send case correspondence to a user')}, ${q('notifications')}, ${q('send')})`,
        'postgres'
      ),
      ...NOTIFICATION_SENDER_ROLES.map(roleId =>
        upsert(
          'role_permissions',
          'role_id, permission_id',
          `(${q(roleId)}, ${q('perm-notif-send')})`,
          'postgres'
        )
      ),
    ],
  },

  {
    id: '003-consents',
    description:
      'Record consent, rather than issuing a receipt for a record that does not exist. ' +
      'POST /api/credit-check/consent returned 201 with a fresh uuid and the note ' +
      '"Consent recorded for audit purposes" while executing no write at all, and ' +
      'POST /run set consentRecorded: true on every response. UK GDPR Art. 7(1) requires ' +
      'the controller to be able to demonstrate consent; a receipt with nothing behind it ' +
      'is worse than a 501, because the receipt is what an audit would rely on.',
    sqlite: [
      `CREATE TABLE IF NOT EXISTS consents (
        id TEXT PRIMARY KEY,
        application_id TEXT NOT NULL,
        debtor_id TEXT,
        consent_type TEXT NOT NULL,
        consent_given INTEGER NOT NULL,
        recorded_at TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        recorded_by TEXT,
        ip_address TEXT,
        user_agent TEXT,
        withdrawn_at TEXT
      )`,
      // Every read is "is there a live consent of this type for this application", so the
      // index matches that shape rather than being one column per line.
      'CREATE INDEX IF NOT EXISTS idx_consents_application ON consents(application_id, consent_type)',
    ],
    postgres: [
      `CREATE TABLE IF NOT EXISTS consents (
        id TEXT PRIMARY KEY,
        application_id TEXT NOT NULL,
        debtor_id TEXT,
        consent_type TEXT NOT NULL,
        consent_given BOOLEAN NOT NULL,
        recorded_at TIMESTAMPTZ NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        recorded_by TEXT,
        ip_address TEXT,
        user_agent TEXT,
        withdrawn_at TIMESTAMPTZ
      )`,
      'CREATE INDEX IF NOT EXISTS idx_consents_application ON consents(application_id, consent_type)',
    ],
  },
];

/** Does a column exist? Asked differently per backend; answered the same way. */
async function columnExists(driver: DbDriver, table: string, column: string): Promise<boolean> {
  if (driver.dialect === 'postgres') {
    const row = await driver.get(
      'SELECT 1 AS present FROM information_schema.columns WHERE table_name = ? AND column_name = ?',
      [table, column]
    );
    return Boolean(row);
  }

  // PRAGMA takes no parameters, so the table name is interpolated. Safe here because
  // it comes from the migration list in this file, never from a request.
  const columns = await driver.all<{ name: string }>(`PRAGMA table_info(${table})`);
  return columns.some(c => c.name === column);
}

/** Does a table exist? Asked differently per backend; answered the same way. */
async function tableExists(driver: DbDriver, table: string): Promise<boolean> {
  if (driver.dialect === 'postgres') {
    const row = await driver.get('SELECT 1 AS present FROM information_schema.tables WHERE table_name = ?', [table]);
    return Boolean(row);
  }

  const row = await driver.get("SELECT 1 AS present FROM sqlite_master WHERE type = 'table' AND name = ?", [table]);
  return Boolean(row);
}

/**
 * Apply every migration that has not been applied yet, in order.
 *
 * Returns the ids applied on this call — empty on an up-to-date database, which is
 * the normal case and is why this is quiet rather than chatty.
 */
export async function runMigrations(driver: DbDriver): Promise<string[]> {
  // `applied_at` is TEXT on both backends rather than TIMESTAMPTZ on one: this table
  // is bookkeeping, never joined or compared, and keeping the types identical means
  // the driver's timestamp normalisation is irrelevant to it.
  await driver.run(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    )
  `);

  const applied = new Set(
    (await driver.all<{ id: string }>('SELECT id FROM schema_migrations')).map(r => r.id)
  );

  const justApplied: string[] = [];

  for (const migration of MIGRATIONS) {
    if (applied.has(migration.id)) continue;

    const statements = driver.dialect === 'postgres' ? migration.postgres : migration.sqlite;
    const skip =
      migration.skipIfColumnExists &&
      (await columnExists(driver, migration.skipIfColumnExists.table, migration.skipIfColumnExists.column));

    if (!skip) {
      // Checked before the first statement, so a prerequisite failure is reported as one
      // rather than as whichever statement happened to reference the missing table first.
      for (const table of migration.requiresTables ?? []) {
        if (!(await tableExists(driver, table))) {
          throw new Error(
            `[Migrations] ${migration.id} requires table "${table}", which does not exist. ` +
              'Schema initialisation must run before migrations — see initialiseDatabase().'
          );
        }
      }

      for (const statement of statements) {
        await driver.run(statement);
      }
      console.log(`[Migrations] Applied ${migration.id} — ${migration.description}`);
    }

    // Recorded either way. A migration whose effect was already present is still
    // "done", and leaving it pending would retry it on every boot for ever.
    await driver.run('INSERT INTO schema_migrations (id, applied_at) VALUES (?, ?)', [
      migration.id,
      new Date().toISOString(),
    ]);
    justApplied.push(migration.id);
  }

  return justApplied;
}

/** Migration ids recorded as applied. For diagnostics and the smoke-test endpoint. */
export async function appliedMigrations(driver: DbDriver): Promise<string[]> {
  const rows = await driver.all<{ id: string }>('SELECT id FROM schema_migrations ORDER BY id');
  return rows.map(r => r.id);
}
