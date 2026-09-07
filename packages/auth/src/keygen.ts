import { generateKeyPairPem } from './keys';

/**
 * Print a fresh Ed25519 keypair in the two forms a deployment needs.
 *
 * Run with `npm run auth:keygen`. The base64 block is the one to paste into a
 * hosting dashboard: PEM is multi-line, and most dashboards either reject the
 * newlines or store them mangled, which produces a service that fails to parse
 * its own key at boot.
 *
 * The private key is printed to stdout, so treat the output as a secret: do not
 * paste it into a ticket, and do not commit it.
 */
const { privateKey, publicKey } = generateKeyPairPem();

console.log('# Ed25519 signing keypair for IAAS access tokens.');
console.log('# Set these on every service that issues or verifies a token.');
console.log('# Treat JWT_PRIVATE_KEY as a secret — it can mint any session.\n');

console.log('## PEM form\n');
console.log(`JWT_PRIVATE_KEY="${privateKey.trimEnd()}"\n`);
console.log(`JWT_PUBLIC_KEY="${publicKey.trimEnd()}"\n`);

console.log('## Base64 form — use this for dashboards that mangle newlines\n');
console.log(`JWT_PRIVATE_KEY=${Buffer.from(privateKey).toString('base64')}\n`);
console.log(`JWT_PUBLIC_KEY=${Buffer.from(publicKey).toString('base64')}`);
