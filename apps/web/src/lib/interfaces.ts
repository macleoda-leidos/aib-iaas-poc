/**
 * Frontend Repository Interfaces
 *
 * These interfaces define the contract between the UI and data layer.
 * Current implementation: LocalStorage (persistence.ts)
 * Future implementation: .NET 9 Web API calls
 *
 * To migrate to .NET:
 * 1. Create .NET API implementing these same operations
 * 2. Swap LocalStorageApplicationRepository with ApiApplicationRepository
 * 3. No UI code changes required
 */

import { SeedApplication } from './seedData';

export interface IApplicationRepository {
  getAll(): SeedApplication[] | Promise<SeedApplication[]>;
  getById(ref: string): SeedApplication | null | Promise<SeedApplication | null>;
  create(app: Partial<SeedApplication>): SeedApplication | Promise<SeedApplication>;
  update(ref: string, data: Partial<SeedApplication>): SeedApplication | null | Promise<SeedApplication | null>;
  updateStatus(ref: string, status: string): void | Promise<void>;
  search(query: string): SeedApplication[] | Promise<SeedApplication[]>;
  getByStatus(status: string): SeedApplication[] | Promise<SeedApplication[]>;
}

export interface ICaseRepository {
  getCase(ref: string): CaseDetail | null | Promise<CaseDetail | null>;
  updateCase(ref: string, data: Partial<CaseDetail>): void | Promise<void>;
  approve(ref: string, officer: string): void | Promise<void>;
  reject(ref: string, officer: string, reason: string): void | Promise<void>;
  requestInfo(ref: string, officer: string, details: string): void | Promise<void>;
}

export interface ISearchRepository {
  search(query: string, filters?: SearchFilters): SearchResult[] | Promise<SearchResult[]>;
  suggest(partial: string): string[] | Promise<string[]>;
}

export interface IRulesRepository {
  getAll(): Rule[] | Promise<Rule[]>;
  getById(id: string): Rule | null | Promise<Rule | null>;
  evaluate(input: RuleInput): RuleOutput | Promise<RuleOutput>;
}

export interface IDocumentRepository {
  upload(file: File, applicationRef: string): DocumentMeta | Promise<DocumentMeta>;
  getByApplication(ref: string): DocumentMeta[] | Promise<DocumentMeta[]>;
  scan(docId: string): ScanResult | Promise<ScanResult>;
}

export interface IAuditRepository {
  log(event: AuditInput): AuditEvent | Promise<AuditEvent>;
  getByRef(ref: string): AuditEvent[] | Promise<AuditEvent[]>;
  getAll(limit?: number): AuditEvent[] | Promise<AuditEvent[]>;
}

export interface INotificationRepository {
  getAll(): Notification[] | Promise<Notification[]>;
  getUnread(): Notification[] | Promise<Notification[]>;
  markRead(id: string): void | Promise<void>;
  markAllRead(): void | Promise<void>;
}

// Supporting types
export interface CaseDetail { ref: string; status: string; applicant: any; debts: any[]; recommendation: any; timeline: any[]; }
export interface SearchFilters { status?: string; product?: string; region?: string; }
export interface SearchResult { ref: string; name: string; score: number; }
export interface Rule { id: string; name: string; version: string; status: string; conditions: any[]; }
export interface RuleInput { totalDebt: number; disposableIncome: number; assets: number; }
export interface RuleOutput { product: string; confidence: number; }
export interface DocumentMeta { id: string; name: string; size: number; status: string; }
export interface ScanResult { clean: boolean; virusName?: string; }
export interface AuditInput { ref: string; action: string; actor: string; details?: string; }
export interface AuditEvent { id: string; ref: string; action: string; actor: string; timestamp: string; details?: string; }
export interface Notification { id: string; title: string; description: string; type: string; read: boolean; timestamp: string; link?: string; }
