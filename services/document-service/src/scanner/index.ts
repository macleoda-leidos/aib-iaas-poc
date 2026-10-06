import { VirusScanner } from './interface';
import { ClamAVScanner } from './clamav';
import { PlaceholderScanner } from './placeholder';

export type { ScanResult, VirusScanner } from './interface';

/**
 * Scanner Factory — fail closed.
 *
 * Configure via SCANNER_MODE:
 *   - 'clamav': require ClamAV (throws if unavailable)
 *   - 'auto' (default): use ClamAV when available, otherwise throw — it never
 *     silently downgrades to the placeholder. The old 'auto' fallback meant a
 *     deployment with no ClamAV would scan nothing while reporting files clean
 *     (H2 / a fail-open). Refusing to scan is safer than pretending to.
 *   - 'placeholder': the simulated scanner, for local dev and tests only. It is
 *     explicitly refused under NODE_ENV=production so it can never ship as the
 *     real virus scanner.
 */
let scanner: VirusScanner | null = null;

export async function getScanner(): Promise<VirusScanner> {
  if (scanner) return scanner;

  const mode = process.env.SCANNER_MODE || 'auto';

  if (mode === 'placeholder') {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SCANNER_MODE=placeholder is refused in production — configure a real ClamAV scanner.');
    }
    scanner = new PlaceholderScanner();
    console.log('[Scanner] Using placeholder scanner (SCANNER_MODE=placeholder, non-production)');
    return scanner;
  }

  if (mode === 'clamav' || mode === 'auto') {
    const clamav = new ClamAVScanner();
    if (await clamav.isAvailable()) {
      scanner = clamav;
      console.log('[Scanner] ClamAV connected and available');
      return scanner;
    }
    // Fail closed — no silent placeholder fallback.
    throw new Error(
      `ClamAV is not available (SCANNER_MODE=${mode}). Run ClamAV, or set SCANNER_MODE=placeholder in non-production environments.`
    );
  }

  throw new Error(`Unknown SCANNER_MODE "${mode}". Use clamav, auto, or placeholder.`);
}
