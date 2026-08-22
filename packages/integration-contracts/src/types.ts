/**
 * Common types used by all integration clients.
 * These mirror the response shape from the mock-integrations service.
 */

export interface IntegrationResult<T = any> {
  found: boolean;
  data: T | null;
  system: string;
  responseTime: number;
  error?: string;
}

export interface BasysCase {
  caseRef: string;
  type: string;
  status: string;
  debtorName: string;
  dateRegistered: string;
}

export interface EdenArrangement {
  arrangementRef: string;
  type: string;
  status: string;
  debtorName: string;
  startDate: string;
}

export interface DasEntry {
  programmeRef: string;
  status: string;
  debtorName: string;
}

export interface CftProvider {
  id: string;
  name: string;
  type: string;
  status: string;
}

export interface MoratoriumRecord {
  id: string;
  status: string;
  startDate: string;
  endDate: string;
}

export interface RoiEntry {
  entryRef: string;
  type: string;
  status: string;
  dateRegistered: string;
}

export interface CreditCheckResult {
  score: number;
  result: 'PASS' | 'FAIL';
  defaults: number;
  ccjs: number;
  provider: string;
}

export interface LookupParams {
  niNumber: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
}
