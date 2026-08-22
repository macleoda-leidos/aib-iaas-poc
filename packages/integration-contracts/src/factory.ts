import {
  IBasysClient,
  IEdenClient,
  IDasClient,
  ICftClient,
  IMoratoriumClient,
  IRoiClient,
  ICreditClient,
} from './interfaces';
import { BasysMockClient } from './mock/basys';
import { EdenMockClient } from './mock/eden';
import { DasMockClient } from './mock/das';
import { CftMockClient } from './mock/cft';
import { MoratoriumMockClient } from './mock/moratorium';
import { RoiMockClient } from './mock/roi';
import { CreditMockClient } from './mock/credit';

export interface IntegrationConfig {
  mode: 'mock' | 'live';
  baseUrl?: string;
  timeout?: number;
  failureRate?: number;
}

/**
 * Reads integration configuration from environment variables.
 * Defaults to mock mode with localhost base URL.
 */
function getConfig(): IntegrationConfig {
  return {
    mode: (process.env.INTEGRATION_MODE as 'mock' | 'live') || 'mock',
    baseUrl: process.env.INTEGRATION_BASE_URL || 'http://localhost:3005',
    timeout: parseInt(process.env.INTEGRATION_TIMEOUT || '5000', 10),
    failureRate: parseFloat(process.env.MOCK_FAILURE_RATE || '0'),
  };
}

export function createBasysClient(configOverride?: Partial<IntegrationConfig>): IBasysClient {
  const config = { ...getConfig(), ...configOverride };
  if (config.mode === 'live') {
    // Future: return new BasysApiClient(config);
    throw new Error('Live BASYS integration not yet implemented');
  }
  return new BasysMockClient({ failureRate: config.failureRate });
}

export function createEdenClient(configOverride?: Partial<IntegrationConfig>): IEdenClient {
  const config = { ...getConfig(), ...configOverride };
  if (config.mode === 'live') {
    // Future: return new EdenApiClient(config);
    throw new Error('Live eDEN integration not yet implemented');
  }
  return new EdenMockClient({ failureRate: config.failureRate });
}

export function createDasClient(configOverride?: Partial<IntegrationConfig>): IDasClient {
  const config = { ...getConfig(), ...configOverride };
  if (config.mode === 'live') {
    // Future: return new DasApiClient(config);
    throw new Error('Live DAS integration not yet implemented');
  }
  return new DasMockClient({ failureRate: config.failureRate });
}

export function createCftClient(configOverride?: Partial<IntegrationConfig>): ICftClient {
  const config = { ...getConfig(), ...configOverride };
  if (config.mode === 'live') {
    // Future: return new CftApiClient(config);
    throw new Error('Live CFT integration not yet implemented');
  }
  return new CftMockClient({ failureRate: config.failureRate });
}

export function createMoratoriumClient(configOverride?: Partial<IntegrationConfig>): IMoratoriumClient {
  const config = { ...getConfig(), ...configOverride };
  if (config.mode === 'live') {
    // Future: return new MoratoriumApiClient(config);
    throw new Error('Live Moratorium integration not yet implemented');
  }
  return new MoratoriumMockClient({ failureRate: config.failureRate });
}

export function createRoiClient(configOverride?: Partial<IntegrationConfig>): IRoiClient {
  const config = { ...getConfig(), ...configOverride };
  if (config.mode === 'live') {
    // Future: return new RoiApiClient(config);
    throw new Error('Live RoI integration not yet implemented');
  }
  return new RoiMockClient({ failureRate: config.failureRate });
}

export function createCreditClient(configOverride?: Partial<IntegrationConfig>): ICreditClient {
  const config = { ...getConfig(), ...configOverride };
  if (config.mode === 'live') {
    // Future: return new CreditApiClient(config);
    throw new Error('Live Credit Check integration not yet implemented');
  }
  return new CreditMockClient({ failureRate: config.failureRate });
}

/**
 * Creates all integration clients using the current environment configuration.
 * Useful for services that need access to all systems (e.g., integration-orchestrator).
 */
export function createAllClients(configOverride?: Partial<IntegrationConfig>) {
  return {
    basys: createBasysClient(configOverride),
    eden: createEdenClient(configOverride),
    das: createDasClient(configOverride),
    cft: createCftClient(configOverride),
    moratorium: createMoratoriumClient(configOverride),
    roi: createRoiClient(configOverride),
    credit: createCreditClient(configOverride),
  };
}
