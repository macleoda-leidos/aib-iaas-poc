import { SeedApplication, seedApplications } from './seedData';

export interface AuditEvent {
  id: string;
  ref: string;
  action: string;
  actor: string;
  timestamp: string;
  details?: string;
}

export interface IApplicationRepository {
  getAll(): SeedApplication[];
  getById(ref: string): SeedApplication | null;
  create(app: Partial<SeedApplication>): SeedApplication;
  update(ref: string, data: Partial<SeedApplication>): SeedApplication | null;
  updateStatus(ref: string, status: string): void;
  search(query: string): SeedApplication[];
  getByStatus(status: string): SeedApplication[];
}

export interface IAuditRepository {
  log(event: Omit<AuditEvent, 'id' | 'timestamp'>): AuditEvent;
  getByRef(ref: string): AuditEvent[];
  getAll(): AuditEvent[];
}

const APP_KEY = 'iaas-applications';
const AUDIT_KEY = 'iaas-audit-events';

function getStoredApps(): SeedApplication[] {
  if (typeof window === 'undefined') return seedApplications;
  const stored = localStorage.getItem(APP_KEY);
  if (!stored) {
    localStorage.setItem(APP_KEY, JSON.stringify(seedApplications));
    return seedApplications;
  }
  return JSON.parse(stored);
}

function saveApps(apps: SeedApplication[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(APP_KEY, JSON.stringify(apps));
  }
}

export const applicationRepo: IApplicationRepository = {
  getAll: () => getStoredApps(),
  getById: (ref) => getStoredApps().find(a => a.ref === ref) || null,
  create: (app) => {
    const apps = getStoredApps();
    const newApp: SeedApplication = {
      ref: app.ref || `IAAS-2026-${String(apps.length + 1).padStart(5, '0')}`,
      firstName: app.firstName || 'New',
      lastName: app.lastName || 'Applicant',
      status: app.status || 'draft',
      debt: app.debt || 0,
      product: app.product || 'Pending',
      date: app.date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      ni: app.ni || '',
      source: app.source || 'IAAS',
      postcode: app.postcode || '',
      email: app.email || '',
      employment: app.employment || '',
      confidence: app.confidence || 0,
      assignedTo: app.assignedTo || 'Unassigned',
      city: app.city || '',
    };
    apps.unshift(newApp);
    saveApps(apps);
    return newApp;
  },
  update: (ref, data) => {
    const apps = getStoredApps();
    const idx = apps.findIndex(a => a.ref === ref);
    if (idx === -1) return null;
    apps[idx] = { ...apps[idx], ...data };
    saveApps(apps);
    return apps[idx];
  },
  updateStatus: (ref, status) => {
    const apps = getStoredApps();
    const idx = apps.findIndex(a => a.ref === ref);
    if (idx >= 0) { apps[idx].status = status; saveApps(apps); }
  },
  search: (query) => {
    const q = query.toLowerCase();
    return getStoredApps().filter(a =>
      a.firstName.toLowerCase().includes(q) ||
      a.lastName.toLowerCase().includes(q) ||
      a.ref.toLowerCase().includes(q) ||
      a.ni.toLowerCase().includes(q) ||
      a.postcode.toLowerCase().includes(q) ||
      a.city.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q)
    );
  },
  getByStatus: (status) => getStoredApps().filter(a => a.status === status),
};

export const auditRepo: IAuditRepository = {
  log: (event) => {
    const entry: AuditEvent = {
      ...event,
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
      timestamp: new Date().toISOString(),
    };
    if (typeof window !== 'undefined') {
      const events: AuditEvent[] = JSON.parse(localStorage.getItem(AUDIT_KEY) || '[]');
      events.unshift(entry);
      localStorage.setItem(AUDIT_KEY, JSON.stringify(events.slice(0, 500)));
    }
    return entry;
  },
  getByRef: (ref) => {
    if (typeof window === 'undefined') return [];
    const events: AuditEvent[] = JSON.parse(localStorage.getItem(AUDIT_KEY) || '[]');
    return events.filter(e => e.ref === ref);
  },
  getAll: () => {
    if (typeof window === 'undefined') return [];
    return JSON.parse(localStorage.getItem(AUDIT_KEY) || '[]');
  },
};
