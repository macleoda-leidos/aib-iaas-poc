import { VirusScanner } from './interface';
import { ClamAVScanner } from './clamav';
import { PlaceholderScanner } from './placeholder';

export type { ScanResult, VirusScanner } from './interface';

/**
 * Scanner Factory
 *
 * Attempts to use ClamAV if available, falls back to placeholder.
 * Configure via SCANNER_MODE env var:
 *   - 'clamav': Force ClamAV (fails if unavailable)
 *   - 'placeholder': Always use placeholder
 *   - 'auto' (default): Try ClamAV, fallback to placeholder
 */
let scanner: VirusScanner | null = null;

export async function getScanner(): Promise<VirusScanner> {
  if (scanner) return scanner;

  const mode = process.env.SCANNER_MODE || 'auto';

  if (mode === 'placeholder') {
    scanner = new PlaceholderScanner();
    console.log('[Scanner] Using placeholder scanner (SCANNER_MODE=placeholder)');
    return scanner;
  }

  if (mode === 'clamav' || mode === 'auto') {
    const clamav = new ClamAVScanner();
    const available = await clamav.isAvailable();

    if (available) {
      scanner = clamav;
      console.log('[Scanner] ClamAV connected and available');
      return scanner;
    }

    if (mode === 'clamav') {
      throw new Error('ClamAV is configured but not available. Check CLAMAV_HOST and CLAMAV_PORT.');
    }

    // Auto mode: fallback to placeholder
    scanner = new PlaceholderScanner();
    console.log('[Scanner] ClamAV not available, falling back to placeholder scanner');
    return scanner;
  }

  scanner = new PlaceholderScanner();
  return scanner;
}
