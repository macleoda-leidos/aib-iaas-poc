// RFC 6238 TOTP (HMAC-SHA-1, 6 digits, 30-second step) computed in the browser
// with Web Crypto. These are exactly otplib's authenticator defaults, so a code
// produced here verifies against the server's @aib-iaas/auth.verifyTotpCode.
//
// This exists for one reason: the scripted client demo signs in as a known demo
// account and has to clear a *real* second factor. Real users' TOTP secrets are
// per-user and never leave the server; only the public demo secret is computed
// here (see DEMO_MFA_SECRET in the login page and @aib-iaas/auth).

function base32Decode(input: string): Uint8Array {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const clean = input.toUpperCase().replace(/=+$/, '').replace(/\s/g, '');
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of clean) {
    const idx = alphabet.indexOf(ch);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      out.push((value >>> bits) & 0xff);
    }
  }
  return new Uint8Array(out);
}

export async function generateTotp(secret: string, forTimeMs: number = Date.now()): Promise<string> {
  const key = base32Decode(secret);
  const counter = Math.floor(forTimeMs / 1000 / 30);

  // 8-byte big-endian counter.
  const buf = new ArrayBuffer(8);
  const view = new DataView(buf);
  view.setUint32(0, Math.floor(counter / 2 ** 32), false);
  view.setUint32(4, counter >>> 0, false);

  const cryptoKey = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
  const hmac = new Uint8Array(await crypto.subtle.sign('HMAC', cryptoKey, buf));

  // Dynamic truncation (RFC 4226 §5.3).
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return (binary % 1_000_000).toString().padStart(6, '0');
}
