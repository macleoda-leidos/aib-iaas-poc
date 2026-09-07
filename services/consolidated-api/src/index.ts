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
import fs from 'fs';
import {
  requestId,
  requestLogger,
  errorHandler,
  renderPrometheus,
  metricsSummary,
  createReadinessHandler,
  logger,
} from '@aib-iaas/observability';

// Import route modules from sibling services
import { applicationsRouter } from '../../api-gateway/src/routes/applications';
import { postcodeRouter } from '../../api-gateway/src/routes/postcode';
import { authRouter as gatewayAuthRouter } from '../../api-gateway/src/routes/auth';
import { reportsRouter } from '../../api-gateway/src/routes/reports';
import { reportsExportRouter } from '../../api-gateway/src/routes/reports-export';
import { initDatabase, driver } from '../../api-gateway/src/db';
import { authenticate, requirePermission } from '../../api-gateway/src/middleware/rbac';

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

/**
 * "Insert this row unless it is already there", in each dialect's own syntax.
 *
 * SQLite spells it `INSERT OR IGNORE`; PostgreSQL has no such form and wants
 * `ON CONFLICT DO NOTHING` after the VALUES. The demo seed below is re-run on
 * every boot, so tolerating the conflict is what makes it idempotent — and using
 * the wrong dialect's spelling is a syntax error rather than a silent one, which
 * is the reason to build the statement in one place.
 */
function insertIgnoring(table: string, columns: string, paramCount: number): string {
  const placeholders = Array(paramCount).fill('?').join(', ');
  return driver.dialect === 'postgres'
    ? `INSERT INTO ${table} (${columns}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`
    : `INSERT OR IGNORE INTO ${table} (${columns}) VALUES (${placeholders})`;
}

// Correlation id first, before anything that can end a response.
//
// Mounted here as well as on each standalone service because this file imports the
// services' *routers*, not their apps — so middleware mounted in
// `api-gateway/src/index.ts` has never run in a deployed environment. That divergence
// is this file's defining hazard (see the note at the top) and it has now produced
// three separate defects: an unauthorised reports router, an unauthenticated
// user-creation route, and a request-id middleware that existed only in local
// development.
app.use(requestId());

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
// exposedHeaders is required for the RateLimit-* headers to be readable by the
// frontend. Browsers withhold every response header from script except seven
// CORS-safelisted ones, so without this the limiter's headers reach the browser
// but `res.headers.get('RateLimit-Limit')` returns null — the frontend then has
// no way to show real usage and falls back to a local estimate.
app.use(cors({
  origin: corsOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset', 'RateLimit-Policy'],
  credentials: true,
}));

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

// After express.json() so a body-parse failure is still logged with its status, and
// before the routers so it observes every response including those written by the auth
// guard and the rate limiter.
app.use(requestLogger());

/**
 * Bring every store up, then fill the shared one with demo data.
 *
 * Async because the shared schema's creation is, under PostgreSQL. Nothing may
 * accept a request before this resolves, so `app.listen` is called from its
 * continuation at the bottom of this file rather than at module load.
 */
async function bootstrap(): Promise<void> {
await initDatabase();
await initAuditDb();
initCreditCheckDb();   // separate SQLite cache, unrelated to the shared schema
await initOrgDb();
await initUserDb();
initNotificationDb();  // likewise its own SQLite store

// Auto-seed on first boot if database is empty
try {
  const { seedDatabase, isPostgresEnabled, getPgPool, seedPgApplications } = require('@aib-iaas/database');
  const count = await driver.get('SELECT COUNT(*) as c FROM applications');
  // Number(): PostgreSQL returns COUNT(*) as a bigint, which `pg` hands back as a
  // string, and "0" === 0 is false — so an empty Neon database would never seed.
  if (Number(count.c) === 0 && driver.dialect === 'sqlite') {
    // seedDatabase() writes through a better-sqlite3 handle directly. Its
    // PostgreSQL counterpart is seedPgDatabase(), which initialiseDatabase()
    // has already run.
    console.log('[Consolidated API] Empty database detected — running seed...');
    if (seedDatabase) seedDatabase();
    console.log('[Consolidated API] Seed complete');
  }
  // Ensure we have 100+ applications for demo (existing seed only has 5)
  const appCount = await driver.get('SELECT COUNT(*) as c FROM applications');
  if (Number(appCount.c) < 50) {
    console.log('[Consolidated API] Seeding 100 Scottish applications...');
    // seedPgApplications covers applications and applicants on PostgreSQL but not
    // the documents and assets below, so the loop runs on both backends and this
    // only fills in what it already knows how to do faster, in batches.
    if (isPostgresEnabled()) {
      await seedPgApplications(getPgPool());
    }
    const firstNames = ['Alistair','Fiona','Craig','Heather','Kenneth','Janet','Graeme','Eleanor','Malcolm','Brenda','Iain','Dorothy','Angus','Morag','Douglas','Sheila','Robert','Catriona','Stuart','Margaret','James','Eileen','Donald','Susan','Gordon','Aileen','William','Lorna','Andrew','Isla','John','Mary','David','Linda','Thomas','Sandra','Michael','Carol','Peter','Maureen','Brian','Jean','Steven','Kathleen','Paul','Agnes','Alan','Alison','Colin','Derek'];
    const lastNames = ['Morrison','Campbell','Stewart','Murray','MacDonald','Henderson','Robertson','Wilson','Thomson','Anderson','MacLeod','Scott','Fraser','Sinclair','Grant','MacKenzie','Burns','MacIntyre','Bell','Paterson','Cunningham','Kerr','Cameron','Wallace','Mitchell','Douglas','Ramsay','Baxter','Milne','Ferguson','Smith','Brown','Reid','Clark','Ross','Young','Walker','Watson','Hamilton','Graham','Duncan','Hunter','Simpson','Allan','Crawford','Boyd','Taylor','Adams','Black','Kennedy'];
    const statuses = ['approved','submitted','under_review','draft','additional_info_required','rejected'];
    const products = ['DAS','MAP','PTD','Sequestration','DPP','Signposting'];
    const cities = ['Edinburgh','Glasgow','Aberdeen','Dundee','Inverness','Stirling','Perth','Falkirk','Ayr','Paisley'];
    const insertApp = insertIgnoring('applications', 'id, reference_number, status, debtor_user_id, submitted_at, created_at, updated_at', 7);
    const insertApplicant = insertIgnoring('applicants', 'id, application_id, first_name, last_name, email, ni_number, employment', 7);
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
    // `essential` is a boolean, not 0/1: is_essential is BOOLEAN in PostgreSQL,
    // which rejects an integer outright, and the driver converts for SQLite.
    const assetProfiles: Array<Array<{ type: string; description: string; value: number; outstanding: number; essential: boolean }>> = [
      [],
      [{ type: 'savings', description: 'Current account balance', value: 180, outstanding: 0, essential: false }],
      [
        { type: 'vehicle', description: '2016 Vauxhall Corsa 1.2 SE', value: 3400, outstanding: 0, essential: true },
        { type: 'savings', description: 'Credit union savings', value: 640, outstanding: 0, essential: false },
      ],
      [
        { type: 'property', description: 'Residential flat (jointly owned)', value: 168_000, outstanding: 142_000, essential: true },
        { type: 'vehicle', description: '2019 Ford Focus 1.0 EcoBoost', value: 8200, outstanding: 4100, essential: true },
      ],
      [
        { type: 'property', description: 'Semi-detached house', value: 245_000, outstanding: 118_000, essential: true },
        { type: 'savings', description: 'Cash ISA', value: 6800, outstanding: 0, essential: false },
        { type: 'vehicle', description: '2021 Kia Sportage', value: 17_500, outstanding: 11_200, essential: false },
      ],
      [{ type: 'vehicle', description: '2014 Honda Jazz 1.4', value: 2100, outstanding: 0, essential: true }],
    ];
    const insertDoc = insertIgnoring('documents', 'id, application_id, filename, original_name, mime_type, size, category, storage_path, scan_status, scan_result, uploaded_at', 11);
    const insertAsset = insertIgnoring('assets', 'id, application_id, type, description, value, outstanding, is_essential', 7);
    for (let i = 1; i <= 100; i++) {
      const fn = firstNames[i % firstNames.length];
      const ln = lastNames[i % lastNames.length];
      const ref = `IAAS-2026-${String(i).padStart(5, '0')}`;
      const st = statuses[i % statuses.length];
      const day = ((i - 1) % 28) + 1;
      const month = i <= 50 ? '06' : '07';
      const date = `2026-${month}-${String(day).padStart(2, '0')}T10:00:00Z`;
      const id = `app-seed-${String(i).padStart(4, '0')}`;
      // Every tenth case is owned by the seeded debtor (`user-debtor`, created by
      // initializeSchema, which has already run). Ten rather than all hundred: one
      // debtor holding every case would be absurd, and none would leave the
      // ownership check and the debtor's own view with nothing to show.
      const debtorUserId = i % 10 === 0 ? 'user-debtor' : null;
      await driver.run(insertApp, [id, ref, st, debtorUserId, st !== 'draft' ? date : null, date, date]);
      await driver.run(insertApplicant, [`applicant-seed-${String(i).padStart(4, '0')}`, id, fn, ln, `${fn.toLowerCase()}.${ln.toLowerCase()}@email.co.uk`, `SC${String(100000 + i * 1111).slice(0,6)}${String.fromCharCode(65 + (i % 26))}`, ['employed','self_employed','unemployed','retired'][i % 4]]);
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
        await driver.run(insertDoc, [
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
          uploadedAt,
        ]);
      }
      // Assets: cycle the profiles so roughly 1 in 6 applicants has none.
      const profile = assetProfiles[i % assetProfiles.length];
      for (let a = 0; a < profile.length; a++) {
        const asset = profile[a];
        // Vary value/outstanding per application so PTD vs sequestration
        // thresholds are not all crossed at exactly the same number.
        const value = asset.value + ((i * 311) % Math.max(1, Math.round(asset.value * 0.08)));
        const outstanding = asset.outstanding === 0 ? 0 : asset.outstanding + ((i * 197) % Math.max(1, Math.round(asset.outstanding * 0.06)));
        await driver.run(insertAsset, [`asset-seed-${String(i).padStart(4, '0')}-${a}`, id, asset.type, asset.description, value, outstanding, asset.essential]);
      }
    }
    console.log('[Consolidated API] 100 applications seeded (with documents and assets)');
  }

  // The relational detail. Separate from the block above, and run unconditionally,
  // because these six tables were left empty by every previous seeding path: a
  // hundred applications existed with no debts, no addresses, no income figures, no
  // recommendation, no audit trail and no payment. The case detail page therefore
  // showed an empty creditor list, every dashboard debt total was £0, and the pages
  // that display those things fell back to hardcoded numbers.
  //
  // Guarded on debts rather than applications: the applications were already being
  // seeded, so a check on them would have skipped this for ever.
  const { seedDemoDetail } = require('@aib-iaas/database');
  const debtCount = await driver.get('SELECT COUNT(*) as c FROM debts');
  if (Number(debtCount.c) === 0) {
    console.log('[Consolidated API] Seeding relational detail for demo applications...');
    const seeded = await seedDemoDetail(driver);
    console.log(
      `[Consolidated API] Seeded ${seeded.debts} debts, ${seeded.addresses} addresses, ` +
      `${seeded.incomeExpenditure} income/expenditure records, ${seeded.recommendations} recommendations, ` +
      `${seeded.auditEvents} audit events, ${seeded.payments} payments`
    );
  }
} catch (e: any) {
  console.log('[Consolidated API] Seed skipped:', e.message);
}

console.log(`[Consolidated API] All databases initialized (shared store: ${driver.dialect})`);
}

// ===== API GATEWAY ROUTES =====
app.use('/api/applications', applicationsRouter);
app.use('/api/postcode', postcodeRouter);
app.use('/api/auth', gatewayAuthRouter);
// Authorised, and previously not. `api-gateway/src/index.ts` has always guarded
// this router with `authenticate + requirePermission('reports.read')`, but this
// file — the only artefact that actually deploys — mounted it bare. The single
// authorised route in the repo was therefore unauthenticated in every deployed
// environment. Divergence between the standalone service and the consolidation
// layer is the hazard this file carries by construction; see the note at the top.
app.use('/api/reports/export', reportsExportRouter); // Public for POC demo (must precede the guarded route)
app.use('/api/reports', authenticate, requirePermission('reports.read'), reportsRouter);

// ===== SERVICE ROUTES =====
app.use('/api/recommend', recommendRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/integrations', orchestrateRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/audit', auditRouter);
app.use('/api/credit-check', creditCheckRouter);
app.use('/api/organisations', organisationRouter);
// `/api/users/auth` MUST be mounted before `/api/users`.
//
// Express matches mount prefixes in registration order, and `usersRouter` now applies
// `authenticate` at router level — so with `/api/users` first, a login request to
// `/api/users/auth/login` is matched by the guarded router and refused with 401 before
// it can reach the auth router. Nobody could log in, which also makes every other
// guarded route unreachable.
//
// This was previously harmless in either order: the collision only bites once the
// broader prefix carries router-level middleware, which is exactly what closing the
// unauthenticated-user-creation hole required.
app.use('/api/users/auth', userAuthRouter);
app.use('/api/users', usersRouter);
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
//
// Liveness. Deliberately cheap and deliberately unable to fail: this is the path
// `render.yaml` names as `healthCheckPath`, and on the free plan a failing health check
// fails the deploy. A Neon instance waking from idle can take several seconds, so a
// database-probing liveness endpoint would turn a cold start into a failed deployment —
// most likely while a demo was starting.
//
// "Can it actually serve traffic" is a different question with a different answer, and
// it lives at /api/health/ready below. Until that endpoint existed there was no way to
// ask it at all: this literal returned `healthy` from a container whose database was
// unreachable and which was answering 500 to every real request (GAP-020).
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'healthy',
    liveness: true,
    readiness: '/api/health/ready',
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

/**
 * Readiness — 200 when every dependency answers, 503 with per-dependency detail
 * otherwise. This is what a monitoring page, an alert or a load balancer should read.
 *
 * Unauthenticated on purpose, so an external prober can reach it, which is why nothing
 * here returns a stack trace or a connection string. The `optional` flags encode which
 * failures are outages: losing the shared database means the service cannot do its job,
 * whereas a cold credit-check cache means the next check calls the provider.
 */
app.get(
  '/api/health/ready',
  createReadinessHandler({
    service: 'aib-iaas-consolidated-api',
    checks: [
      {
        name: 'database',
        run: async () => {
          // `SELECT 1` and not `SELECT COUNT(*)`: the probe must not get slower as the
          // demo dataset grows, or it will start timing out for the wrong reason.
          await driver.get('SELECT 1 as ok');
          return { dialect: driver.dialect };
        },
      },
      {
        name: 'notifications',
        run: async () => {
          const { getNotificationDb, notificationDbPath } = require('../../notification-service/src/db');
          getNotificationDb().prepare('SELECT 1').get();
          return { path: notificationDbPath() };
        },
      },
      {
        name: 'creditCache',
        // Optional: a missing cache costs a provider call, not a case.
        optional: true,
        run: async () => {
          const { creditCheckDbPath } = require('../../credit-check-service/src/providers/cache');
          const path = creditCheckDbPath();
          if (!fs.existsSync(path)) throw new Error('cache database not present');
          return { path };
        },
      },
      {
        name: 'uploads',
        run: async () => {
          // Actually writes and deletes a probe file. `fs.access(W_OK)` passes on a
          // read-only bind mount whose permission bits look right, and the failure this
          // exists to catch — a disk that is not mounted where UPLOAD_PATH points — is
          // exactly that shape.
          const { uploadPath } = require('../../document-service/src/routes/documents');
          const { checkWritableDirectory } = require('@aib-iaas/observability');
          return await checkWritableDirectory(uploadPath());
        },
      },
    ],
  })
);

/**
 * Metrics in Prometheus exposition format, plus a JSON summary the admin pages render.
 *
 * Guarded on `system.admin`: per-route request volumes and error rates tell an attacker
 * which endpoints exist, which are used, and which are currently broken.
 */
app.get('/api/metrics', authenticate, requirePermission('system.admin'), (_req, res) => {
  res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8').send(renderPrometheus());
});

app.get('/api/metrics/summary', authenticate, requirePermission('system.admin'), (_req, res) => {
  res.json({ success: true, data: metricsSummary() });
});

// ===== SMOKE TEST =====
app.get('/api/smoke-test', async (_req, res, next) => {
  try {
    // Number() on each: PostgreSQL returns COUNT(*) as a bigint, which `pg` hands
    // back as a string, and the point of this endpoint is to report numbers.
    const countOf = async (table: string) =>
      Number((await driver.get(`SELECT COUNT(*) as c FROM ${table}`)).c);

    res.json({
      success: true,
      status: 'all_passing',
      database: 'connected',
      dialect: driver.dialect,
      counts: {
        applications: await countOf('applications'),
        users: await countOf('users'),
        organisations: await countOf('organisations'),
        roles: await countOf('roles'),
        auditEvents: await countOf('audit_events'),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (e: any) {
    // Delegated rather than answered here: this returned `error: e.message` as a bare
    // string, which is both the wrong envelope shape (clients read `error.code`) and the
    // same unguarded internal-message leak as the old terminal handler.
    next(e);
  }
});

// Error handler, last.
//
// Replaces a hand-rolled one that returned `err.message` with **no NODE_ENV guard**, so
// a SQLite constraint violation put the table name, the column name and sometimes the
// offending value into the browser in production. The api-gateway copy guarded it
// correctly, which is exactly the argument against having two copies. The shared handler
// also returns the request id, so a reported failure is traceable to a log line.
app.use(errorHandler());

// Listen only once the shared schema exists. Accepting requests first would let
// the first caller race the PostgreSQL schema creation and see a missing table.
bootstrap()
  .then(() => {
    app.listen(PORT, () => {
      logger.info('listening', {
        port: PORT,
        dialect: driver.dialect,
        services: 12,
        environment: process.env.NODE_ENV || 'development',
      });
    });
  })
  .catch((e: any) => {
    // A store that cannot be initialised at all is fatal — serving every request
    // as a 500 would look like an application bug rather than a missing database.
    logger.error('failed to initialise databases', { error: e });
    process.exit(1);
  });

export { app };
