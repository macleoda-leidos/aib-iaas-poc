import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createHmac, generateKeyPairSync, sign as cryptoSign } from 'crypto';
import { issueAccessToken, verifyAccessToken } from '../jwt';
import { generateKeyPairPem, getSigningKeys, resetSigningKeys } from '../keys';

/**
 * These tokens are the only thing standing between a request and an admin
 * session, so the tests that matter are the forgery attempts rather than the
 * round trip. The implementation replaces an unsigned base64 payload that any
 * client could rewrite at will; each case below is a way of getting that
 * behaviour back by accident.
 */

const original = { priv: process.env.JWT_PRIVATE_KEY, pub: process.env.JWT_PUBLIC_KEY };
let keys: { privateKey: string; publicKey: string };

function base64Url(input: string): string {
  return Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decodePayload(token: string): any {
  return JSON.parse(Buffer.from(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString());
}

beforeAll(() => {
  // A fixed keypair in the environment, so signing and verification are stable
  // across the file and the ephemeral-key path is tested explicitly instead of
  // by accident.
  keys = generateKeyPairPem();
});

beforeEach(() => {
  process.env.JWT_PRIVATE_KEY = keys.privateKey;
  process.env.JWT_PUBLIC_KEY = keys.publicKey;
  resetSigningKeys();
});

afterAll(() => {
  if (original.priv === undefined) delete process.env.JWT_PRIVATE_KEY;
  else process.env.JWT_PRIVATE_KEY = original.priv;
  if (original.pub === undefined) delete process.env.JWT_PUBLIC_KEY;
  else process.env.JWT_PUBLIC_KEY = original.pub;
  resetSigningKeys();
});

const subject = {
  userId: 'user-admin',
  email: 'admin@aib-poc.example.com',
  role: 'system_admin',
  roleLevel: 100,
  organisationId: 'org-aib',
};

describe('issueAccessToken', () => {
  it('produces a three-part JWT that verifies', () => {
    const { token } = issueAccessToken(subject);
    expect(token.split('.')).toHaveLength(3);

    const result = verifyAccessToken(token);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.claims.sub).toBe('user-admin');
      expect(result.claims.role).toBe('system_admin');
      expect(result.claims.roleLevel).toBe(100);
      expect(result.claims.organisationId).toBe('org-aib');
    }
  });

  it('declares EdDSA in the header', () => {
    const { token } = issueAccessToken(subject);
    const header = JSON.parse(Buffer.from(token.split('.')[0], 'base64').toString());
    expect(header).toEqual({ alg: 'EdDSA', typ: 'JWT' });
  });

  it('carries no permission list', () => {
    // The whole point of resolving authorisation per request. A permissions claim
    // here would be a snapshot taken at login, so a revoked grant would keep
    // working until the token expired.
    const { token } = issueAccessToken(subject);
    expect(decodePayload(token)).not.toHaveProperty('permissions');
  });

  it('stamps exp in seconds, not milliseconds', () => {
    // The token this replaces used Date.now() milliseconds in `exp`. Mixing the
    // two units silently yields a token that either never expires or is born
    // expired, depending on which side gets it wrong.
    const now = new Date('2026-09-04T12:00:00.000Z');
    const { claims } = issueAccessToken({ ...subject, now, ttlSeconds: 3600 });
    expect(claims.iat).toBe(Math.floor(now.getTime() / 1000));
    expect(claims.exp).toBe(claims.iat + 3600);
    // Seconds since epoch in 2026 is ten digits; milliseconds would be thirteen.
    expect(String(claims.exp)).toHaveLength(10);
  });

  it('reports expiresAt as an ISO string matching exp', () => {
    const now = new Date('2026-09-04T12:00:00.000Z');
    const { claims, expiresAt } = issueAccessToken({ ...subject, now, ttlSeconds: 60 });
    expect(expiresAt).toBe(new Date(claims.exp * 1000).toISOString());
    expect(expiresAt).toBe('2026-09-04T12:01:00.000Z');
  });

  it('gives every token a distinct jti', () => {
    // The jti is the session handle, so a collision would let one logout revoke
    // someone else's session.
    const seen = new Set(Array.from({ length: 50 }, () => issueAccessToken(subject).jti));
    expect(seen.size).toBe(50);
  });

  it('defaults roleLevel to 0 and organisationId to null', () => {
    const { claims } = issueAccessToken({ userId: 'u', email: 'e@x', role: 'applicant' });
    expect(claims.roleLevel).toBe(0);
    expect(claims.organisationId).toBeNull();
  });
});

describe('verifyAccessToken — forgery and tampering', () => {
  it('rejects a payload edited to escalate role', () => {
    // The exact attack the old token allowed: decode, change the role, re-encode.
    const { token } = issueAccessToken({ ...subject, role: 'applicant', roleLevel: 10 });
    const [header, payload, signature] = token.split('.');
    const tampered = JSON.parse(Buffer.from(payload, 'base64').toString());
    tampered.role = 'system_admin';
    tampered.roleLevel = 100;

    const forged = `${header}.${base64Url(JSON.stringify(tampered))}.${signature}`;
    expect(verifyAccessToken(forged)).toEqual({ valid: false, reason: 'bad-signature' });
  });

  it('rejects a token with no signature at all', () => {
    const { token } = issueAccessToken(subject);
    const [header, payload] = token.split('.');
    expect(verifyAccessToken(`${header}.${payload}.`)).toEqual({ valid: false, reason: 'malformed' });
  });

  it('rejects alg: none', () => {
    // The canonical JWT bypass. Sent with an *empty* signature it is already
    // refused as malformed (covered above), so this carries a non-empty one — which
    // proves the alg gate itself fires, rather than the token happening to trip an
    // earlier structural check. The gate runs before any signature verification is
    // attempted, so an attacker-chosen algorithm is never handed to crypto at all.
    const header = base64Url(JSON.stringify({ alg: 'none', typ: 'JWT' }));
    const payload = base64Url(JSON.stringify({ sub: 'user-admin', jti: 'x', exp: 9999999999, iss: 'aib-iaas', aud: 'aib-iaas-api' }));
    expect(verifyAccessToken(`${header}.${payload}.${base64Url('anything')}`)).toEqual({
      valid: false,
      reason: 'unsupported-algorithm',
    });
  });

  it('rejects HS256 signed with the public key as the HMAC secret', () => {
    // Algorithm substitution. With an asymmetric key the public half is not a
    // secret, so a verifier that honours the header's alg can be made to accept a
    // token anyone can mint.
    const header = base64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = base64Url(JSON.stringify({ sub: 'user-admin', jti: 'x', exp: 9999999999, iss: 'aib-iaas', aud: 'aib-iaas-api' }));
    const signature = createHmac('sha256', keys.publicKey)
      .update(`${header}.${payload}`)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    expect(verifyAccessToken(`${header}.${payload}.${signature}`)).toEqual({
      valid: false,
      reason: 'unsupported-algorithm',
    });
  });

  it('rejects a token signed by a different Ed25519 key', () => {
    // Right algorithm, wrong signer — someone who generated their own keypair.
    const attacker = generateKeyPairSync('ed25519');
    const header = base64Url(JSON.stringify({ alg: 'EdDSA', typ: 'JWT' }));
    const payload = base64Url(JSON.stringify({ sub: 'user-admin', jti: 'x', exp: 9999999999, iss: 'aib-iaas', aud: 'aib-iaas-api' }));
    const signature = cryptoSign(null, Buffer.from(`${header}.${payload}`), attacker.privateKey)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    expect(verifyAccessToken(`${header}.${payload}.${signature}`)).toEqual({
      valid: false,
      reason: 'bad-signature',
    });
  });

  it('rejects the bare base64 JSON the old scheme used', () => {
    // A client still sending the previous token format must be refused, not
    // treated as unauthenticated-but-fine or, worse, parsed.
    const legacy = Buffer.from(
      JSON.stringify({ userId: 'user-admin', role: 'system_admin', permissions: ['reports.read'], exp: Date.now() + 3600000 })
    ).toString('base64');

    const result = verifyAccessToken(legacy);
    expect(result.valid).toBe(false);
  });

  it.each([
    ['too short', base64Url('short')],
    ['empty after decoding', ''],
    ['far too long', Buffer.alloc(200).toString('base64url')],
  ])('rejects a signature of the wrong length (%s) without throwing', (_label, signature) => {
    // Node's Ed25519 verify returns false for any wrong-length signature rather
    // than throwing, so these land on `bad-signature` — but the call is wrapped
    // regardless, because an unguarded throw here would turn a bad token into a
    // 500 and hand an attacker a way to tell malformed from merely wrong.
    const { token } = issueAccessToken(subject);
    const [header, payload] = token.split('.');
    const candidate = `${header}.${payload}.${signature}`;
    expect(() => verifyAccessToken(candidate)).not.toThrow();
    expect(verifyAccessToken(candidate).valid).toBe(false);
  });

  it('rejects rather than crashing when the configured public key is not Ed25519', () => {
    // The path the try/catch around verify actually exists for: a JWT_PUBLIC_KEY
    // that parses as a key but cannot verify this algorithm. Misconfiguration must
    // fail closed as a rejected token, not as a 500 on every request.
    const { token } = issueAccessToken(subject);
    const rsa = generateKeyPairSync('rsa', { modulusLength: 2048 });
    process.env.JWT_PUBLIC_KEY = rsa.publicKey.export({ type: 'spki', format: 'pem' }).toString();
    resetSigningKeys();

    expect(() => verifyAccessToken(token)).not.toThrow();
    expect(verifyAccessToken(token)).toEqual({ valid: false, reason: 'bad-signature' });
  });

  it.each([
    ['empty string', ''],
    ['one part', 'abc'],
    ['two parts', 'abc.def'],
    ['four parts', 'a.b.c.d'],
    ['non-base64 payload', `${base64Url('{"alg":"EdDSA","typ":"JWT"}')}.!!!.sig`],
  ])('rejects a malformed token: %s', (_label, token) => {
    const result = verifyAccessToken(token);
    expect(result.valid).toBe(false);
  });

  it('rejects a validly signed token that omits sub or jti', () => {
    // Signed by us, but missing the identity the caller will go on to trust.
    // Without this the middleware would look up `undefined` as a user id.
    const header = base64Url(JSON.stringify({ alg: 'EdDSA', typ: 'JWT' }));
    const payload = base64Url(JSON.stringify({ email: 'a@b', exp: 9999999999, iss: 'aib-iaas', aud: 'aib-iaas-api' }));
    const signature = cryptoSign(null, Buffer.from(`${header}.${payload}`), getSigningKeys().privateKey)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    expect(verifyAccessToken(`${header}.${payload}.${signature}`)).toEqual({
      valid: false,
      reason: 'malformed',
    });
  });
});

describe('verifyAccessToken — registered claims', () => {
  it('rejects an expired token', () => {
    const issuedAt = new Date('2026-09-04T12:00:00.000Z');
    const { token } = issueAccessToken({ ...subject, now: issuedAt, ttlSeconds: 60 });
    const afterExpiry = new Date('2026-09-04T12:01:01.000Z');
    expect(verifyAccessToken(token, { now: afterExpiry })).toEqual({ valid: false, reason: 'expired' });
  });

  it('rejects a token exactly at its expiry second', () => {
    // Boundary stated explicitly: exp is the first second at which the token is
    // no longer usable, so `exp <= now` fails rather than `exp < now`.
    const issuedAt = new Date('2026-09-04T12:00:00.000Z');
    const { token, claims } = issueAccessToken({ ...subject, now: issuedAt, ttlSeconds: 60 });
    expect(verifyAccessToken(token, { now: new Date(claims.exp * 1000) })).toEqual({
      valid: false,
      reason: 'expired',
    });
    expect(verifyAccessToken(token, { now: new Date((claims.exp - 1) * 1000) }).valid).toBe(true);
  });

  it('distinguishes expired from invalid', () => {
    // These are different messages to a user ("log in again" vs "that is not a
    // token of ours") and different signals in a log, so the reasons must not
    // collapse into one.
    const { token } = issueAccessToken({ ...subject, ttlSeconds: -1 });
    expect(verifyAccessToken(token)).toEqual({ valid: false, reason: 'expired' });

    // Narrowed rather than reaching for `.reason` on the union: the result type is
    // discriminated on `valid`, so an unnarrowed access does not typecheck under the
    // project's strict mode even though it happens to work at runtime.
    const garbage = verifyAccessToken('garbage.garbage.garbage');
    expect(garbage.valid).toBe(false);
    if (!garbage.valid) expect(garbage.reason).not.toBe('expired');
  });

  it('rejects a token minted for another issuer or audience', () => {
    // Stops a token from an unrelated system that happens to share our key
    // material from being replayed at this API.
    for (const [field, value, reason] of [
      ['iss', 'someone-else', 'wrong-issuer'],
      ['aud', 'another-api', 'wrong-audience'],
    ] as const) {
      const header = base64Url(JSON.stringify({ alg: 'EdDSA', typ: 'JWT' }));
      const claims: any = {
        sub: 'user-admin', jti: 'j', exp: 9999999999, iss: 'aib-iaas', aud: 'aib-iaas-api',
      };
      claims[field] = value;
      const payload = base64Url(JSON.stringify(claims));
      const signature = cryptoSign(null, Buffer.from(`${header}.${payload}`), getSigningKeys().privateKey)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      expect(verifyAccessToken(`${header}.${payload}.${signature}`)).toEqual({ valid: false, reason });
    }
  });
});

describe('signing keys', () => {
  it('accepts a base64-wrapped PEM', () => {
    // Most deployment dashboards mangle multi-line values, so the base64 form is
    // the one that actually gets used.
    process.env.JWT_PRIVATE_KEY = Buffer.from(keys.privateKey).toString('base64');
    process.env.JWT_PUBLIC_KEY = Buffer.from(keys.publicKey).toString('base64');
    resetSigningKeys();

    const { token } = issueAccessToken(subject);
    expect(verifyAccessToken(token).valid).toBe(true);
  });

  it('derives the public key when only the private key is set', () => {
    // Supplying a mismatched pair is an easy way to deploy a service that rejects
    // every token it issues; deriving removes the opportunity.
    delete process.env.JWT_PUBLIC_KEY;
    process.env.JWT_PRIVATE_KEY = keys.privateKey;
    resetSigningKeys();

    const { token } = issueAccessToken(subject);
    expect(verifyAccessToken(token).valid).toBe(true);
  });

  it('generates an ephemeral key when none is configured, and still signs', () => {
    // The fallback must never be "stop checking signatures". It is allowed to lose
    // tokens on restart; it is not allowed to accept forgeries.
    delete process.env.JWT_PRIVATE_KEY;
    delete process.env.JWT_PUBLIC_KEY;
    resetSigningKeys();

    expect(getSigningKeys().ephemeral).toBe(true);
    const { token } = issueAccessToken(subject);
    expect(verifyAccessToken(token).valid).toBe(true);
    expect(verifyAccessToken(`${token.slice(0, -4)}AAAA`).valid).toBe(false);
  });

  it('caches the keypair so repeated calls agree', () => {
    // Re-reading the environment per call would regenerate the ephemeral key and
    // invalidate the token issued a moment earlier.
    expect(getSigningKeys()).toBe(getSigningKeys());
  });

  it('generates a usable PEM pair for populating the environment', () => {
    const pair = generateKeyPairPem();
    expect(pair.privateKey).toContain('-----BEGIN PRIVATE KEY-----');
    expect(pair.publicKey).toContain('-----BEGIN PUBLIC KEY-----');
  });
});
