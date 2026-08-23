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
