/**
 * AiB IAAS - Consolidated API
 *
 * This is a deployment consolidation layer that mounts all 12 backend
 * services into a single Express application, so the whole API deploys as
 * one container on a free-tier plan (currently Render — see render.yaml).
 * Twelve separate free services would mean twelve independent cold starts
 * after the 15-minute idle spin-down; one container means one.
 *
 * The individual services remain independently runnable for local
 * development (npm run dev:services). This file is ONLY used for
 * cloud deployment, and holds no business logic — which is why it is
 * excluded from coverage in the root vitest.config.ts.
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Import route modules from sibling services
import { applicationsRouter } from '../../api-gateway/src/routes/applications';
import { postcodeRouter } from '../../api-gateway/src/routes/postcode';
import { authRouter as gatewayAuthRouter } from '../../api-gateway/src/routes/auth';
import { reportsRouter } from '../../api-gateway/src/routes/reports';
import { reportsExportRouter } from '../../api-gateway/src/routes/reports-export';
import { initDatabase } from '../../api-gateway/src/db';

import { recommendRouter } from '../../recommendation-service/src/routes/recommend';
import { documentsRouter } from '../../document-service/src/routes/documents';
import { orchestrateRouter } from '../../integration-orchestrator/src/routes/orchestrate';
import { paymentsRouter } from '../../payment-service/src/routes/payments';
import { auditRouter } from '../../audit-service/src/routes/audit';
import { initAuditDb } from '../../audit-service/src/db';
import { creditCheckRouter } from '../../credit-check-service/src/routes/credit-check';
import { initCreditCheckDb } from '../../credit-check-service/src/providers/cache';
import { organisationRouter } from '../../organisation-service/src/routes/organisations';
import { initOrgDb } from '../../organisation-service/src/db';
import { usersRouter } from '../../user-service/src/routes/users';
import { authRouter as userAuthRouter } from '../../user-service/src/routes/auth';
import { rolesRouter } from '../../user-service/src/routes/roles';
import { initUserDb } from '../../user-service/src/db';
import { notificationRouter } from '../../notification-service/src/routes/notifications';
import { initNotificationDb } from '../../notification-service/src/db';
import { verifyRouter } from '../../identity-service/src/routes/verify';
import { federationRouter } from '../../identity-service/src/routes/federation';

// Mock integrations
import { basysRouter } from '../../mock-integrations/src/routes/basys';
import { edenDashRouter } from '../../mock-integrations/src/routes/eden-dash';
import { dasRouter } from '../../mock-integrations/src/routes/das';
import { cftRouter } from '../../mock-integrations/src/routes/cft';
import { moratoriumRouter } from '../../mock-integrations/src/routes/moratorium';
import { roiRouter } from '../../mock-integrations/src/routes/roi';
import { creditCheckRouter as mockCreditCheckRouter } from '../../mock-integrations/src/routes/credit-check';
import { healthRouter as mockHealthRouter } from '../../mock-integrations/src/routes/health';
import { latencyMiddleware } from '../../mock-integrations/src/middleware/latency';

const app = express();
const PORT = process.env.PORT || 3001;

// Security
app.use(helmet({ contentSecurityPolicy: false })); // Relaxed CSP for POC
const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',')
  : ['https://macleoda-leidos.github.io', 'http://localhost:3000', 'http://localhost:3010'];
// Registered BEFORE the rate limiter on purpose. `cors` defaults to
// preflightContinue: false, so it answers an OPTIONS preflight and ends the
// response itself — preflights therefore never reach the limiter and cost
// nothing from the window. Moving the limiter above this line would roughly
// halve the effective budget, because browsers preflight every cross-origin
// request carrying Content-Type or Authorization, which is most of ours.
app.use(cors({ origin: corsOrigins, methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], allowedHeaders: ['Content-Type', 'Authorization'], credentials: true }));

// Render (and any other PaaS) terminates TLS at a proxy and forwards the real
// client address in X-Forwarded-For. Without this, express-rate-limit keys every
// request on the proxy's socket address, so ALL visitors share a single bucket
// and a handful of open dashboard tabs exhausts the limit for everyone.
// One hop = Render's edge proxy.
app.set('trust proxy', 1);

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  // Emit RateLimit-* and Retry-After so clients can back off instead of
  // guessing. The frontend reads these to show a real countdown.
  standardHeaders: true,
  legacyHeaders: false,
  // Health checks are infrastructure, not user traffic. Render polls
  // /api/health continuously; letting that consume the shared user budget was
  // a significant slice of the window on its own.
  skip: (req) => req.path === '/api/health',
  // Match the app's error envelope. The default is plain text, which the
  // frontend's res.json() parse fails on — a 429 then surfaced as an
  // indistinguishable "UNKNOWN" error and was rendered as "backend offline".
  handler: (req, res) => {
    const retryAfterSec = Math.ceil(15 * 60);
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many requests. Please wait before retrying.',
        retryAfterSeconds: retryAfterSec,
      },
    });
  },
}));
app.use(express.json({ limit: '10mb' }));

// Initialize databases
initDatabase();
initAuditDb();
initCreditCheckDb();
initOrgDb();
initUserDb();
initNotificationDb();

// Auto-seed on first boot if database is empty
try {
  const { getDatabase } = require('@aib-iaas/database');
  const db = getDatabase();
  const count = db.prepare('SELECT COUNT(*) as c FROM applications').get() as any;
  if (count.c === 0) {
    console.log('[Consolidated API] Empty database detected — running seed...');
    const { seedDatabase } = require('@aib-iaas/database');
    if (seedDatabase) seedDatabase();
    console.log('[Consolidated API] Seed complete');
  }
  // Ensure we have 100+ applications for demo (existing seed only has 5)
  const appCount = db.prepare('SELECT COUNT(*) as c FROM applications').get() as any;
  if (appCount.c < 50) {
    console.log('[Consolidated API] Seeding 100 Scottish applications...');
    const firstNames = ['Alistair','Fiona','Craig','Heather','Kenneth','Janet','Graeme','Eleanor','Malcolm','Brenda','Iain','Dorothy','Angus','Morag','Douglas','Sheila','Robert','Catriona','Stuart','Margaret','James','Eileen','Donald','Susan','Gordon','Aileen','William','Lorna','Andrew','Isla','John','Mary','David','Linda','Thomas','Sandra','Michael','Carol','Peter','Maureen','Brian','Jean','Steven','Kathleen','Paul','Agnes','Alan','Alison','Colin','Derek'];
    const lastNames = ['Morrison','Campbell','Stewart','Murray','MacDonald','Henderson','Robertson','Wilson','Thomson','Anderson','MacLeod','Scott','Fraser','Sinclair','Grant','MacKenzie','Burns','MacIntyre','Bell','Paterson','Cunningham','Kerr','Cameron','Wallace','Mitchell','Douglas','Ramsay','Baxter','Milne','Ferguson','Smith','Brown','Reid','Clark','Ross','Young','Walker','Watson','Hamilton','Graham','Duncan','Hunter','Simpson','Allan','Crawford','Boyd','Taylor','Adams','Black','Kennedy'];
    const statuses = ['approved','submitted','under_review','draft','additional_info_required','rejected'];
    const products = ['DAS','MAP','PTD','Sequestration','DPP','Signposting'];
    const cities = ['Edinburgh','Glasgow','Aberdeen','Dundee','Inverness','Stirling','Perth','Falkirk','Ayr','Paisley'];
    const insertApp = db.prepare('INSERT OR IGNORE INTO applications (id, reference_number, status, submitted_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)');
    const insertApplicant = db.prepare('INSERT OR IGNORE INTO applicants (id, application_id, first_name, last_name, email, ni_number, employment) VALUES (?, ?, ?, ?, ?, ?, ?)');
    // Document and asset catalogues for the per-application evidence bundle below.
    // Categories match the DocumentReference union in @aib-iaas/shared-types
    // ('identification' | 'proof_of_address' | 'income_evidence' | 'debt_evidence' | 'other')
    // so the case-detail document tab renders real labels rather than raw values.
    const docCatalogue = [
      { slug: 'passport_scan', name: 'Passport scan.pdf', category: 'identification', mime: 'application/pdf', size: 842_000 },
      { slug: 'driving_licence', name: 'Driving licence.jpg', category: 'identification', mime: 'image/jpeg', size: 316_000 },
      { slug: 'council_tax_bill', name: 'Council tax bill 2026-27.pdf', category: 'proof_of_address', mime: 'application/pdf', size: 128_000 },
      { slug: 'utility_bill', name: 'Scottish Power bill.pdf', category: 'proof_of_address', mime: 'application/pdf', size: 96_000 },
      { slug: 'bank_statement_1', name: 'Bank statement - month 1.pdf', category: 'income_evidence', mime: 'application/pdf', size: 1_148_000 },
      { slug: 'bank_statement_2', name: 'Bank statement - month 2.pdf', category: 'income_evidence', mime: 'application/pdf', size: 1_092_000 },
      { slug: 'wage_slip', name: 'Wage slip.pdf', category: 'income_evidence', mime: 'application/pdf', size: 234_000 },
      { slug: 'benefits_award', name: 'Universal Credit award letter.pdf', category: 'income_evidence', mime: 'application/pdf', size: 187_000 },
      { slug: 'creditor_letter', name: 'Creditor letter - arrears notice.pdf', category: 'debt_evidence', mime: 'application/pdf', size: 74_000 },
      { slug: 'default_notice', name: 'Default notice.pdf', category: 'debt_evidence', mime: 'application/pdf', size: 68_000 },
      { slug: 'income_expenditure', name: 'Income and expenditure form.xlsx', category: 'other', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', size: 41_000 },
    ];
    // Asset templates keyed by "profile". Not every debtor owns something —
    // profile 0 is deliberately empty (MAP/sequestration candidates), which the
    // recommendation engine relies on to reach the low-asset branches.
    const assetProfiles: Array<Array<{ type: string; description: string; value: number; outstanding: number; essential: number }>> = [
      [],
      [{ type: 'savings', description: 'Current account balance', value: 180, outstanding: 0, essential: 0 }],
      [
        { type: 'vehicle', description: '2016 Vauxhall Corsa 1.2 SE', value: 3400, outstanding: 0, essential: 1 },
        { type: 'savings', description: 'Credit union savings', value: 640, outstanding: 0, essential: 0 },
      ],
      [
        { type: 'property', description: 'Residential flat (jointly owned)', value: 168_000, outstanding: 142_000, essential: 1 },
        { type: 'vehicle', description: '2019 Ford Focus 1.0 EcoBoost', value: 8200, outstanding: 4100, essential: 1 },
      ],
      [
        { type: 'property', description: 'Semi-detached house', value: 245_000, outstanding: 118_000, essential: 1 },
        { type: 'savings', description: 'Cash ISA', value: 6800, outstanding: 0, essential: 0 },
        { type: 'vehicle', description: '2021 Kia Sportage', value: 17_500, outstanding: 11_200, essential: 0 },
      ],
      [{ type: 'vehicle', description: '2014 Honda Jazz 1.4', value: 2100, outstanding: 0, essential: 1 }],
    ];
    const insertDoc = db.prepare('INSERT OR IGNORE INTO documents (id, application_id, filename, original_name, mime_type, size, category, storage_path, scan_status, scan_result, uploaded_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    const insertAsset = db.prepare('INSERT OR IGNORE INTO assets (id, application_id, type, description, value, outstanding, is_essential) VALUES (?, ?, ?, ?, ?, ?, ?)');
    for (let i = 1; i <= 100; i++) {
      const fn = firstNames[i % firstNames.length];
      const ln = lastNames[i % lastNames.length];
      const ref = `IAAS-2026-${String(i).padStart(5, '0')}`;
      const st = statuses[i % statuses.length];
      const day = ((i - 1) % 28) + 1;
      const month = i <= 50 ? '06' : '07';
      const date = `2026-${month}-${String(day).padStart(2, '0')}T10:00:00Z`;
      const id = `app-seed-${String(i).padStart(4, '0')}`;
      insertApp.run(id, ref, st, st !== 'draft' ? date : null, date, date);
      insertApplicant.run(`applicant-seed-${String(i).padStart(4, '0')}`, id, fn, ln, `${fn.toLowerCase()}.${ln.toLowerCase()}@email.co.uk`, `SC${String(100000 + i * 1111).slice(0,6)}${String.fromCharCode(65 + (i % 26))}`, ['employed','self_employed','unemployed','retired'][i % 4]);
      // 3-5 documents per application. Both the count and the starting offset
      // are derived from i (no Math.random) so the bundle is identical on every
      // boot and every test run. Drafts get the smallest bundle — a part-finished
      // application realistically has less evidence attached.
      const docCount = st === 'draft' ? 3 : 3 + (i % 3);
      for (let d = 0; d < docCount; d++) {
        const tpl = docCatalogue[(i * 3 + d) % docCatalogue.length];
        // Uploads land 0-2 days before the application date and never after it,
        // so the document tab's chronology reads correctly against the timeline.
        // Applications are stamped at 10:00, so a same-day upload is pinned to
        // the 07:00-09:00 window — otherwise evidence appears to arrive hours
        // after the case it belongs to was created.
        const uploadDay = Math.max(1, day - ((d + i) % 3));
        const uploadHour = uploadDay === day ? 7 + (d % 3) : 9 + (d % 8);
        const uploadedAt = `2026-${month}-${String(uploadDay).padStart(2, '0')}T${String(uploadHour).padStart(2, '0')}:${String((i * 7 + d * 11) % 60).padStart(2, '0')}:00Z`;
        insertDoc.run(
          `doc-seed-${String(i).padStart(4, '0')}-${d}`, id,
          `${tpl.slug}-${String(i).padStart(4, '0')}${tpl.name.slice(tpl.name.lastIndexOf('.'))}`,
          tpl.name, tpl.mime,
          // Nudge the size per application so the file list is not 100 identical
          // byte counts, while staying in a plausible range for the file type.
          tpl.size + ((i * 1373 + d * 907) % 40_000),
          tpl.category,
          `uploads/${id}/${tpl.slug}${tpl.name.slice(tpl.name.lastIndexOf('.'))}`,
          'clean',
          JSON.stringify({ scanner: 'clamav', engineVersion: '0.103.11', signatureDate: '2026-05-28', infected: false, scannedAt: uploadedAt }),
          uploadedAt
        );
      }
      // Assets: cycle the profiles so roughly 1 in 6 applicants has none.
      const profile = assetProfiles[i % assetProfiles.length];
      for (let a = 0; a < profile.length; a++) {
        const asset = profile[a];
        // Vary value/outstanding per application so PTD vs sequestration
        // thresholds are not all crossed at exactly the same number.
        const value = asset.value + ((i * 311) % Math.max(1, Math.round(asset.value * 0.08)));
        const outstanding = asset.outstanding === 0 ? 0 : asset.outstanding + ((i * 197) % Math.max(1, Math.round(asset.outstanding * 0.06)));
        insertAsset.run(`asset-seed-${String(i).padStart(4, '0')}-${a}`, id, asset.type, asset.description, value, outstanding, asset.essential);
      }
    }
    console.log('[Consolidated API] 100 applications seeded (with documents and assets)');
  }
} catch (e: any) {
  console.log('[Consolidated API] Seed skipped:', e.message);
}

// If PostgreSQL (Neon) is configured, initialize it as the persistent store.
// SQLite remains the runtime query engine (sync, fast, zero breaking changes).
// Neon holds the schema + seed data for when async migration completes.
if (process.env.DATABASE_URL?.startsWith('postgresql://')) {
  const { Pool } = require('pg');
  const { initPgSchema } = require('@aib-iaas/database');
  const { seedPgDatabase } = require('@aib-iaas/database');
  const { seedPgApplications } = require('@aib-iaas/database');

  (async () => {
    try {
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DATABASE_URL!.includes('neon.tech')
          ? { rejectUnauthorized: false }
          : undefined,
      });
      await initPgSchema(pool);
      await seedPgDatabase(pool);
      await seedPgApplications(pool);
      console.log('[Consolidated API] Neon PostgreSQL initialized as persistent store');
      await pool.end();
    } catch (e: any) {
      console.log('[Consolidated API] Neon sync skipped:', e.message);
    }
  })();
}

console.log('[Consolidated API] All databases initialized');

// ===== API GATEWAY ROUTES =====
app.use('/api/applications', applicationsRouter);
app.use('/api/postcode', postcodeRouter);
app.use('/api/auth', gatewayAuthRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/reports/export', reportsExportRouter);

// ===== SERVICE ROUTES =====
app.use('/api/recommend', recommendRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/integrations', orchestrateRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/audit', auditRouter);
app.use('/api/credit-check', creditCheckRouter);
app.use('/api/organisations', organisationRouter);
app.use('/api/users', usersRouter);
app.use('/api/users/auth', userAuthRouter);
app.use('/api/roles', rolesRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/identity', verifyRouter);
app.use('/api/identity', federationRouter);

// ===== MOCK INTEGRATION ROUTES =====
app.use('/api/mock/basys', latencyMiddleware, basysRouter);
app.use('/api/mock/eden', latencyMiddleware, edenDashRouter);
app.use('/api/mock/das', latencyMiddleware, dasRouter);
app.use('/api/mock/cft', latencyMiddleware, cftRouter);
app.use('/api/mock/moratorium', latencyMiddleware, moratoriumRouter);
app.use('/api/mock/roi', latencyMiddleware, roiRouter);
app.use('/api/mock/credit-check', latencyMiddleware, mockCreditCheckRouter);
app.use('/api/mock', mockHealthRouter);

// ===== ROOT =====
app.get('/', (_req, res) => {
  res.json({
    service: 'AiB IAAS API',
    version: '0.1.0',
    status: 'operational',
    description: 'Accountant in Bankruptcy — Initial Application Advice Service API',
    endpoints: {
      health: '/api/health',
      applications: '/api/applications',
      auth: '/api/auth/login',
      recommend: '/api/recommend',
      audit: '/api/audit/events',
      organisations: '/api/organisations',
      users: '/api/users',
      creditCheck: '/api/credit-check',
      documents: '/api/documents',
      payments: '/api/payments',
    },
    documentation: 'https://macleoda-leidos.github.io/aib-iaas-poc/architecture/',
    frontend: 'https://macleoda-leidos.github.io/aib-iaas-poc/',
  });
});

// ===== HEALTH =====
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'aib-iaas-consolidated-api',
    version: '0.1.0',
    environment: process.env.NODE_ENV || 'development',
    services: [
      'api-gateway', 'recommendation', 'document', 'integration-orchestrator',
      'payment', 'audit', 'credit-check', 'organisation', 'user', 'notification', 'mock-integrations',
    ],
    timestamp: new Date().toISOString(),
  });
});

// ===== SMOKE TEST =====
app.get('/api/smoke-test', (_req, res) => {
  try {
    const { getDatabase } = require('@aib-iaas/database');
    const db = getDatabase();
    const apps = db.prepare('SELECT COUNT(*) as c FROM applications').get() as any;
    const users = db.prepare('SELECT COUNT(*) as c FROM users').get() as any;
    const orgs = db.prepare('SELECT COUNT(*) as c FROM organisations').get() as any;
    const roles = db.prepare('SELECT COUNT(*) as c FROM roles').get() as any;
    const audit = db.prepare('SELECT COUNT(*) as c FROM audit_events').get() as any;

    res.json({
      success: true,
      status: 'all_passing',
      database: 'connected',
      counts: {
        applications: apps.c,
        users: users.c,
        organisations: orgs.c,
        roles: roles.c,
        auditEvents: audit.c,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[API Error]', err.message);
  res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
});

app.listen(PORT, () => {
  console.log(`[Consolidated API] Running on port ${PORT}`);
  console.log(`[Consolidated API] All 12 services mounted on single instance`);
});

export { app };
