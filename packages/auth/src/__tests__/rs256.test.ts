import { describe, it, expect } from 'vitest';
import {
  generateRsaKeyPair,
  signRs256,
  verifyRs256,
  buildJwks,
  TokenError,
  TOKEN_EXPIRED,
} from '../index';

/**
 * The asymmetric verification path federation needs: the IdP signs RS256 with a
 * private key, the API verifies against the public key it fetched from the IdP's
 * JWKS, and a token from any other key is rejected. HS256 remains the POC
 * default — this proves the production shape works and is covered.
 */
describe('RS256 / JWKS federation foundation', () => {
  const idp = generateRsaKeyPair();
  const claims = { userId: 'u1', email: 'a@b.example', role: 'system_admin', roleLevel: 100, permissions: ['system.admin'] };

  it('signs with the private key and verifies with the public key', () => {
    const token = signRs256(claims, idp.privateKey);
    const verified = verifyRs256<typeof claims & { exp: number }>(token, idp.publicKey);
    expect(verified.userId).toBe('u1');
    expect(verified.role).toBe('system_admin');
    expect(typeof verified.exp).toBe('number');
  });

  it('publishes a JWKS entry for the public key', () => {
    const jwks = buildJwks(idp.publicKey, 'idp-key-1');
    expect(jwks.keys).toHaveLength(1);
    expect(jwks.keys[0].kty).toBe('RSA');
    expect(jwks.keys[0].alg).toBe('RS256');
    expect(jwks.keys[0].use).toBe('sig');
    expect(jwks.keys[0].kid).toBe('idp-key-1');
    expect(jwks.keys[0].n).toBeTruthy(); // modulus present
    expect(jwks.keys[0].e).toBeTruthy(); // exponent present
  });

  it('rejects a token signed by a different key (forgery / wrong IdP)', () => {
    const attacker = generateRsaKeyPair();
    const forged = signRs256(claims, attacker.privateKey);
    expect(() => verifyRs256(forged, idp.publicKey)).toThrow(TokenError);
  });

  it('rejects an expired RS256 token with the TOKEN_EXPIRED sentinel', () => {
    const token = signRs256(claims, idp.privateKey, { expiresInSeconds: -10 });
    try {
      verifyRs256(token, idp.publicKey);
      throw new Error('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(TokenError);
      expect((err as TokenError).code).toBe(TOKEN_EXPIRED);
    }
  });

  it('rejects a garbage token', () => {
    expect(() => verifyRs256('not-a-jwt', idp.publicKey)).toThrow(TokenError);
  });
});
