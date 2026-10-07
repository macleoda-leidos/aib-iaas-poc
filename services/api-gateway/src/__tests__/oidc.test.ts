import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { verifyToken, type AccessTokenClaims } from '@aib-iaas/auth';
import { app } from '../index';
import http from 'http';

/**
 * End-to-end GOV.UK One Login (OIDC) authorization-code + PKCE flow against the
 * in-gateway mock IdP. We drive the three browser hops with raw http, following
 * each `Location` manually (never auto-following), and assert the callback hands
 * back a valid APP session (HS256) for the mapped user — i.e. the OIDC login is
 * indistinguishable from a password login once complete. Negatives cover the
 * state, PKCE/code-signature and open-redirect guards, plus the JWKS endpoint.
 */

let server: http.Server;
let baseUrl: string;

function get(path: string): Promise<{ status: number; headers: http.IncomingHttpHeaders; body: string }> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const req = http.request(
      { hostname: url.hostname, port: url.port, path: url.pathname + url.search, method: 'GET' },
      res => {
        let d = '';
        res.on('data', c => (d += c));
        res.on('end', () => resolve({ status: res.statusCode || 0, headers: res.headers, body: d }));
      }
    );
    req.on('error', reject);
    req.end();
  });
}

const REDIRECT = 'http://localhost:3000/auth/callback';

/** Run /start → /idp/authorize and return the captured { state, code }. */
async function runToCode(): Promise<{ state: string; code: string }> {
  const start = await get(`/api/auth/oidc/start?redirect=${encodeURIComponent(REDIRECT)}`);
  expect(start.status).toBe(302);
  const authorizeUrl = new URL(start.headers.location as string, baseUrl);
  const authorize = await get(authorizeUrl.pathname + authorizeUrl.search);
  expect(authorize.status).toBe(302);
  const cbUrl = new URL(authorize.headers.location as string, baseUrl);
  return { state: cbUrl.searchParams.get('state')!, code: cbUrl.searchParams.get('code')! };
}

describe('API Gateway - OIDC federation (mock GOV.UK One Login)', () => {
  beforeAll(async () => {
    await new Promise<void>(r => {
      server = app.listen(0, () => {
        baseUrl = `http://localhost:${(server.address() as any).port}`;
        r();
      });
    });
  });
  afterAll(() => { server?.close(); });

  it('completes the full authorization-code flow and mints a valid app session', async () => {
    // 1. /start → 302 to the mock IdP authorize with PKCE S256 + state + nonce.
    const start = await get(`/api/auth/oidc/start?redirect=${encodeURIComponent(REDIRECT)}`);
    expect(start.status).toBe(302);
    const authorizeUrl = new URL(start.headers.location as string, baseUrl);
    expect(authorizeUrl.pathname).toBe('/api/auth/oidc/idp/authorize');
    expect(authorizeUrl.searchParams.get('code_challenge')).toBeTruthy();
    expect(authorizeUrl.searchParams.get('code_challenge_method')).toBe('S256');
    const state = authorizeUrl.searchParams.get('state')!;
    expect(state).toBeTruthy();

    // 2. /idp/authorize → 302 back to the client callback with code + state.
    const authorize = await get(authorizeUrl.pathname + authorizeUrl.search);
    expect(authorize.status).toBe(302);
    const cbUrl = new URL(authorize.headers.location as string, baseUrl);
    expect(cbUrl.pathname).toBe('/api/auth/oidc/callback');
    expect(cbUrl.searchParams.get('code')).toBeTruthy();
    expect(cbUrl.searchParams.get('state')).toBe(state);

    // 3. /callback → 302 to the frontend redirect with the session in the fragment.
    const callback = await get(cbUrl.pathname + cbUrl.search);
    expect(callback.status).toBe(302);
    const finalLoc = callback.headers.location as string;
    expect(finalLoc.startsWith(`${REDIRECT}#`)).toBe(true);

    const frag = new URLSearchParams(finalLoc.slice(finalLoc.indexOf('#') + 1));
    const token = decodeURIComponent(frag.get('token')!);
    expect(token).toBeTruthy();

    // The token is a valid APP session (HS256) for the mapped seeded user
    // (the Case Officer, demo@example.com → role-officer / aib_officer).
    const claims = verifyToken<AccessTokenClaims>(token);
    expect(claims.email).toBe('demo@example.com');
    expect(claims.role).toBe('aib_officer');
    expect(claims.permissions.length).toBeGreaterThan(0);
    expect(claims.jti).toBeTruthy();

    const user = JSON.parse(decodeURIComponent(frag.get('user')!));
    expect(user.email).toBe('demo@example.com');
    expect(user.role).toBe('aib_officer');
  });

  it('rejects a redirect outside the allow-list (open-redirect guard) → 400', async () => {
    const res = await get(`/api/auth/oidc/start?redirect=${encodeURIComponent('https://evil.example.com/callback')}`);
    expect(res.status).toBe(400);
    expect(JSON.parse(res.body).error.code).toBe('INVALID_REDIRECT');
  });

  it('rejects a tampered state at the callback → 400', async () => {
    const { code } = await runToCode();
    const res = await get(`/api/auth/oidc/callback?code=${encodeURIComponent(code)}&state=not-a-valid-state`);
    expect(res.status).toBe(400);
    expect(JSON.parse(res.body).error.code).toBe('INVALID_STATE');
  });

  it('rejects a forged authorization code (bad signature) → 401', async () => {
    const { state, code } = await runToCode();
    // Flip the FIRST char of the signature segment so RS256 verification fails.
    // (The last base64url char of a signature carries only 2 significant bits,
    // so flipping it can decode to the same bytes and leave the signature valid.)
    const dot = code.lastIndexOf('.');
    const sig = code.slice(dot + 1);
    const forged = `${code.slice(0, dot + 1)}${sig[0] === 'A' ? 'B' : 'A'}${sig.slice(1)}`;
    const res = await get(`/api/auth/oidc/callback?code=${encodeURIComponent(forged)}&state=${encodeURIComponent(state)}`);
    expect(res.status).toBe(401);
    expect(JSON.parse(res.body).error.code).toBe('OIDC_EXCHANGE_FAILED');
  });

  it('serves a JWKS document with an RSA signing key → 200', async () => {
    const res = await get('/api/auth/oidc/idp/jwks.json');
    expect(res.status).toBe(200);
    const jwks = JSON.parse(res.body);
    expect(jwks.keys).toHaveLength(1);
    expect(jwks.keys[0].kty).toBe('RSA');
    expect(jwks.keys[0].use).toBe('sig');
    expect(jwks.keys[0].alg).toBe('RS256');
    expect(jwks.keys[0].n).toBeTruthy();
  });

  it('publishes an OIDC discovery document', async () => {
    const res = await get('/api/auth/oidc/idp/.well-known/openid-configuration');
    expect(res.status).toBe(200);
    const doc = JSON.parse(res.body);
    expect(doc.id_token_signing_alg_values_supported).toContain('RS256');
    expect(doc.code_challenge_methods_supported).toContain('S256');
    expect(doc.jwks_uri).toContain('/api/auth/oidc/idp/jwks.json');
  });
});
