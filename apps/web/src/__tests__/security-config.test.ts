import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Guards the static-host security artefacts. GitHub Pages cannot send HTTP
// headers, so these files (plus the <meta> CSP in layout.tsx) are the frontend's
// header story: a best-effort policy on Pages, and the full set staged for any
// header-capable host (Azure SWA / Cloudflare / Netlify). If someone deletes or
// guts them, the "16/100" scan regresses silently — this test fails first.

const here = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(here, '../..'); // apps/web
const read = (rel: string) => fs.readFileSync(path.join(webRoot, rel), 'utf8');

// Every host variant must carry at least these.
const REQUIRED_HEADERS = [
  'Content-Security-Policy',
  'X-Content-Type-Options',
  'X-Frame-Options',
  'Referrer-Policy',
  'Permissions-Policy',
  'Strict-Transport-Security',
  'Cross-Origin-Opener-Policy',
  'Cross-Origin-Resource-Policy',
];

describe('Azure Static Web Apps globalHeaders', () => {
  const config = JSON.parse(read('public/staticwebapp.config.json'));

  it('declares a globalHeaders block', () => {
    expect(config.globalHeaders).toBeTypeOf('object');
  });

  it.each(REQUIRED_HEADERS)('sets %s', (header) => {
    expect(config.globalHeaders[header]).toBeTruthy();
  });

  it('uses a real CSP, not a placeholder', () => {
    expect(config.globalHeaders['Content-Security-Policy']).toContain("default-src 'self'");
  });
});

describe('Cloudflare/Netlify _headers', () => {
  const headers = read('public/_headers');

  it.each(REQUIRED_HEADERS)('sets %s', (header) => {
    expect(headers).toContain(`${header}:`);
  });
});

describe('security.txt (RFC 9116)', () => {
  it.each(['public/.well-known/security.txt', 'public/security.txt'])('%s has Contact and a future Expires', (rel) => {
    const txt = read(rel);
    expect(txt).toMatch(/^Contact:/m);
    const expires = txt.match(/^Expires:\s*(.+)$/m);
    expect(expires).not.toBeNull();
    expect(new Date(expires![1]).getTime()).toBeGreaterThan(Date.now());
  });
});

describe('layout.tsx best-effort browser controls', () => {
  const layout = read('src/app/layout.tsx');

  it('defines a Content-Security-Policy and emits it via <meta http-equiv>', () => {
    expect(layout).toContain('CONTENT_SECURITY_POLICY');
    expect(layout).toContain('httpEquiv="Content-Security-Policy"');
    expect(layout).toContain("default-src 'self'");
  });

  it('sets a referrer policy via metadata', () => {
    expect(layout).toContain("referrer: 'strict-origin-when-cross-origin'");
  });
});
