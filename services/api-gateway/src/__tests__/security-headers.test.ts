import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { app } from '../index';
import http from 'http';

// Verifies the shared securityHeaders() middleware (also mounted by the deployed
// consolidated-api) emits the scanner-grade header set on real responses. These
// are the controls an external HTTP header scanner grades against the API origin.

let server: http.Server;
let baseUrl: string;

function head(path: string): Promise<{ status: number; headers: http.IncomingHttpHeaders }> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const req = http.request(
      { hostname: url.hostname, port: url.port, path: url.pathname, method: 'GET' },
      (res) => {
        res.on('data', () => { /* drain */ });
        res.on('end', () => resolve({ status: res.statusCode || 0, headers: res.headers }));
      }
    );
    req.on('error', reject);
    req.end();
  });
}

describe('API security headers', () => {
  beforeAll(async () => {
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr = server.address() as { port: number };
        baseUrl = `http://localhost:${addr.port}`;
        resolve();
      });
    });
  });

  afterAll(() => {
    server?.close();
  });

  it('sets a strict JSON-API Content-Security-Policy', async () => {
    const { headers } = await head('/api/health');
    const csp = headers['content-security-policy'];
    expect(csp).toBeDefined();
    expect(csp).toContain("default-src 'none'");
    expect(csp).toContain("frame-ancestors 'none'");
  });

  it('sets HSTS with a one-year max-age and includeSubDomains', async () => {
    const { headers } = await head('/api/health');
    const hsts = headers['strict-transport-security'];
    expect(hsts).toContain('max-age=31536000');
    expect(hsts).toContain('includeSubDomains');
  });

  it('sets the recommended hardening headers', async () => {
    const { headers } = await head('/api/health');
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['referrer-policy']).toBe('no-referrer');
    expect(headers['permissions-policy']).toContain('geolocation=()');
    expect(headers['cross-origin-opener-policy']).toBe('same-origin');
    // cross-origin (not same-origin) so the separate frontend origin can read
    // API responses; CORS remains the access control.
    expect(headers['cross-origin-resource-policy']).toBe('cross-origin');
  });

  it('does not leak the framework via X-Powered-By', async () => {
    const { headers } = await head('/api/health');
    expect(headers['x-powered-by']).toBeUndefined();
  });
});
