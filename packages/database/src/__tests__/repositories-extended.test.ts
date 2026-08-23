import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createRepositories, closeDatabase } from '../index';
import type { Repositories } from '../index';

describe('Database Repositories - Extended Coverage', () => {
  let repos: Repositories;

  beforeAll(() => {
    repos = createRepositories();
  });

  afterAll(() => {
    closeDatabase();
  });

  describe('ApplicationRepository - Full Lifecycle', () => {
    it('creates application with full applicant data', () => {
      const app = repos.applications.create({
        applicant: {
          title: 'Mr',
          firstName: 'James',
          lastName: 'MacTavish',
          dateOfBirth: '1985-03-15',
          niNumber: 'AB123456C',
          maritalStatus: 'married',
          dependants: 2,
          employment: 'employed',
          email: 'james@example.com',
          phone: '07700900123',
        },
      });

      expect(app).toBeDefined();
      expect(app.id).toBeTruthy();
      expect(app.referenceNumber).toMatch(/^IAAS-\d{4}-\d{5}$/);
      expect(app.status).toBe('draft');

      const full = repos.applications.getWithRelations(app.id);
      expect(full).not.toBeNull();
      expect(full!.applicant).not.toBeNull();
      expect(full!.applicant!.firstName).toBe('James');
      expect(full!.applicant!.lastName).toBe('MacTavish');
      expect(full!.applicant!.niNumber).toBe('AB123456C');
      expect(full!.applicant!.dependants).toBe(2);
      expect(full!.applicant!.email).toBe('james@example.com');
    });

    it('updates status lifecycle: draft -> submitted -> under_review -> approved', () => {
      const app = repos.applications.create({ status: 'draft' });

      repos.applications.updateStatus(app.id, 'submitted');
      let updated = repos.applications.findById(app.id);
      expect(updated!.status).toBe('submitted');

      repos.applications.updateStatus(app.id, 'under_review');
      updated = repos.applications.findById(app.id);
      expect(updated!.status).toBe('under_review');

      repos.applications.updateStatus(app.id, 'approved');
      updated = repos.applications.findById(app.id);
      expect(updated!.status).toBe('approved');
    });

    it('lists applications filtered by status', () => {
      const uniqueStatus = `test-status-${Date.now()}`;
      repos.applications.create({ status: uniqueStatus });
      repos.applications.create({ status: uniqueStatus });
      repos.applications.create({ status: 'other' });

      const result = repos.applications.list({ status: uniqueStatus });
      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.data.every(a => a.status === uniqueStatus)).toBe(true);
    });

    it('deletes application and cascades related data', () => {
      const app = repos.applications.create({
        applicant: { firstName: 'Delete', lastName: 'Me' },
        addresses: [{ line1: '1 Test St', city: 'Edinburgh', postcode: 'EH1 1AA' }],
        debts: [{ creditor: 'Bank A', type: 'personal_loan', amount: 5000 }],
      });

      repos.applications.delete(app.id);
      const found = repos.applications.findById(app.id);
      expect(found).toBeNull();
    });

    it('creates application with multiple addresses', () => {
      const app = repos.applications.create({
        addresses: [
          { line1: '10 High Street', city: 'Edinburgh', postcode: 'EH1 1AA', isCurrent: true },
          { line1: '5 Old Road', city: 'Glasgow', postcode: 'G1 2AB', isCurrent: false, residentFrom: '2018-01-01', residentTo: '2022-06-30' },
        ],
      });

      const addresses = repos.applications.getAddresses(app.id);
      expect(addresses).toHaveLength(2);
      expect(addresses.find(a => a.isCurrent)).toBeDefined();
      expect(addresses.find(a => a.city === 'Glasgow')).toBeDefined();
    });

    it('creates application with debts and assets', () => {
      const app = repos.applications.create({
        debts: [
          { creditor: 'Royal Bank', type: 'credit_card', amount: 3500, monthlyPayment: 100 },
          { creditor: 'Council', type: 'council_tax', amount: 1200, monthlyPayment: 50 },
        ],
        assets: [
          { type: 'vehicle', description: '2015 Ford Focus', value: 4000, outstanding: 0, isEssential: true },
          { type: 'savings', description: 'ISA Account', value: 500, outstanding: 0, isEssential: false },
        ],
      });

      const debts = repos.applications.getDebts(app.id);
      expect(debts).toHaveLength(2);
      expect(debts[0].creditor).toBeTruthy();
      expect(debts[0].amount).toBeGreaterThan(0);

      const assets = repos.applications.getAssets(app.id);
      expect(assets).toHaveLength(2);
      expect(assets.find(a => a.isEssential)).toBeDefined();
    });

    it('sets income and expenditure', () => {
      const app = repos.applications.create({});
      const ie = repos.applications.setIncomeExpenditure(app.id, {
        income: { salary: 2200, benefits: 300, other: 0 },
        expenditure: { rent: 800, utilities: 150, food: 300, transport: 100 },
      });

      expect(ie.income.salary).toBe(2200);
      expect(ie.expenditure.rent).toBe(800);
    });

    it('finds application by reference number', () => {
      const app = repos.applications.create({});
      const found = repos.applications.findByReference(app.referenceNumber);
      expect(found).not.toBeNull();
      expect(found!.id).toBe(app.id);
    });

    it('update method modifies assignedTo', () => {
      const app = repos.applications.create({});
      const updated = repos.applications.update(app.id, { assignedTo: 'officer-001' });
      expect(updated.assignedTo).toBe('officer-001');
    });
  });

  describe('AuditRepository - Extended Queries', () => {
    it('creates multiple audit events for one application', () => {
      const app = repos.applications.create({});
      repos.audit.create({ applicationId: app.id, action: 'application.created', actorType: 'system' });
      repos.audit.create({ applicationId: app.id, action: 'application.updated', actorType: 'user', actorName: 'John' });
      repos.audit.create({ applicationId: app.id, action: 'application.submitted', actorType: 'user', actorName: 'John' });

      const events = repos.audit.findByApplication(app.id);
      expect(events).toHaveLength(3);
      expect(events.map(e => e.action)).toContain('application.submitted');
    });

    it('queries audit events with limit', () => {
      // Create several events
      for (let i = 0; i < 5; i++) {
        repos.audit.create({ action: `batch.event.${i}`, actorType: 'system' });
      }

      const limited = repos.audit.findAll({ limit: 3 });
      expect(limited).toHaveLength(3);
    });

    it('queries audit events by date range', () => {
      const past = new Date('2020-01-01').toISOString();
      const future = new Date('2030-12-31').toISOString();

      repos.audit.create({ action: 'dated.event', actorType: 'system' });

      const events = repos.audit.findAll({ from: past, to: future });
      expect(events.length).toBeGreaterThanOrEqual(1);
    });

    it('counts events by action filter', () => {
      const uniqueAction = `unique.action.${Date.now()}`;
      repos.audit.create({ action: uniqueAction, actorType: 'system' });
      repos.audit.create({ action: uniqueAction, actorType: 'system' });

      const count = repos.audit.count({ action: uniqueAction });
      expect(count).toBe(2);
    });
  });

  describe('UserRepository - Sessions & Roles', () => {
    it('creates a session and validates it', () => {
      const expiresAt = new Date(Date.now() + 7200000).toISOString();
      const token = `session-valid-${Date.now()}`;
      const session = repos.users.createSession('user-admin', token, expiresAt);

      expect(session.token).toBe(token);
      expect(session.userId).toBe('user-admin');

      const found = repos.users.findSessionByToken(token);
      expect(found).not.toBeNull();
      expect(found!.userId).toBe('user-admin');
    });

    it('returns null for invalid session token', () => {
      const found = repos.users.findSessionByToken('nonexistent-token-xyz');
      expect(found).toBeNull();
    });

    it('deletes expired sessions', () => {
      const expiredAt = new Date(Date.now() - 86400000).toISOString();
      const token = `expired-session-${Date.now()}`;
      repos.users.createSession('user-admin', token, expiredAt);

      const deleted = repos.users.deleteExpiredSessions();
      expect(deleted).toBeGreaterThanOrEqual(1);

      const found = repos.users.findSessionByToken(token);
      expect(found).toBeNull();
    });

    it('finds users by role', () => {
      const result = repos.users.list({ role: 'system_admin' });
      expect(result.data.length).toBeGreaterThanOrEqual(1);
      expect(result.total).toBeGreaterThanOrEqual(1);
    });

    it('creates a user with debtor role', () => {
      const user = repos.users.create({
        email: `debtor-${Date.now()}@example.com`,
        firstName: 'Sarah',
        lastName: 'Connor',
        roleId: 'role-debtor',
      });

      expect(user.id).toBeTruthy();
      expect(user.firstName).toBe('Sarah');
      expect(user.lastName).toBe('Connor');
      expect(user.status).toBe('active');
    });
  });

  describe('OrganisationRepository', () => {
    it('creates an organisation with parent', () => {
      const parent = repos.organisations.create({
        name: `Parent Org ${Date.now()}`,
        type: 'government_agency',
        status: 'active',
      });

      const child = repos.organisations.create({
        name: `Child Branch ${Date.now()}`,
        type: 'branch_office',
        parentId: parent.id,
        status: 'active',
      });

      expect(child.parentId).toBe(parent.id);
      const children = repos.organisations.getChildren(parent.id);
      expect(children.length).toBeGreaterThanOrEqual(1);
      expect(children.find(c => c.id === child.id)).toBeDefined();
    });

    it('finds organisations by type', () => {
      const uniqueType = `test-type-${Date.now()}`;
      repos.organisations.create({ name: `Org A ${Date.now()}`, type: uniqueType });
      repos.organisations.create({ name: `Org B ${Date.now()}`, type: uniqueType });

      const result = repos.organisations.list({ type: uniqueType });
      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('updates organisation status', () => {
      const org = repos.organisations.create({
        name: `Status Test ${Date.now()}`,
        type: 'adviser_firm',
        status: 'active',
      });

      const updated = repos.organisations.update(org.id, { status: 'suspended' });
      expect(updated.status).toBe('suspended');
    });

    it('creates organisation with contact details and address', () => {
      const org = repos.organisations.create({
        name: `Full Org ${Date.now()}`,
        type: 'adviser_firm',
        registrationNumber: 'SC123456',
        contactEmail: 'info@firm.example.com',
        contactPhone: '0131 555 0000',
        addressLine1: '50 George Street',
        addressCity: 'Edinburgh',
        addressPostcode: 'EH2 2LR',
      });

      expect(org.registrationNumber).toBe('SC123456');
      expect(org.contactEmail).toBe('info@firm.example.com');
      expect(org.addressCity).toBe('Edinburgh');
    });
  });

  describe('RecommendationRepository', () => {
    it('creates a recommendation linked to an application', () => {
      const app = repos.applications.create({});
      const rec = repos.recommendations.create({
        applicationId: app.id,
        product: 'DAS',
        confidence: 'high',
        confidencePct: 87,
        reasoning: ['Debt under threshold', 'Stable income detected'],
        factors: { totalDebt: 8000, income: 2200, expenditure: 1800 },
        alternatives: [{ product: 'MAP', confidence: 'medium', confidencePct: 62 }],
        engineVersion: '2.1.0',
      });

      expect(rec.id).toBeTruthy();
      expect(rec.applicationId).toBe(app.id);
      expect(rec.product).toBe('DAS');
      expect(rec.confidence).toBe('high');
      expect(rec.confidencePct).toBe(87);
      expect(rec.reasoning).toHaveLength(2);
      expect(rec.engineVersion).toBe('2.1.0');
    });

    it('finds recommendation by application', () => {
      const app = repos.applications.create({});
      repos.recommendations.create({
        applicationId: app.id,
        product: 'Sequestration',
        confidence: 'medium',
        confidencePct: 65,
        reasoning: ['Debt exceeds threshold'],
        factors: { totalDebt: 45000 },
        alternatives: [],
        engineVersion: '2.1.0',
      });

      const found = repos.recommendations.findByApplication(app.id);
      expect(found).not.toBeNull();
      expect(found!.product).toBe('Sequestration');
      expect(found!.confidencePct).toBe(65);
    });

    it('replaces existing recommendation for same application (one-to-one)', () => {
      const app = repos.applications.create({});

      repos.recommendations.create({
        applicationId: app.id,
        product: 'MAP',
        confidence: 'low',
        confidencePct: 40,
        reasoning: ['Initial assessment'],
        factors: {},
        alternatives: [],
        engineVersion: '2.0.0',
      });

      repos.recommendations.create({
        applicationId: app.id,
        product: 'DAS',
        confidence: 'high',
        confidencePct: 90,
        reasoning: ['Reassessed with full data'],
        factors: {},
        alternatives: [],
        engineVersion: '2.1.0',
      });

      const found = repos.recommendations.findByApplication(app.id);
      expect(found).not.toBeNull();
      expect(found!.product).toBe('DAS');
      expect(found!.confidencePct).toBe(90);
    });
  });

  describe('DocumentRepository', () => {
    it('creates a document linked to application', () => {
      const app = repos.applications.create({});
      const doc = repos.documents.create({
        applicationId: app.id,
        filename: 'bank-statement-abc123.pdf',
        originalName: 'Bank Statement Jan 2024.pdf',
        mimeType: 'application/pdf',
        size: 245000,
        category: 'bank_statement',
        storagePath: '/uploads/bank-statement-abc123.pdf',
      });

      expect(doc.id).toBeTruthy();
      expect(doc.applicationId).toBe(app.id);
      expect(doc.filename).toBe('bank-statement-abc123.pdf');
      expect(doc.scanStatus).toBe('pending');
      expect(doc.scanResult).toBeNull();
    });

    it('updates scan status to clean', () => {
      const app = repos.applications.create({});
      const doc = repos.documents.create({
        applicationId: app.id,
        filename: 'doc-scan-test.pdf',
        originalName: 'Test.pdf',
        mimeType: 'application/pdf',
        size: 10000,
        category: 'identity',
        storagePath: '/uploads/doc-scan-test.pdf',
      });

      repos.documents.updateScanStatus(doc.id, 'clean', { scanner: 'ClamAV', threats: 0 });

      const found = repos.documents.findById(doc.id);
      expect(found).not.toBeNull();
      expect(found!.scanStatus).toBe('clean');
      expect(found!.scanResult).toEqual({ scanner: 'ClamAV', threats: 0 });
    });

    it('finds documents by application', () => {
      const app = repos.applications.create({});
      repos.documents.create({ applicationId: app.id, filename: 'a.pdf', originalName: 'A.pdf', mimeType: 'application/pdf', size: 100, category: 'evidence', storagePath: '/a.pdf' });
      repos.documents.create({ applicationId: app.id, filename: 'b.pdf', originalName: 'B.pdf', mimeType: 'application/pdf', size: 200, category: 'identity', storagePath: '/b.pdf' });

      const docs = repos.documents.findByApplication(app.id);
      expect(docs).toHaveLength(2);
    });

    it('finds documents by category', () => {
      const app = repos.applications.create({});
      repos.documents.create({ applicationId: app.id, filename: 'id1.jpg', originalName: 'ID.jpg', mimeType: 'image/jpeg', size: 500, category: 'identity', storagePath: '/id1.jpg' });
      repos.documents.create({ applicationId: app.id, filename: 'stmt.pdf', originalName: 'Stmt.pdf', mimeType: 'application/pdf', size: 300, category: 'bank_statement', storagePath: '/stmt.pdf' });

      const identityDocs = repos.documents.findByCategory(app.id, 'identity');
      expect(identityDocs).toHaveLength(1);
      expect(identityDocs[0].category).toBe('identity');
    });
  });

  describe('PaymentRepository', () => {
    it('creates a payment for an application', () => {
      const app = repos.applications.create({});
      const payment = repos.payments.create({
        applicationId: app.id,
        amount: 200,
        currency: 'GBP',
        provider: 'stripe',
      });

      expect(payment.id).toBeTruthy();
      expect(payment.applicationId).toBe(app.id);
      expect(payment.amount).toBe(200);
      expect(payment.currency).toBe('GBP');
      expect(payment.status).toBe('pending');
      expect(payment.paidAt).toBeNull();
    });

    it('updates payment status to completed and sets paidAt', () => {
      const app = repos.applications.create({});
      const payment = repos.payments.create({ applicationId: app.id, amount: 150 });

      repos.payments.updateStatus(payment.id, 'completed');

      const found = repos.payments.findById(payment.id);
      expect(found).not.toBeNull();
      expect(found!.status).toBe('completed');
      expect(found!.paidAt).not.toBeNull();
    });

    it('updates payment status to failed (no paidAt)', () => {
      const app = repos.applications.create({});
      const payment = repos.payments.create({ applicationId: app.id, amount: 75 });

      repos.payments.updateStatus(payment.id, 'failed');

      const found = repos.payments.findById(payment.id);
      expect(found!.status).toBe('failed');
      expect(found!.paidAt).toBeNull();
    });

    it('finds payments by application', () => {
      const app = repos.applications.create({});
      repos.payments.create({ applicationId: app.id, amount: 100 });
      repos.payments.create({ applicationId: app.id, amount: 50 });

      const payments = repos.payments.findByApplication(app.id);
      expect(payments).toHaveLength(2);
    });

    it('sets provider reference', () => {
      const app = repos.applications.create({});
      const payment = repos.payments.create({ applicationId: app.id, amount: 200 });

      repos.payments.setProviderRef(payment.id, 'worldpay', 'WP-REF-001234');

      const found = repos.payments.findById(payment.id);
      expect(found!.provider).toBe('worldpay');
      expect(found!.providerRef).toBe('WP-REF-001234');
    });
  });
});
