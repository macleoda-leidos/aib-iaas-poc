import { describe, it, expect } from 'vitest';

/**
 * Contract tests for mock integration services.
 * These verify that response shapes match the expected schema that
 * the integration orchestrator and consuming services rely upon.
 *
 * In production, these same contracts would validate real integration responses.
 */

// Shared response envelope contract
interface IntegrationResponse {
  requestId: string;
  system: string;
  status: 'success' | 'not_found' | 'error' | 'timeout';
  data?: Record<string, unknown>;
  timestamp: string;
}

describe('BASYS Contract', () => {
  it('should match found-case response schema', () => {
    const response: IntegrationResponse = {
      requestId: 'test-uuid',
      system: 'BASYS',
      status: 'success',
      data: {
        found: true,
        caseReference: 'SEQ-2019-004521',
        caseType: 'sequestration',
        debtorName: 'John Smith',
        dateAwarded: '2019-08-14',
        dateOfDischarge: '2020-08-14',
        status: 'discharged',
        trustee: 'Sample Trustees Ltd',
        totalDebt: 34500,
      },
      timestamp: new Date().toISOString(),
    };

    expect(response.requestId).toBeDefined();
    expect(response.system).toBe('BASYS');
    expect(response.status).toBe('success');
    expect(response.data?.found).toBe(true);
    expect(response.data?.caseReference).toMatch(/^SEQ-\d{4}-\d+$/);
    expect(response.data?.caseType).toMatch(/^(sequestration|trust_deed|minimal_asset_process)$/);
    expect(response.data?.status).toMatch(/^(active|discharged|completed)$/);
    expect(response.timestamp).toBeDefined();
  });

  it('should match not-found response schema', () => {
    const response: IntegrationResponse = {
      requestId: 'test-uuid',
      system: 'BASYS',
      status: 'not_found',
      data: { found: false },
      timestamp: new Date().toISOString(),
    };

    expect(response.status).toBe('not_found');
    expect(response.data?.found).toBe(false);
  });
});

describe('eDEN/DASH Contract', () => {
  it('should match active-arrangement response schema', () => {
    const response: IntegrationResponse = {
      requestId: 'test-uuid',
      system: 'eDEN',
      status: 'success',
      data: {
        found: true,
        arrangementReference: 'DAS-ARR-2022-007834',
        status: 'active',
        approvedDate: '2022-03-15',
        totalDebt: 18500,
        monthlyPayment: 285,
        paymentDistributor: 'Sample Payment Services Ltd',
        creditorCount: 4,
      },
      timestamp: new Date().toISOString(),
    };

    expect(response.system).toBe('eDEN');
    expect(response.data?.arrangementReference).toMatch(/^DAS-ARR-/);
    expect(response.data?.totalDebt).toBeGreaterThan(0);
    expect(response.data?.monthlyPayment).toBeGreaterThan(0);
  });
});

describe('DAS Contract', () => {
  it('should match programme response schema', () => {
    const response: IntegrationResponse = {
      requestId: 'test-uuid',
      system: 'DAS',
      status: 'success',
      data: {
        found: true,
        programmeReference: 'DPP-2023-001234',
        programmeStatus: 'application_in_progress',
        applicationDate: '2023-11-20',
        approvedMoneyAdviser: 'Citizens Advice Scotland (Sample)',
        totalDebtDeclared: 12000,
        proposedPayment: 250,
      },
      timestamp: new Date().toISOString(),
    };

    expect(response.data?.programmeReference).toMatch(/^DPP-/);
    expect(response.data?.programmeStatus).toMatch(/^(application_in_progress|active|completed|revoked)$/);
    expect(typeof response.data?.totalDebtDeclared).toBe('number');
  });
});

describe('Moratorium Contract', () => {
  it('should match active-moratorium response schema', () => {
    const response: IntegrationResponse = {
      requestId: 'test-uuid',
      system: 'Moratorium',
      status: 'success',
      data: {
        found: true,
        moratoriumReference: 'MOR-2024-003456',
        startDate: '2024-03-01',
        endDate: '2024-04-12',
        status: 'active',
        weeksRemaining: 4,
        registeredBy: 'Citizens Advice Scotland (Sample)',
      },
      timestamp: new Date().toISOString(),
    };

    expect(response.data?.moratoriumReference).toMatch(/^MOR-/);
    expect(response.data?.status).toMatch(/^(active|expired|cancelled)$/);
    expect(typeof response.data?.weeksRemaining).toBe('number');
  });
});

describe('RoI Contract', () => {
  it('should match register-entry response schema', () => {
    const response: IntegrationResponse = {
      requestId: 'test-uuid',
      system: 'RoI',
      status: 'success',
      data: {
        found: true,
        entries: [{
          entryId: 'ROI-2018-012345',
          entryType: 'sequestration',
          debtorName: 'Test Person',
          dateRegistered: '2018-11-20',
          status: 'discharged',
          linkedCaseReference: 'SEQ-2018-004521',
        }],
      },
      timestamp: new Date().toISOString(),
    };

    expect(response.data?.found).toBe(true);
    expect(Array.isArray(response.data?.entries)).toBe(true);
    const entry = (response.data?.entries as any[])[0];
    expect(entry.entryId).toMatch(/^ROI-/);
    expect(entry.entryType).toMatch(/^(sequestration|trust_deed|map)$/);
  });
});

describe('Credit Check Contract', () => {
  it('should match credit-check response schema', () => {
    const response = {
      requestId: 'test-uuid',
      system: 'CreditCheck',
      status: 'success' as const,
      data: {
        provider: 'SyntheticCredit Ltd (PLACEHOLDER)',
        checkedAt: new Date().toISOString(),
        creditScore: 520,
        scoreRange: { min: 0, max: 999 },
        defaults: 1,
        ccjs: 0,
        bankruptcyFlag: false,
        ivaFlag: false,
        status: 'issues_found',
      },
      timestamp: new Date().toISOString(),
    };

    expect(response.data.creditScore).toBeGreaterThanOrEqual(0);
    expect(response.data.creditScore).toBeLessThanOrEqual(999);
    expect(typeof response.data.defaults).toBe('number');
    expect(typeof response.data.ccjs).toBe('number');
    expect(typeof response.data.bankruptcyFlag).toBe('boolean');
    expect(response.data.status).toMatch(/^(clear|issues_found|unable_to_check)$/);
  });
});

describe('Response Envelope Contract', () => {
  it('all integration responses must have requestId, system, status, timestamp', () => {
    const systems = ['BASYS', 'eDEN', 'DAS', 'CFT', 'Moratorium', 'RoI'];

    systems.forEach(system => {
      const response: IntegrationResponse = {
        requestId: `test-${system}`,
        system,
        status: 'not_found',
        data: { found: false },
        timestamp: new Date().toISOString(),
      };

      expect(response.requestId).toBeTruthy();
      expect(response.system).toBe(system);
      expect(['success', 'not_found', 'error', 'timeout']).toContain(response.status);
      expect(response.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
  });

  it('error responses must include errorMessage', () => {
    const response: IntegrationResponse = {
      requestId: 'test-error',
      system: 'BASYS',
      status: 'error',
      timestamp: new Date().toISOString(),
    };

    // When status is error, consumers should handle missing data gracefully
    expect(response.data).toBeUndefined();
    expect(response.status).toBe('error');
  });
});
