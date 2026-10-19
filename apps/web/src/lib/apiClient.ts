/**
 * API Client for AiB IAAS
 * Handles all communication with the backend API gateway.
 * Works in both standalone (local demo) and hosted (Render/Railway) modes.
 * Falls back gracefully to demo data when backend is unavailable.
 */

import { captureError } from './errorTracking';

const API_URL = (typeof window !== 'undefined' && localStorage.getItem('iaas-backend-url'))
  || process.env.NEXT_PUBLIC_API_URL
  || 'https://iaas-api.onrender.com';

// Auth token stored in memory (set on login, used for audit trail)
let authToken: string | null = null;

// Session expiry event listeners
type SessionExpiredCallback = () => void;
const sessionExpiredListeners: SessionExpiredCallback[] = [];

export function onSessionExpired(callback: SessionExpiredCallback) {
  sessionExpiredListeners.push(callback);
  return () => {
    const idx = sessionExpiredListeners.indexOf(callback);
    if (idx >= 0) sessionExpiredListeners.splice(idx, 1);
  };
}

function notifySessionExpired() {
  sessionExpiredListeners.forEach((cb) => cb());
}

export function setAuthToken(token: string | null) {
  authToken = token;
  if (token && typeof window !== 'undefined') {
    localStorage.setItem('iaas-auth-token', token);
  }
}

export function getAuthToken(): string | null {
  if (authToken) return authToken;
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('iaas-auth-token');
    if (stored) {
      authToken = stored;
      return stored;
    }
  }
  return null;
}

// Every client-side key scoped to the signed-in user. Centralised so a logout, a
// 401, and a sign-in-as-a-different-user all clear exactly the same set — leaving
// no stale identity behind when switching accounts.
const SESSION_KEYS = ['iaas-auth-token', 'iaas-current-user', 'iaas-session-start', 'iaas-remember-device'];

/** Clear all client-side session state (in-memory + storage), without redirecting. */
export function clearClientSession() {
  authToken = null;
  if (typeof window !== 'undefined') {
    SESSION_KEYS.forEach((k) => localStorage.removeItem(k));
    sessionStorage.removeItem('iaas-current-user');
  }
}

/** Clear auth state and redirect to login */
export function logout() {
  clearClientSession();
  if (typeof window !== 'undefined') {
    window.location.href = (process.env.NEXT_PUBLIC_BASE_PATH || '') + '/login';
  }
}

// Standard API response envelope from the backend
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: { code: string; message: string };
  meta?: { page: number; pageSize: number; totalCount: number; totalPages: number };
}

export class ApiError extends Error {
  code: string;
  status: number;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

// ─── Application capability tokens (H2 / GAP-005) ────────────────────────────
// The anonymous /apply journey has no login, so the backend issues a signed,
// application-scoped capability token at create time and now requires it on the
// read-back (GET /:id) AND the writes (PUT /:id, POST /:id/submit). We keep each
// token keyed by application id so a resume/refresh still carries it, and send it
// as the X-Application-Capability header on exactly those three calls.
const CAPABILITY_STORAGE_KEY = 'iaas-app-capabilities';

function readCapabilityMap(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(sessionStorage.getItem(CAPABILITY_STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

export function storeCapabilityToken(applicationId: string, token: string) {
  if (typeof window === 'undefined' || !applicationId || !token) return;
  try {
    const map = readCapabilityMap();
    map[applicationId] = token;
    sessionStorage.setItem(CAPABILITY_STORAGE_KEY, JSON.stringify(map));
  } catch { /* ignore storage errors — the call still works within this tab's module state */ }
}

export function getCapabilityToken(applicationId: string): string | null {
  return readCapabilityMap()[applicationId] || null;
}

function getHeaders(capabilityForApplicationId?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  // Attach the application-scoped capability when this call targets a specific
  // application the anonymous caller created. Harmless when a staff token is also
  // present — the backend accepts either proof of access.
  if (capabilityForApplicationId) {
    const cap = getCapabilityToken(capabilityForApplicationId);
    if (cap) headers['X-Application-Capability'] = cap;
  }
  return headers;
}

/**
 * Last rate-limit position reported by the server, from the RateLimit-* headers
 * (the API sets `standardHeaders: true`).
 *
 * Read rather than guessed, because the client cannot know the budget: the limit
 * lives in server config, /api/health is exempt from counting, and the window is
 * keyed per IP. A browser-side tally of its own calls disagrees with the server
 * on all three counts.
 */
export interface RateLimitState {
  limit: number;
  remaining: number;
  resetAtMs: number;
}

let rateLimitState: RateLimitState | null = null;
type RateLimitCallback = (state: RateLimitState) => void;
const rateLimitListeners: RateLimitCallback[] = [];

export function getRateLimitState(): RateLimitState | null {
  return rateLimitState;
}

export function onRateLimitChange(callback: RateLimitCallback) {
  rateLimitListeners.push(callback);
  return () => {
    const idx = rateLimitListeners.indexOf(callback);
    if (idx >= 0) rateLimitListeners.splice(idx, 1);
  };
}

/**
 * Parse a header that must be present and numeric, or return null.
 *
 * The null check has to happen BEFORE Number(): `Number(null)` is 0, and
 * `Number.isFinite(0)` is true, so coercing first makes an absent header
 * indistinguishable from a genuine zero. That is precisely how a healthy API
 * ended up reported as rate-limited — the browser withholds any response header
 * not named in Access-Control-Expose-Headers, so these read as null in the
 * browser even when the server sends them.
 */
function numericHeader(res: Response, name: string): number | null {
  const raw = res.headers.get(name);
  if (raw === null || raw.trim() === '') return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function readRateLimitHeaders(res: Response) {
  const limit = numericHeader(res, 'RateLimit-Limit');
  const remaining = numericHeader(res, 'RateLimit-Remaining');
  // Seconds until the window resets, per the draft standard.
  const reset = numericHeader(res, 'RateLimit-Reset');

  // Absent means the response did not come from the rate-limited API, or the
  // headers are not exposed to script. Keeping the previous reading beats
  // overwriting it with a fabricated one.
  //
  // limit <= 0 is rejected as well: a zero budget is not a state this API can
  // legitimately report, and treating it as real renders the UI permanently
  // "limited" while the server is happily serving requests.
  if (limit === null || remaining === null || limit <= 0) return;

  rateLimitState = {
    limit,
    remaining,
    resetAtMs: Date.now() + (reset !== null ? reset * 1000 : 15 * 60 * 1000),
  };
  rateLimitListeners.forEach((cb) => cb(rateLimitState!));
}

async function handleResponse<T>(res: Response): Promise<ApiResponse<T>> {
  // Before the ok check: a 429 carries the most important reading of all.
  readRateLimitHeaders(res);

  if (!res.ok) {
    // Handle 401 — session expired
    if (res.status === 401) {
      clearClientSession();
      notifySessionExpired();
    }

    const body = await res.json().catch(() => ({ error: { code: 'UNKNOWN', message: res.statusText } }));
    const apiError = new ApiError(
      res.status,
      body.error?.code || 'UNKNOWN',
      body.error?.message || `API error: ${res.status}`
    );
    captureError(apiError, { status: res.status, url: res.url });
    throw apiError;
  }
  return res.json();
}

// Track API calls for rate limiting (if in browser)
function trackCall() {
  if (typeof window === 'undefined') return;
  const STORAGE_KEY = 'iaas-api-call-log';
  const now = Date.now();
  try {
    const log: number[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    log.push(now);
    // Keep only last 15 minutes
    const filtered = log.filter((t) => now - t < 15 * 60 * 1000);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch { /* ignore storage errors */ }
}

export async function apiGet<T>(path: string, capabilityForApplicationId?: string): Promise<ApiResponse<T>> {
  trackCall();
  const res = await fetch(`${API_URL}${path}`, { headers: getHeaders(capabilityForApplicationId) });
  return handleResponse<T>(res);
}

export async function apiPost<T>(path: string, body?: any, capabilityForApplicationId?: string): Promise<ApiResponse<T>> {
  trackCall();
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: getHeaders(capabilityForApplicationId),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return handleResponse<T>(res);
}

export async function apiPut<T>(path: string, body: any, capabilityForApplicationId?: string): Promise<ApiResponse<T>> {
  trackCall();
  const res = await fetch(`${API_URL}${path}`, {
    method: 'PUT',
    headers: getHeaders(capabilityForApplicationId),
    body: JSON.stringify(body),
  });
  return handleResponse<T>(res);
}

export async function apiPatch<T>(path: string, body: any): Promise<ApiResponse<T>> {
  trackCall();
  const res = await fetch(`${API_URL}${path}`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify(body),
  });
  return handleResponse<T>(res);
}

export async function apiDelete<T>(path: string): Promise<ApiResponse<T>> {
  trackCall();
  const res = await fetch(`${API_URL}${path}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  return handleResponse<T>(res);
}

// ─── Application-Specific API Functions ──────────────────────────────────────

/** Live statutory SLA posture for a queue row, computed server-side by the SLA
 *  worker's engine. Null when the case has no modelled statutory clock (no
 *  recommendation/product, no submission date, or an unmodelled product). */
export interface SlaPosture {
  status: 'on_track' | 'at_risk' | 'overdue';
  nextDeadline?: {
    kind: string;
    label: string;
    due: string;
    daysRemaining: number;
    citation: string;
  };
}

export interface ApplicationSummary {
  id: string;
  referenceNumber: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  submittedAt: string | null;
  summary: {
    applicantName: string;
    totalDebt: number | null;
  };
  sla?: SlaPosture | null;
}

export interface ApplicationDetail {
  id: string;
  referenceNumber: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  submittedAt: string | null;
  debtorDetails?: any;
  addressHistory?: any;
  debtSummary?: any;
  incomeExpenditure?: any;
  assets?: any;
  systemChecks?: any;
  creditCheck?: any;
  recommendation?: any;
  staffNotes?: any[];
}

export interface CreateApplicationResponse {
  id: string;
  referenceNumber: string;
  status: string;
  createdAt: string;
  // Signed, application-scoped read/write capability for the anonymous caller
  // (H2 / GAP-005). Stored by create() and sent on get/update/submit.
  capabilityToken?: string;
}

export const applications = {
  create: async (data?: any) => {
    const res = await apiPost<CreateApplicationResponse>('/api/applications', data || {});
    // Persist the capability so refresh/resume still carries write access.
    if (res.data?.id && res.data?.capabilityToken) {
      storeCapabilityToken(res.data.id, res.data.capabilityToken);
    }
    return res;
  },

  get: (id: string) =>
    apiGet<ApplicationDetail>(`/api/applications/${id}`, id),

  update: (id: string, data: any) =>
    apiPut<{ id: string; status: string; updatedAt: string }>(`/api/applications/${id}`, data, id),

  submit: (id: string) =>
    apiPost<{ id: string; status: string; submittedAt: string; referenceNumber: string }>(`/api/applications/${id}/submit`, undefined, id),

  list: (params?: { page?: number; pageSize?: number; status?: string; referenceNumber?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.pageSize) query.set('pageSize', String(params.pageSize));
    if (params?.status) query.set('status', params.status);
    if (params?.referenceNumber) query.set('referenceNumber', params.referenceNumber);
    const qs = query.toString();
    return apiGet<ApplicationSummary[]>(`/api/applications${qs ? `?${qs}` : ''}`);
  },

  updateStatus: (id: string, status: string, notes?: string) =>
    apiPatch<{ id: string; status: string; updatedAt: string }>(`/api/applications/${id}/status`, { status, notes }),

  assign: (id: string, assignedTo: string | null) =>
    apiPatch<{ id: string; assignedTo: string | null; assigneeName: string | null }>(`/api/applications/${id}/assign`, { assignedTo }),

  addNote: (id: string, content: string, noteType?: string, authorName?: string) =>
    apiPost<any>(`/api/applications/${id}/notes`, { content, noteType, authorName }),

  listNotes: (id: string) =>
    apiGet<Array<{ id: string; authorId: string | null; authorName: string | null; noteType: string; content: string; createdAt: string }>>(`/api/applications/${id}/notes`),

  // CFT (Common Financial Tool) contribution assessment. Runs the reg.15 CFS
  // method server-side against the case's income/expenditure. triggerFiguresSource
  // flags that the trigger figures are a POC stand-in, not the licensed set.
  cftAssessment: (id: string) =>
    apiGet<CftAssessmentResult>(`/api/applications/${id}/cft-assessment`),
};

export interface CftAssessmentResult {
  assessment: {
    totalIncome: number;
    declaredExpenditure: number;
    allowedExpenditure: number;
    contribution: number;
    triggerExcesses: Array<{ category: string; declared: number; trigger: number; excess: number }>;
    evidenceRequired: boolean;
    contingencyAllowance: number;
    citations: string[];
  };
  triggerFiguresSource: string;
}

// ─── Users (staff directory — used e.g. to populate the case assignment list) ─

export interface DirectoryUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string | null;
  roleId: string;
  status: string;
}

export const users = {
  list: (params?: { role?: string; organisationId?: string; status?: string }) => {
    const query = new URLSearchParams();
    if (params?.role) query.set('role', params.role);
    if (params?.organisationId) query.set('organisationId', params.organisationId);
    if (params?.status) query.set('status', params.status);
    const qs = query.toString();
    return apiGet<DirectoryUser[]>(`/api/users${qs ? `?${qs}` : ''}`);
  },
};

// ─── Creditor claims ─────────────────────────────────────────────────────────

export interface Claim {
  id: string;
  applicationId: string;
  creditorOrgId: string | null;
  amount: number;
  basis: string | null;
  status: string;
  createdAt: string;
}

export const claims = {
  submit: (applicationRef: string, amount: number, basis?: string) =>
    apiPost<Claim>(`/api/applications/${applicationRef}/claims`, { amount, basis }),

  listForApplication: (applicationRef: string) =>
    apiGet<Claim[]>(`/api/applications/${applicationRef}/claims`),

  listMine: () => apiGet<Claim[]>(`/api/claims/mine`),

  decide: (claimId: string, status: 'accepted' | 'rejected') =>
    apiPatch<Claim>(`/api/claims/${claimId}`, { status }),
};

// ─── Applicant correspondence (two-way messaging) ────────────────────────────

export interface Message {
  id: string;
  applicationId: string;
  senderUserId: string | null;
  senderName: string | null;
  direction: string;
  body: string;
  read: boolean;
  createdAt: string;
}

export const messages = {
  listForApplication: (applicationRef: string) =>
    apiGet<Message[]>(`/api/applications/${applicationRef}/messages`),

  send: (applicationRef: string, body: string) =>
    apiPost<Message>(`/api/applications/${applicationRef}/messages`, { body }),
};

// ─── Integration / System Checks ────────────────────────────────────────────

export interface SystemCheckResult {
  system: string;
  status: 'clear' | 'found' | 'error';
  responseTime: number;
  data?: any;
  error?: string;
}

export const integrations = {
  checkAll: (applicantData: any) =>
    apiPost<{ requestId: string; results: SystemCheckResult[]; summary: any }>('/api/integrations/check-all', applicantData),

  checkSystem: (system: string, applicantData: any) =>
    apiPost<SystemCheckResult>(`/api/integrations/check/${system}`, applicantData),

  health: () =>
    apiGet<any>('/api/integrations/health'),
};

// ─── Recommendation Engine ───────────────────────────────────────────────────

export interface Recommendation {
  product: string;
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
  factors: Array<{ factor: string; weight: number; value: string }>;
  alternatives?: Array<{ product: string; reason: string }>;
}

export const recommendations = {
  get: (financialData: any) =>
    apiPost<Recommendation>('/api/recommend', financialData),
};

// ─── Credit Check ────────────────────────────────────────────────────────────

export interface CreditCheckResult {
  score: number;
  band: string;
  defaults: number;
  ccjs: number;
  utilisation: number;
  provider: string;
  checkedAt: string;
}

export const creditCheck = {
  run: (applicantData: any) =>
    apiPost<CreditCheckResult>('/api/credit-check/run', {
      ...applicantData,
      consent: true,
      provider: 'synthetic',
    }),
};

// ─── Notifications ───────────────────────────────────────────────────────────

export interface Notification {
  id: string;
  type: string;
  channel: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export const notifications = {
  getForUser: (userId: string) =>
    apiGet<{ notifications: Notification[]; unreadCount: number }>(`/api/notifications/user/${userId}`),

  markRead: (id: string) =>
    apiPatch<any>(`/api/notifications/${id}/read`, {}),

  markAllRead: (userId: string) =>
    apiPatch<any>(`/api/notifications/user/${userId}/read-all`, {}),
};

// ─── Audit ───────────────────────────────────────────────────────────────────

export interface AuditEvent {
  id: string;
  applicationId: string;
  action: string;
  actor: string;
  actorType: string;
  details?: any;
  createdAt: string;
}

export const audit = {
  getForApplication: (applicationId: string) =>
    apiGet<AuditEvent[]>(`/api/audit/events/${applicationId}`),
};
