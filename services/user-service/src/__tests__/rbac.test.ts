import { describe, it, expect } from 'vitest';

// Test the RBAC logic from shared-types
import { hasPermission, hasAnyPermission, hasAllPermissions } from '../../../../packages/shared-types/src/rbac';

describe('RBAC Permission Helpers', () => {
  const adviserPermissions = [
    'application.create', 'application.read.own', 'application.update', 'application.submit',
    'note.create', 'note.read', 'document.upload', 'document.read',
    'credit_check.run', 'credit_check.view', 'integrations.run',
    'payment.initiate', 'payment.view', 'recommendation.view',
  ];

  const debtorPermissions = [
    'application.create', 'application.read.own', 'application.update', 'application.submit',
    'document.upload', 'document.read', 'document.delete',
    'payment.initiate', 'payment.view', 'recommendation.view',
  ];

  describe('hasPermission', () => {
    it('returns true when user has the permission', () => {
      expect(hasPermission(adviserPermissions, 'credit_check.run')).toBe(true);
    });
    it('returns false when user lacks the permission', () => {
      expect(hasPermission(debtorPermissions, 'credit_check.run')).toBe(false);
    });
    it('returns false for empty permissions', () => {
      expect(hasPermission([], 'application.create')).toBe(false);
    });
  });

  describe('hasAnyPermission', () => {
    it('returns true when user has at least one', () => {
      expect(hasAnyPermission(debtorPermissions, ['credit_check.run', 'application.create'])).toBe(true);
    });
    it('returns false when user has none', () => {
      expect(hasAnyPermission(debtorPermissions, ['credit_check.run', 'user.manage'])).toBe(false);
    });
  });

  describe('hasAllPermissions', () => {
    it('returns true when user has all', () => {
      expect(hasAllPermissions(adviserPermissions, ['credit_check.run', 'document.upload'])).toBe(true);
    });
    it('returns false when user is missing one', () => {
      expect(hasAllPermissions(adviserPermissions, ['credit_check.run', 'user.manage'])).toBe(false);
    });
  });

  describe('Role-based access scenarios', () => {
    it('adviser can run credit check but debtor cannot', () => {
      expect(hasPermission(adviserPermissions, 'credit_check.run')).toBe(true);
      expect(hasPermission(debtorPermissions, 'credit_check.run')).toBe(false);
    });
    it('debtor can delete own documents but adviser cannot', () => {
      expect(hasPermission(debtorPermissions, 'document.delete')).toBe(true);
      expect(hasPermission(adviserPermissions, 'document.delete')).toBe(false);
    });
    it('both can create applications', () => {
      expect(hasPermission(adviserPermissions, 'application.create')).toBe(true);
      expect(hasPermission(debtorPermissions, 'application.create')).toBe(true);
    });
  });
});
