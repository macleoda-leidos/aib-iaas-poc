# .NET API — Authentication Parity Plan

Status: **partial.** The .NET service (`services/dotnet-api`, deployed as
`iaas-dotnet-api`) is an alternative implementation of the same API surface as the
Node consolidated-api. Phase 1 hardened the Node service; this document tracks
bringing the .NET service to the same security posture, and records what is
blocked in the current build environment.

The frontend talks to the **Node** API, so the .NET service is a parity /
demonstration artefact, not on the live demo's critical path. That lowers the
risk of the gaps below but does not excuse them before any real data.

## Done (this change)

- **Signing secret externalised.** `Features/Auth/Commands.cs` no longer signs
  with the committed literal `"iaas-poc-secret-key-minimum-32-chars!"`. It now
  reads `JWT_SECRET` from the environment via `Features/Auth/JwtConfig.cs`, with
  the same dev-fallback secret as `@aib-iaas/auth` and the same production-throw
  behaviour (refuses to start signing without `JWT_SECRET` under
  `ASPNETCORE_ENVIRONMENT=Production`). `render.yaml` already injects
  `JWT_SECRET` (`sync:false`) on `iaas-dotnet-api`.
- **Token shape aligned.** Issuer `aib-iaas`, audience `aib-iaas-api`, and claims
  `userId / email / role / roleLevel` now match the Node token, so a token minted
  by either service verifies against the other under the shared secret.
- Verified with `dotnet build` (0 warnings, 0 errors).

## Not yet at parity (blocked in this environment)

| Gap | Node equivalent | Why it is blocked here |
|---|---|---|
| **Password is not verified** (`LoginHandler` still accepts any password) | C3 / GAP-003 | Needs `BCrypt.Net-Next` to check the bcrypt hash the Node seed writes, **and** the EF `User` entity has no `PasswordHash` property. NuGet (`api.nuget.org`) is TLS-blocked on this network, so the package cannot be added. |
| **No MFA** | GAP-007 / H4 | Needs a TOTP library (`Otp.NET`) and `mfa_enabled` / `mfa_secret` on the EF model. Same NuGet block + model-expansion. |
| **No authentication/authorisation pipeline** (JwtBearer package referenced but never configured; `Program.cs` has no `AddAuthentication`/`UseAuthorization`) | C2 / GAP-002 | Buildable with the already-referenced `Microsoft.AspNetCore.Authentication.JwtBearer`, but deliberately **not** shipped half-done: without password verification, a default-deny gate is bypassable through the any-password login and would read as security theatre. Should land together with password verification. |
| **No RBAC / permission claims** (`permissions` claim is empty; no `Permission`/`RolePermission` entities) | GAP-011 / C2 authz | Needs new EF entities + mapping + a migration + seed alignment with `packages/database/src/seed-data/`. |

## Plan (run where NuGet is reachable)

1. Add packages: `BCrypt.Net-Next`, `Otp.NET`.
2. Expand the EF model: `User.PasswordHash`, `User.MfaEnabled`, `User.MfaSecret`;
   add `Permission` + `RolePermission` entities mapped to the existing shared
   tables; expose role → permission codes. Add a migration (the Node side already
   created these columns/tables, so against the shared PostgreSQL this is a model
   mapping, not a schema change).
3. `LoginHandler`: verify the password with `BCrypt.Verify`; return the same
   generic 401 on a missing user or wrong password, with an equalised timing path;
   populate the `permissions` claim; when `MfaEnabled`, return a short-lived
   `mfaRequired` challenge instead of an access token.
4. Add `POST /api/auth/verify-mfa` (TOTP check via `Otp.NET`) mirroring the Node
   endpoint, issuing the access token only on success.
5. `Program.cs`: `AddAuthentication().AddJwtBearer(...)` with the shared secret and
   `TokenValidationParameters` validating issuer, audience, lifetime
   (`RequireExpirationTime = true`, small `ClockSkew`) and signing key; then
   `UseAuthentication()` / `UseAuthorization()`, a default-deny
   `FallbackPolicy = RequireAuthenticatedUser()`, and `.AllowAnonymous()` on the
   public allow-list (`/`, `/api/health`, `/api/smoke-test`, `POST /api/auth/login`,
   `/api/auth/verify-mfa`, and the applicant-intake routes — mirroring
   `services/api-gateway/src/middleware/accessPolicy.ts`).
6. Per-resource authorisation on the staff endpoints, matching the Node mounts.
7. Tests: a `dotnet test` project asserting signed-token round-trips, password
   rejection, MFA gating, and 401/403 on protected routes.
