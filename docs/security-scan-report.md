# Security Scan Report — npm Audit & Dependency Analysis

## Summary

| Field | Value |
|-------|-------|
| Run Date | 23 August 2026 |
| Command | `npm audit` |
| Node Version | 20.x LTS |
| npm Version | 10.x |
| Lockfile | package-lock.json (integrity verified) |
| Workspace Mode | npm workspaces (monorepo) |

## Vulnerability Summary

| Severity | Count | In Production? |
|----------|-------|----------------|
| Critical | 0 | — |
| High | 2 | No (devDependencies only) |
| Medium | 4 | No (transitive, unused sub-deps) |
| Low | 6 | Partial (informational only) |
| **Total** | **12** | **0 production-critical** |

## High Severity Findings

### 1. Prototype Pollution in build tooling transitive dependency

- **Package:** deep-extend (transitive via a Webpack loader plugin)
- **Severity:** High
- **CVSS:** 7.5
- **Exploitable in production:** No — only present in the build pipeline (`devDependencies`), never bundled into the application output
- **Fix available:** Yes, but requires major version bump of parent package

### 2. Regular Expression Denial of Service (ReDoS) in dev utility

- **Package:** semver-regex (transitive via a linting plugin)
- **Severity:** High
- **CVSS:** 7.2
- **Exploitable in production:** No — only runs during CI/CD lint step
- **Fix available:** Pending upstream patch

## Medium Severity Findings

1. **json5 < 2.2.2** — prototype pollution (transitive via tsconfig-paths, devDependency)
2. **minimatch < 3.0.5** — ReDoS (transitive via glob in test tooling)
3. **word-wrap < 1.2.4** — ReDoS (transitive via optionator in eslint)
4. **semver < 7.5.2** — ReDoS (transitive via node-gyp in native addon builds)

All four are in development/test tooling chains and are not included in the production bundle or runtime dependencies.

## Low Severity Findings

Six low-severity advisories relate to informational disclosures or theoretical attack vectors in deeply nested transitive dependencies. None affect application behaviour or data security. These are typical of large Node.js dependency trees and pose no practical risk for this POC.

## Mitigation Assessment

**Production runtime exposure: ZERO.** All high and medium vulnerabilities exist exclusively in:
- Build tools (Webpack, TypeScript compiler plugins)
- Test frameworks (Vitest, Playwright)
- Linting tools (ESLint and its plugin ecosystem)

None of these packages are bundled into the Next.js application output or the Express.js service bundles. The production `node_modules` (installed with `npm ci --omit=dev`) contains zero known vulnerabilities.

## Action Items

| Priority | Action | Timeline |
|----------|--------|----------|
| Low | Run `npm audit fix --force` on next major dependency upgrade cycle | Next quarter |
| Low | Pin transitive dependencies causing medium findings | When upstream patches are released |
| Info | Monitor advisories for promotion to production-relevant status | Ongoing |
| Recommended | Enable Dependabot auto-merge for patch-level security fixes | Immediate |

## Supply Chain Security

- **Registry:** All packages sourced from https://registry.npmjs.org
- **Lockfile integrity:** `package-lock.json` contains SHA-512 integrity hashes for all resolved packages — verified on `npm ci`
- **No private registries:** No `.npmrc` overrides pointing to third-party registries
- **No install scripts of concern:** Reviewed `preinstall`/`postinstall` scripts — only standard native compilation (e.g., better-sqlite3)
- **Provenance:** npm publish provenance is available for major dependencies (Next.js, Express, Zod)

## Recommended SCA Tools for Production

| Tool | Purpose | Status |
|------|---------|--------|
| **Dependabot** | Automated dependency PRs | Enabled (GitHub native) |
| **Snyk** | Deep vulnerability scanning + container scanning | Recommended for production |
| **Socket.dev** | Supply chain attack detection (typosquatting, install scripts) | Recommended |
| **npm audit signatures** | Verify registry signature provenance | Available in npm 9+ |

## Conclusion

The AiB IAAS POC has a clean production security posture. The 12 advisories reported by `npm audit` are confined to development tooling and do not represent exploitable attack surface in the deployed application. No immediate action is required, but the team should address these findings during the next planned dependency upgrade cycle to maintain a clean audit baseline.

---

## External HTTP Header & DNS Scan (1 October 2026)

A customer-side external scanner was run against the public demo URL
`https://macleoda-leidos.github.io/aib-iaas-poc/` and returned an initial score of
**16 / 100 (Critical)** — 5 High, 1 Medium, 1 Low, 4 Info. The findings were almost entirely
transport/host-layer (missing security headers, absent/ineffective CSP, CORS wildcard, no
SPF/DMARC/DNSSEC, a server-version banner, no `security.txt`).

### Why most of the frontend findings are host-layer

The public demo frontend is a Next.js **static export hosted on GitHub Pages**, served through
GitHub's Fastly CDN. GitHub Pages serves plain files with a **fixed** response-header set and
provides no mechanism (no `_headers` support; `next` `output: 'export'` cannot emit headers) to
add `Content-Security-Policy`, `X-Content-Type-Options`, `X-Frame-Options`, `Permissions-Policy`,
COOP/COEP/CORP or HSTS as **response headers**, to change the `Server:` banner, or to remove the
Fastly `Access-Control-Allow-Origin: *` on static assets. The domain `macleoda-leidos.github.io`
is a GitHub-owned subdomain, so its DNS records (SPF, DMARC, DNSSEC, DKIM) are not ours to set —
and are not applicable to a static demo that sends no email.

A deliberate decision was taken to **keep the demo on GitHub Pages** (no infrastructure change for
a POC) rather than move it to a header-capable host. The remediation below therefore (a) applies
the full, real header set where we *do* control the response — the API — (b) applies the
best-effort browser controls GitHub Pages *does* honour, and (c) stages the complete header set
in-repo so that pointing the demo at a header-capable host (the already-present Azure Static Web
Apps config, or Cloudflare/Netlify) realises a ~100 score with no further code change.

### Per-finding disposition

| Finding (severity) | Surface | Disposition |
|---|---|---|
| Missing CSP header (High) | API / Frontend | **API: real strict CSP** (`default-src 'none'`). Frontend: `<meta http-equiv>` CSP (browser-honoured; partial scanner credit) + full CSP staged for a header-capable host |
| CSP absent/ineffective (High) | API / Frontend | As above — the API now carries an explicit, strict policy |
| CORS wildcard `ACAO: *` (High) | Frontend host | GitHub/Fastly-set on static assets → **cannot change on Pages**. The API uses a fixed CORS allow-list, not a wildcard |
| No SPF record (High) | DNS of `github.io` | Not ours to set; **N/A** for a no-email static demo |
| No DMARC record (High) | DNS of `github.io` | Not ours to set; **N/A** for a no-email static demo |
| Missing recommended headers ×6 (Medium) | API / Frontend | **API: all set** (X-Frame-Options, Referrer-Policy, Permissions-Policy, COOP/CORP). Frontend: referrer set via `<meta>`; rest staged for a header-capable host |
| Server reveals technology (Low) | Frontend host | GitHub-set `Server:` → **cannot change on Pages**. API: `X-Powered-By` now disabled |
| No `security.txt` (Info) | Frontend | **Fixed** — `/.well-known/security.txt` published (RFC 9116) |
| DKIM / DNSSEC (Info) | DNS of `github.io` | Not ours to set; documented |
| Detected technologies (Info) | Both | Informational; not remediable without obscuring the stack |

### Remediation landed in this change

- **API response headers (the real score win).** A shared `securityHeaders()` middleware
  (`services/api-gateway/src/middleware/securityHeaders.ts`), applied by both the deployed
  `consolidated-api` and the standalone `api-gateway`, now sets a strict JSON-API CSP
  (`default-src 'none'`), HSTS (1 year, `includeSubDomains`, `preload`), `X-Content-Type-Options:
  nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, a `Permissions-Policy`, and
  COOP/CORP; `X-Powered-By` is disabled. This closes ITHC VUL-001 on the API. (CORP is
  `cross-origin` so the separate frontend origin can still read responses; the CORS allow-list
  remains the access control.)
- **Frontend best-effort (GitHub Pages).** `apps/web/src/app/layout.tsx` emits a
  `<meta http-equiv="Content-Security-Policy">` (production builds only — `next dev` needs `eval`
  for HMR) and a `<meta name="referrer">` policy. `/.well-known/security.txt` is published.
- **Staged for any header-capable host.** `apps/web/public/_headers` (Cloudflare/Netlify),
  `apps/web/public/staticwebapp.config.json` `globalHeaders` (Azure SWA), and a guarded
  `headers()` in `next.config.js` (Node runtime) all carry the full header set.

### Reachable score and the one-step path to ~100

With the demo on bare GitHub Pages the external score rises modestly (the `security.txt`,
referrer and partial-CSP findings clear; the header/CORS/`Server`/DNS findings are documented as
host-layer). **Against the API URL the header findings clear outright.** To realise the full ~100
on the frontend, point the live deploy at the header-capable configuration already in the repo
(re-enable the SWA workflow, or front the site with Cloudflare/Netlify + a custom domain, which
would additionally let us set SPF/DMARC/DNSSEC). No application code change is required for that
switch.
