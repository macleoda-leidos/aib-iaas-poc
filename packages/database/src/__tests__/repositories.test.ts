import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createRepositories, closeDatabase } from '../index';
import type { Repositories } from '../index';

describe('Database Repositories', () => {
  let repos: Repositories;

  beforeAll(() => {
    repos = createRepositories();
  });

  afterAll(() => {
    closeDatabase();
  });

  describe('ApplicationRepository', () => {
    it('creates an application with reference number', () => {
      const app = repos.applications.create({
        applicant: { firstName: 'Jane', lastName: 'Doe' },
      });

      expect(app).toBeDefined();
      expect(app.id).toBeTruthy();
      expect(app.referenceNumber).toMatch(/^IAAS-\d{4}-\d{5}$/);
      expect(app.status).toBe('draft');
      expect(app.createdAt).toBeTruthy();
    });

    it('finds application by id', () => {
      const created = repos.applications.create({});
      const found = repos.applications.findById(created.id);

      expect(found).not.toBeNull();
      expect(found!.id).toBe(created.id);
      expect(found!.referenceNumber).toBe(created.referenceNumber);
    });

    it('lists applications with pagination', () => {
      // Create a few applications
      repos.applications.create({ status: 'submitted' });
      repos.applications.create({ status: 'submitted' });
      repos.applications.create({ status: 'draft' });

      const result = repos.applications.list({ page: 1, pageSize: 2 });

      expect(result.data).toHaveLength(2);
      expect(result.total).toBeGreaterThanOrEqual(3);
    });

    it('updates application status', () => {
      const app = repos.applications.create({ status: 'draft' });
      repos.applications.updateStatus(app.id, 'submitted');

      const updated = repos.applications.findById(app.id);
      expect(updated!.status).toBe('submitted');
    });

    it('filters list by status', () => {
      const ref = `TEST-FILTER-${Date.now()}`;
      repos.applications.create({ referenceNumber: ref, status: 'review' });

      const result = repos.applications.list({ status: 'review' });
      expect(result.data.length).toBeGreaterThanOrEqual(1);
      expect(result.data.every(a => a.status === 'review')).toBe(true);
    });

    it('returns null for non-existent id', () => {
      const found = repos.applications.findById('non-existent-id');
      expect(found).toBeNull();
    });
  });

  describe('AuditRepository', () => {
    it('creates an audit event', () => {
      // Use a real application so FK constraint is satisfied
      const app = repos.applications.create({});
      const event = repos.audit.create({
        applicationId: app.id,
        action: 'application.created',
        actorType: 'system',
        actorName: 'Test Runner',
        details: { source: 'unit-test' },
      });

      expect(event).toBeDefined();
      expect(event.id).toBeTruthy();
      expect(event.action).toBe('application.created');
      expect(event.actorType).toBe('system');
      expect(event.details).toEqual({ source: 'unit-test' });
      expect(event.timestamp).toBeTruthy();
    });

    it('finds events by application', () => {
      const app1 = repos.applications.create({});
      const app2 = repos.applications.create({});
      repos.audit.create({ applicationId: app1.id, action: 'step1', actorType: 'user' });
      repos.audit.create({ applicationId: app1.id, action: 'step2', actorType: 'user' });
      repos.audit.create({ applicationId: app2.id, action: 'step3', actorType: 'user' });

      const events = repos.audit.findByApplication(app1.id);
      expect(events).toHaveLength(2);
      expect(events.every(e => e.applicationId === app1.id)).toBe(true);
    });

    it('filters by actorType', () => {
      repos.audit.create({ action: 'test.system', actorType: 'system' });
      repos.audit.create({ action: 'test.user', actorType: 'user' });

      const systemEvents = repos.audit.findAll({ actorType: 'system' });
      expect(systemEvents.length).toBeGreaterThanOrEqual(1);
      expect(systemEvents.every(e => e.actorType === 'system')).toBe(true);
    });

    it('returns count of events', () => {
      const count = repos.audit.count();
      expect(count).toBeGreaterThanOrEqual(1);
    });
  });

  describe('UserRepository', () => {
    it('finds user by email', () => {
      // Seeded user from schema
      const user = repos.users.findByEmail('admin@aib-poc.example.com');

      expect(user).not.toBeNull();
      expect(user!.email).toBe('admin@aib-poc.example.com');
      expect(user!.firstName).toBe('Admin');
      expect(user!.lastName).toBe('User');
    });

    it('creates a session', () => {
      const expiresAt = new Date(Date.now() + 3600000).toISOString();
      const session = repos.users.createSession('user-admin', 'test-token-123', expiresAt);

      expect(session).toBeDefined();
      expect(session.userId).toBe('user-admin');
      expect(session.token).toBe('test-token-123');
      expect(session.expiresAt).toBe(expiresAt);

      // Verify we can find it
      const found = repos.users.findSessionByToken('test-token-123');
      expect(found).not.toBeNull();
      expect(found!.userId).toBe('user-admin');
    });

    it('lists users with role filter', () => {
      const result = repos.users.list({ role: 'system_admin' });

      expect(result.data.length).toBeGreaterThanOrEqual(1);
      expect(result.total).toBeGreaterThanOrEqual(1);
    });

    it('returns null for non-existent email', () => {
      const user = repos.users.findByEmail('nonexistent@nowhere.test');
      expect(user).toBeNull();
    });

    it('creates a new user', () => {
      const user = repos.users.create({
        email: `test-${Date.now()}@example.com`,
        firstName: 'Test',
        lastName: 'User',
        roleId: 'role-debtor',
      });

      expect(user).toBeDefined();
      expect(user.id).toBeTruthy();
      expect(user.firstName).toBe('Test');
      expect(user.status).toBe('active');
    });

    it('deletes expired sessions', () => {
      const expiredAt = new Date(Date.now() - 3600000).toISOString();
      repos.users.createSession('user-admin', `expired-${Date.now()}`, expiredAt);

      const deleted = repos.users.deleteExpiredSessions();
      expect(deleted).toBeGreaterThanOrEqual(1);
    });
  });
});
