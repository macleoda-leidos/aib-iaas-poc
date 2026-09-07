import { issueAccessToken, generateKeyPairPem, resetSigningKeys } from '@aib-iaas/auth';
import { createRepositories } from '@aib-iaas/database';

/**
 * Bearer headers for service tests, now that every route carrying personal data
 * requires an authenticated caller.
 *
 * Ten test files previously asserted that these endpoints answered anonymous requests —
 * which was true, and was the finding. Closing GAP-002 turned 103 of those assertions
 * red, and that was the correct signal: a suite that goes green when access control is
 * added would mean the suite was never testing access control.
 *
 * Tokens are minted for **real seeded users** with **real sessions**, because
 * `authenticate` verifies the signature, looks the session up, and resolves permissions
 * from the database. A synthetic identity with a hand-written permission list satisfies
 * none of those three, and its acceptance was the original defect.
 */

const { users } = createRepositories();

/** Ensure a fixed keypair, so signing here and verifying in the service agree. */
export function useFixedSigningKeys(): void {
  const keys = generateKeyPairPem();
  process.env.JWT_PRIVATE_KEY = keys.privateKey;
  process.env.JWT_PUBLIC_KEY = keys.publicKey;
  resetSigningKeys();
}

export interface SeededIdentity {
  userId: string;
  email: string;
  role: string;
  roleLevel: number;
}

/** The seeded system administrator — holds every permission. */
export const ADMIN: SeededIdentity = {
  userId: 'user-admin',
  email: 'admin@aib-poc.example.com',
  role: 'system_admin',
  roleLevel: 100,
};

/** The seeded debtor — scoped to their own records, holds no staff permission. */
export const DEBTOR: SeededIdentity = {
  userId: 'user-debtor',
  email: 'john.testerton@example.com',
  role: 'debtor',
  roleLevel: 10,
};

/**
 * Mint a token for a seeded identity and register its session.
 *
 * Both steps are required: `authenticate` rejects a signed token with no matching
 * session row, which is what makes logout and revocation immediate.
 */
export async function bearerFor(identity: SeededIdentity = ADMIN): Promise<Record<string, string>> {
  const { token, expiresAt } = issueAccessToken({
    userId: identity.userId,
    email: identity.email,
    role: identity.role,
    roleLevel: identity.roleLevel,
  });
  await users.createSession(identity.userId, token, expiresAt);
  return { Authorization: `Bearer ${token}` };
}

/**
 * Set up fixed keys and return an admin bearer header. The one-liner most test files
 * need in `beforeAll`.
 */
export async function adminHeaders(): Promise<Record<string, string>> {
  useFixedSigningKeys();
  return bearerFor(ADMIN);
}
