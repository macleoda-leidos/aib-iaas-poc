import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// Guards the committed canonical API contract at /openapi.json (Phase 3). This is
// not a full OpenAPI schema validator — it is a structural smoke test that keeps
// the artefact well-formed and ensures the security model the code actually
// enforces (the HS256 bearer token and the application-scoped capability header)
// stays described in the contract. If a future change drops either scheme, or
// de-documents the capability on the anonymous write surface, this fails loudly.

const specPath = join(__dirname, '..', '..', '..', '..', 'openapi.json');
const spec = JSON.parse(readFileSync(specPath, 'utf8'));

describe('openapi.json — canonical API contract', () => {
  it('is a valid OpenAPI 3.x document with info and servers', () => {
    expect(spec.openapi).toMatch(/^3\./);
    expect(spec.info?.title).toBe('AiB IAAS API');
    expect(spec.info?.version).toBeTruthy();
    expect(Array.isArray(spec.servers)).toBe(true);
    expect(spec.servers.length).toBeGreaterThan(0);
  });

  it('declares both security schemes the code enforces', () => {
    const schemes = spec.components?.securitySchemes ?? {};
    expect(schemes.bearerAuth?.scheme).toBe('bearer');
    expect(schemes.applicationCapability?.in).toBe('header');
    expect(schemes.applicationCapability?.name).toBe('X-Application-Capability');
  });

  it('applies default-deny bearer auth globally', () => {
    expect(spec.security).toEqual([{ bearerAuth: [] }]);
  });

  it('documents the lifecycle endpoints and the capability-gated anonymous writes', () => {
    const paths = spec.paths ?? {};
    for (const p of ['/api/applications', '/api/applications/{id}', '/api/applications/{id}/submit']) {
      expect(paths[p], `missing path ${p}`).toBeTruthy();
    }
    // The anonymous write surface must offer the capability scheme as an auth option.
    const put = paths['/api/applications/{id}']?.put;
    const submit = paths['/api/applications/{id}/submit']?.post;
    const offersCapability = (op: any) =>
      Array.isArray(op?.security) && op.security.some((s: any) => 'applicationCapability' in s);
    expect(offersCapability(put), 'PUT /applications/{id} must offer the capability scheme').toBe(true);
    expect(offersCapability(submit), 'POST /applications/{id}/submit must offer the capability scheme').toBe(true);
  });

  it('marks the public allow-list endpoints as security-free', () => {
    const paths = spec.paths ?? {};
    // Public metadata + the create/login entry points carry an explicit empty security array.
    expect(paths['/api/health']?.get?.security).toEqual([]);
    expect(paths['/api/auth/login']?.post?.security).toEqual([]);
    expect(paths['/api/applications']?.post?.security).toEqual([]);
  });

  it('every path item has at least one operation', () => {
    const methods = ['get', 'post', 'put', 'patch', 'delete'];
    for (const [p, item] of Object.entries<any>(spec.paths)) {
      const hasOp = methods.some((m) => item[m]);
      expect(hasOp, `path ${p} has no operation`).toBe(true);
    }
  });
});
