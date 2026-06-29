export interface IntegrationRequest {
  requestId: string;
  system: IntegrationSystem;
  lookupType: string;
  parameters: Record<string, string>;
  timestamp: string;
}

export interface IntegrationResponse {
  requestId: string;
  system: IntegrationSystem;
  status: 'success' | 'not_found' | 'error' | 'timeout';
  data?: Record<string, unknown>;
  errorMessage?: string;
  responseTime: number;
  timestamp: string;
}

export type IntegrationSystem = 'BASYS' | 'eDEN' | 'DASH' | 'DAS' | 'CFT' | 'Moratorium' | 'RoI';

export interface IntegrationHealthStatus {
  system: IntegrationSystem;
  status: 'healthy' | 'degraded' | 'unavailable';
  lastChecked: string;
  averageResponseTime: number;
}
