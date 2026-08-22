import {
  IntegrationResult,
  BasysCase,
  EdenArrangement,
  DasEntry,
  CftProvider,
  MoratoriumRecord,
  RoiEntry,
  CreditCheckResult,
  LookupParams,
} from './types';

export interface IBasysClient {
  lookup(params: LookupParams): Promise<IntegrationResult<BasysCase>>;
  healthCheck(): Promise<boolean>;
}

export interface IEdenClient {
  lookup(params: LookupParams): Promise<IntegrationResult<EdenArrangement>>;
  healthCheck(): Promise<boolean>;
}

export interface IDasClient {
  lookup(params: LookupParams): Promise<IntegrationResult<DasEntry>>;
  healthCheck(): Promise<boolean>;
}

export interface ICftClient {
  lookup(params: LookupParams): Promise<IntegrationResult<CftProvider>>;
  healthCheck(): Promise<boolean>;
}

export interface IMoratoriumClient {
  check(params: LookupParams): Promise<IntegrationResult<MoratoriumRecord>>;
  healthCheck(): Promise<boolean>;
}

export interface IRoiClient {
  search(params: LookupParams): Promise<IntegrationResult<RoiEntry>>;
  healthCheck(): Promise<boolean>;
}

export interface ICreditClient {
  runCheck(params: LookupParams & { consentGiven: boolean }): Promise<IntegrationResult<CreditCheckResult>>;
  healthCheck(): Promise<boolean>;
}

/** Unified orchestration interface for running all integration checks. */
export interface IIntegrationOrchestrator {
  runAllChecks(params: LookupParams): Promise<IntegrationResult[]>;
  getSystemHealth(): Promise<Record<string, boolean>>;
}
