import {
  createPrivateKey,
  createPublicKey,
  generateKeyPairSync,
  type KeyObject,
} from 'crypto';

/**
 * The Ed25519 keypair used to sign and verify access tokens.
 *
 * Ed25519 rather than RSA because it needs no key-size decision, produces a
 * 64-byte signature, and — the reason it matters here — is native to Node's
 * `crypto`, so signed tokens cost this project no new dependency. Adding a
 * supply-chain dependency to fix a security finding is a poor trade when the
 * platform already ships the primitive.
 *
 * Asymmetric rather than HMAC because verification and signing are separable: the
 * services that only *check* tokens need the public key alone, so a future split
 * into separate deployments does not require sharing a secret that can mint
 * credentials.
 */

let cached: { privateKey: KeyObject; publicKey: KeyObject; ephemeral: boolean } | null = null;

/**
 * PEM in an environment variable is awkward — newlines get mangled by most
 * dashboards — so a base64-wrapped PEM is accepted as well. Detected rather than
 * configured: a PEM always begins with `-----BEGIN`.
 */
function readPem(value: string): string {
  const trimmed = value.trim();
  if (trimmed.startsWith('-----BEGIN')) return trimmed;
  return Buffer.from(trimmed, 'base64').toString('utf8');
}

/**
 * Resolve the signing keypair once per process.
 *
 * With `JWT_PRIVATE_KEY` set, tokens survive a restart and can be verified by any
 * process holding `JWT_PUBLIC_KEY`. Without it, a keypair is generated for this
 * process only — which is safe (tokens are still signed and still verified) but
 * has two consequences that are logged rather than left to be discovered:
 *
 *  - every restart invalidates every issued token, and
 *  - separate processes cannot verify each other's tokens, so running the twelve
 *    services individually (`npm run dev:services`) needs the env vars set, while
 *    the single deployed container does not.
 *
 * What it deliberately does *not* do is fall back to accepting unsigned tokens.
 * A misconfigured deployment must fail closed and loudly, not quietly return to
 * the behaviour this replaces.
 */
export function getSigningKeys(): { privateKey: KeyObject; publicKey: KeyObject; ephemeral: boolean } {
  if (cached) return cached;

  const privatePem = process.env.JWT_PRIVATE_KEY;
  const publicPem = process.env.JWT_PUBLIC_KEY;

  if (privatePem) {
    const privateKey = createPrivateKey(readPem(privatePem));
    // Derived from the private key when no public key is supplied — they cannot
    // then disagree, which is a surprisingly easy way to deploy a service that
    // rejects every token it issues.
    const publicKey = publicPem ? createPublicKey(readPem(publicPem)) : createPublicKey(privateKey);
    cached = { privateKey, publicKey, ephemeral: false };
    return cached;
  }

  const generated = generateKeyPairSync('ed25519');
  console.warn(
    '[auth] JWT_PRIVATE_KEY is not set — generated an ephemeral signing key for this process. ' +
      'Tokens will not survive a restart and cannot be verified by other processes. ' +
      'Set JWT_PRIVATE_KEY (and JWT_PUBLIC_KEY) in any environment that outlives a demo.'
  );
  cached = { privateKey: generated.privateKey, publicKey: generated.publicKey, ephemeral: true };
  return cached;
}

/** Test seam: forces the next `getSigningKeys()` to re-read the environment. */
export function resetSigningKeys(): void {
  cached = null;
}

/**
 * A fresh Ed25519 keypair as PEM strings, for populating the environment.
 * Used by `npm run auth:keygen` and by tests that need a stable key.
 */
export function generateKeyPairPem(): { privateKey: string; publicKey: string } {
  const { privateKey, publicKey } = generateKeyPairSync('ed25519');
  return {
    privateKey: privateKey.export({ type: 'pkcs8', format: 'pem' }).toString(),
    publicKey: publicKey.export({ type: 'spki', format: 'pem' }).toString(),
  };
}
